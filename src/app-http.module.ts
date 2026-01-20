import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { StripeModule } from './modules/stripe/stripe.module';

@Module({
  imports: [AuthModule, StripeModule]
})
export class AppHttpModule { }
