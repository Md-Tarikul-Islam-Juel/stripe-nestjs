import { Inject, Injectable } from '@nestjs/common';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';
import { ConfirmPaymentIntentCommand } from '../commands/confirm-payment-intent.command';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';

/**
 * Use case for confirming a payment intent
 */
@Injectable()
export class ConfirmPaymentIntentUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentServicePort: StripePaymentServicePort,
  ) {}

  async execute(command: ConfirmPaymentIntentCommand) {
    return this.stripePaymentServicePort.confirmPaymentIntent(
      command.paymentIntentId,
      command.paymentMethodId,
    );
  }
}
