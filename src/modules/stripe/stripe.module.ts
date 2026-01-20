import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  STRIPE_CONNECT_SERVICE_PORT,
  STRIPE_PAYMENT_SERVICE_PORT,
} from './application/di-tokens';
// Application Services (Facades)
import { StripePaymentService } from './application/services/stripe-payment.service';
import { StripeConnectService } from './application/services/stripe-connect.service';
// Use Cases (used by services)
import { BulkRefundPaymentUseCase } from './application/use-cases/bulk-refund-payment.use-case';
import { CancelPaymentUseCase } from './application/use-cases/cancel-payment.use-case';
import { CapturePaymentUseCase } from './application/use-cases/capture-payment.use-case';
import { ConfirmPaymentIntentUseCase } from './application/use-cases/confirm-payment-intent.use-case';
import { CreateAccountLinkUseCase } from './application/use-cases/create-account-link.use-case';
import { CreateConnectAccountUseCase } from './application/use-cases/create-connect-account.use-case';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { CreateExternalBankAccountUseCase } from './application/use-cases/create-external-bank-account.use-case';
import { CreatePaymentIntentUseCase } from './application/use-cases/create-payment-intent.use-case';
import { CreatePayoutUseCase } from './application/use-cases/create-payout.use-case';
import { CreateSetupIntentUseCase } from './application/use-cases/create-setup-intent.use-case';
import { GetPaymentIntentStatusUseCase } from './application/use-cases/get-payment-intent-status.use-case';
import { RefundPaymentUseCase } from './application/use-cases/refund-payment.use-case';
import { SavePaymentMethodUseCase } from './application/use-cases/save-payment-method.use-case';
// Infrastructure Adapters
import { StripePaymentAdapter } from './infrastructure/stripe/stripe-payment.adapter';
import { StripeConnectAdapter } from './infrastructure/stripe/stripe-connect.adapter';
// Interface
import { StripeController } from './interface/http/stripe.controller';
import { RawBodyMiddleware } from './interface/http/middleware/raw-body.middleware';

/**
 * Stripe Module
 * Provides Stripe payment and Connect functionality
 * Following Clean Architecture with use-cases pattern
 */
@Module({
  imports: [ConfigModule],
  controllers: [StripeController],
  providers: [
    // Repository Adapters (Infrastructure)
    {
      provide: STRIPE_PAYMENT_SERVICE_PORT,
      useClass: StripePaymentAdapter,
    },
    {
      provide: STRIPE_CONNECT_SERVICE_PORT,
      useClass: StripeConnectAdapter,
    },
    // Application Use Cases
    CreatePaymentIntentUseCase,
    ConfirmPaymentIntentUseCase,
    CapturePaymentUseCase,
    CancelPaymentUseCase,
    RefundPaymentUseCase,
    BulkRefundPaymentUseCase,
    GetPaymentIntentStatusUseCase,
    CreateCustomerUseCase,
    CreateSetupIntentUseCase,
    SavePaymentMethodUseCase,
    CreateConnectAccountUseCase,
    CreateAccountLinkUseCase,
    CreateExternalBankAccountUseCase,
    CreatePayoutUseCase,
    // Application Services (Facades - call use-cases)
    StripePaymentService,
    StripeConnectService,
  ],
  exports: [
    // Export services for use in other modules
    StripePaymentService,
    StripeConnectService,
    // Export repositories for use in other modules if needed
    STRIPE_PAYMENT_SERVICE_PORT,
    STRIPE_CONNECT_SERVICE_PORT,
  ],
})
export class StripeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply raw body middleware for webhook endpoints
    consumer.apply(RawBodyMiddleware).forRoutes('stripe/webhook');
  }
}
