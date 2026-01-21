import { Inject, Injectable } from '@nestjs/common';
import { RefundPaymentCommand } from '../commands/refund-payment.command';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for refunding a payment
 */
@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentServicePort: StripePaymentServicePort,
  ) {}

  async execute(command: RefundPaymentCommand) {
    // Convert amount from dollars to cents if provided
    const amountInCents = command.amount
      ? Math.round(command.amount * 100)
      : undefined;

    // Map reason enum to Stripe's expected format
    const reason = command.reason
      ? (command.reason as 'duplicate' | 'fraudulent' | 'requested_by_customer')
      : undefined;

    return this.stripePaymentServicePort.refundPayment({
      paymentIntentId: command.paymentIntentId,
      amount: amountInCents,
      reason,
      metadata: command.metadata,
      reverseTransfer: command.reverseTransfer,
      refundApplicationFee: command.refundApplicationFee,
    });
  }
}
