import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for getting payment intent status
 */
@Injectable()
export class GetPaymentIntentStatusUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentService: StripePaymentServicePort,
  ) {}

  async execute(paymentIntentId: string) {
    return this.stripePaymentService.getPaymentIntentStatus(paymentIntentId);
  }
}
