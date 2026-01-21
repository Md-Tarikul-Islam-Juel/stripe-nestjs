import { Inject, Injectable } from '@nestjs/common';
import { CreateCustomerCommand } from '../commands/create-customer.command';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for creating a Stripe customer
 */
@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentServicePort: StripePaymentServicePort,
  ) {}

  async execute(command: CreateCustomerCommand): Promise<{ customerId: string }> {
    const customerId = await this.stripePaymentServicePort.createCustomer(
      command.email,
    );
    return { customerId };
  }
}
