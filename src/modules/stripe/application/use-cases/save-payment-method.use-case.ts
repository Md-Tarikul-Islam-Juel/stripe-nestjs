import { Inject, Injectable } from '@nestjs/common';
import { SavePaymentMethodCommand } from '../commands/save-payment-method.command';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for saving a payment method
 */
@Injectable()
export class SavePaymentMethodUseCase {
  constructor(
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentServicePort: StripePaymentServicePort,
  ) {}

  async execute(command: SavePaymentMethodCommand): Promise<{
    success: boolean;
    paymentMethodId: string;
    customerId: string;
  }> {
    await this.stripePaymentServicePort.attachPaymentMethod(
      command.paymentMethodId,
      command.customerId,
    );

    if (command.setAsDefault) {
      await this.stripePaymentServicePort.setDefaultPaymentMethod(
        command.customerId,
        command.paymentMethodId,
      );
    }

    return {
      success: true,
      paymentMethodId: command.paymentMethodId,
      customerId: command.customerId,
    };
  }
}
