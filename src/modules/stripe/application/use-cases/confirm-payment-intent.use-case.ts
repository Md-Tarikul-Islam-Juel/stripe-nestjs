import { Inject, Injectable } from '@nestjs/common';
import { ConfirmPaymentIntentCommand } from '../commands/confirm-payment-intent.command';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for confirming a payment intent
 */
@Injectable()
export class ConfirmPaymentIntentUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentService: StripePaymentServicePort,
  ) {}

  async execute(command: ConfirmPaymentIntentCommand) {
    return this.stripePaymentService.confirmPaymentIntent(
      command.paymentIntentId,
      command.paymentMethodId,
    );
  }
}
