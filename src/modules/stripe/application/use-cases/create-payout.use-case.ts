import { Inject, Injectable } from '@nestjs/common';
import { CreatePayoutCommand } from '../commands/create-payout.command';
import { STRIPE_CONNECT_SERVICE_PORT } from '../di-tokens';
import { StripeConnectServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for creating a payout
 */
@Injectable()
export class CreatePayoutUseCase {
  constructor(
    @Inject(STRIPE_CONNECT_SERVICE_PORT)
    private readonly stripeConnectServicePort: StripeConnectServicePort,
  ) {}

  async execute(command: CreatePayoutCommand) {
    // Convert amount from dollars to cents
    const amountInCents = Math.round(command.amount * 100);

    return this.stripeConnectServicePort.createPayout({
      connectAccountId: command.connectAccountId,
      amount: amountInCents,
      currency: command.currency,
      destination: command.externalAccountId,
      description: command.description,
    });
  }
}
