import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for capturing a payment intent
 */
@Injectable()
export class CapturePaymentUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentServicePort: StripePaymentServicePort,
  ) {}

  async execute(paymentIntentId: string) {
    return this.stripePaymentServicePort.capturePayment(paymentIntentId);
  }
}
