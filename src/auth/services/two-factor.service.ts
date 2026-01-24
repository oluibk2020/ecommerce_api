import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string): {
    secret: string;
    qrCode: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `DeluxeFloormate (${email})`,
      issuer: 'DeluxeFloormate',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: `${secret.otpauth_url}`, // Will generate QR code from this
    };
  }

  async generateQRCode(otpauthUrl: string): Promise<string> {
    return await QRCode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 30 seconds before and after
    });
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  verifyBackupCode(
    backupCodes: string[],
    code: string,
  ): { valid: boolean; remainingCodes: string[] } {
    const index = backupCodes.indexOf(code);
    if (index === -1) {
      return { valid: false, remainingCodes: backupCodes };
    }

    const remaining = backupCodes.filter((_, i) => i !== index);
    return { valid: true, remainingCodes: remaining };
  }
}
