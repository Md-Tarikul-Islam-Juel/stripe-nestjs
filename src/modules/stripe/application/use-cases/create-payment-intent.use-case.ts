import { Inject, Injectable } from '@nestjs/common';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';
import { CreatePaymentIntentCommand } from '../commands/create-payment-intent.command';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { PaymentIntentResponseDto } from '../dto/payment-intent-response.dto';

/**
 * Use case for creating a payment intent
 */
@Injectable()
export class CreatePaymentIntentUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentServicePort: StripePaymentServicePort,
  ) {}

  async execute(
    command: CreatePaymentIntentCommand,
  ): Promise<PaymentIntentResponseDto> {
    // Convert amount from dollars to cents
    const amountInCents = Math.round(command.amount * 100);

    const clientSecret = await this.stripePaymentServicePort.createPaymentIntent(
      {
        amount: amountInCents,
        currency: command.currency,
        customerEmail: command.customerEmail,
        description: command.description,
        metadata: command.metadata,
        paymentMethodId: command.paymentMethodId,
        customerId: command.customerId,
        paymentMethodTypes: command.paymentMethodTypes,
      },
    );

    return { clientSecret };
  }
}
