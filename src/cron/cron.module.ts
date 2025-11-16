import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { EmailService } from 'src/email/email.service';
import { EventEmitter } from 'events';

@Module({
  providers: [CronService, EmailService, EventEmitter],
})
export class CronModule {}
