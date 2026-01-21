import { Inject, Injectable } from '@nestjs/common';
import { CreateAccountLinkCommand } from '../commands/create-account-link.command';
import { STRIPE_CONNECT_SERVICE_PORT } from '../di-tokens';
import { StripeConnectServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for creating an account link
 */
@Injectable()
export class CreateAccountLinkUseCase {
  constructor(
    @Inject(STRIPE_CONNECT_SERVICE_PORT)
    private readonly stripeConnectServicePort: StripeConnectServicePort,
  ) {}

  async execute(command: CreateAccountLinkCommand) {
    return this.stripeConnectServicePort.createAccountLink({
      accountId: command.accountId,
      refreshUrl: command.refreshUrl,
      returnUrl: command.returnUrl,
    });
  }
}
