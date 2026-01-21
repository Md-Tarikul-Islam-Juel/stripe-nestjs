import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for creating a setup intent
 */
@Injectable()
export class CreateSetupIntentUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentServicePort: StripePaymentServicePort,
  ) {}

  async execute(customerId: string): Promise<{ clientSecret: string }> {
    const clientSecret =
      await this.stripePaymentServicePort.createSetupIntent(customerId);
    return { clientSecret };
  }
}
