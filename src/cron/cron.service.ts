import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'; // type-only import to avoid "value is never read" warning
import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter } from 'events';
import { TransactionStatus } from '../helpers/general-enum';

@Injectable()
export class CronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronService.name);
  private task?: ScheduledTask;

  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
    private eventEmiter: EventEmitter,
  ) {}

  onModuleInit(): void {
    // schedule at minute 0 of every hour
    this.task = cron.schedule(
      '0 * * * *',
      () => {
        this.logger.log('Starting hourly pending->failed order job');
        this.processPendingOrders().catch((err) => {
          this.logger.error('Error processing pending orders', err);
        });
      }, // intentionally using 2-arg overload to avoid typing mismatch for options
    );

    this.logger.log('Cron task scheduled: hourly pending->failed order job');
  }

  async onModuleDestroy(): Promise<void> {
    // safe stop using optional chaining
    await this.task?.stop();
    this.logger.log('Cron task stopped');
  }

  private async processPendingOrders(): Promise<void> {
    // fetch pending orders created in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const pendingOrders = await this.prisma.order.findMany({
      where: {
        transactionStatus: TransactionStatus.pending,
        createdAt: { gte: oneHourAgo }, // only orders created in the last hour
      },
      include: {
        user: { select: { email: true, firstName: true } },
        orderItems: { select: { productId: true, quantity: true } },
      },
    });

    if (pendingOrders.length === 0) {
      this.logger.log('No pending orders found (last 1 hour)');
      return;
    }

    const ids = pendingOrders.map((o) => o.id);

    // 2) update them to FAILED
    const res = await this.prisma.order.updateMany({
      where: { id: { in: ids } },
      data: { transactionStatus: TransactionStatus.failed },
    });

    this.logger.log(`Updated ${res.count} orders from PENDING to FAILED`);

    // 3) restock products
    for (const order of pendingOrders) {
      for (const orderItem of order.orderItems) {
        await this.prisma.product.update({
          where: { id: orderItem.productId },
          data: { quantity: { increment: orderItem.quantity } },
        });
      }
    }

    this.logger.log(`Restocked products for ${pendingOrders.length} orders`);

    // 4) notify users (optional). Send one email per updated order.
    for (const order of pendingOrders) {
      try {
        const recipient = order.user?.email;
        if (!recipient) continue;

        await this.emailService.mailHandler(
          'Order marked as failed',
          `Hello ${order.user.firstName ?? ''},\n\nYour order #${order.id} has been marked as failed. If you believe this is an error please contact support.`,
          recipient,
          'Order Status: Failed',
        );

        // optional: emit an event for other parts of the app
        this.eventEmiter.emit('order.failed', {
          orderId: order.id,
          userEmail: recipient,
        });
      } catch (err) {
        this.logger.error(`Failed to send email for order ${order.id}`, err);
      }
    }
  }
}
