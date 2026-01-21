import { Inject, Injectable } from '@nestjs/common';
import { BulkRefundPaymentCommand } from '../commands/bulk-refund-payment.command';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for bulk refunding payments
 */
@Injectable()
export class BulkRefundPaymentUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentServicePort: StripePaymentServicePort,
  ) {}

  async execute(command: BulkRefundPaymentCommand) {
    return this.stripePaymentServicePort.bulkRefundPaymentIntents(
      command.paymentIntentIds,
    );
  }
}
