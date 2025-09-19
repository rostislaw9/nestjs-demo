import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class AuthService {
  private readonly app: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('firebase.serviceAccountBase64');

    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not set');
    }

    const serviceAccount = JSON.parse(
      Buffer.from(raw, 'base64').toString('utf-8'),
    ) as admin.ServiceAccount;

    this.app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async verifyToken(idToken: string): Promise<DecodedIdToken> {
    try {
      const decoded = await this.app.auth().verifyIdToken(idToken);
      return decoded;
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  getApp(): admin.app.App {
    return this.app;
  }
}
