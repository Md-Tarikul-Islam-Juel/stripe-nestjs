import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for canceling a payment intent
 */
@Injectable()
export class CancelPaymentUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentService: StripePaymentServicePort,
  ) {}

  async execute(paymentIntentId: string) {
    return this.stripePaymentService.cancelPayment(paymentIntentId);
  }
}
