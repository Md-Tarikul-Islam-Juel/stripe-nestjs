import { Inject, Injectable } from '@nestjs/common';
import { CreateConnectAccountCommand } from '../commands/create-connect-account.command';
import { STRIPE_CONNECT_SERVICE_PORT } from '../di-tokens';
import { StripeConnectServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for creating a Stripe Connect account
 */
@Injectable()
export class CreateConnectAccountUseCase {
  constructor(
    @Inject(STRIPE_CONNECT_SERVICE_PORT)
    private readonly stripeConnectServicePort: StripeConnectServicePort,
  ) {}

  async execute(command: CreateConnectAccountCommand) {
    return this.stripeConnectServicePort.createConnectAccount({
      country: command.country,
      email: command.email,
      businessName: command.businessName,
      metadata: command.metadata,
    });
  }
}
