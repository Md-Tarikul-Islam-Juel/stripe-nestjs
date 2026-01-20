import { Inject, Injectable } from '@nestjs/common';
import { CreateExternalBankAccountCommand } from '../commands/create-external-bank-account.command';
import { STRIPE_CONNECT_SERVICE_PORT } from '../di-tokens';
import { StripeConnectServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Use case for creating an external bank account
 */
@Injectable()
export class CreateExternalBankAccountUseCase {
  constructor(
    @Inject(STRIPE_CONNECT_SERVICE_PORT)
    private readonly stripeConnectService: StripeConnectServicePort,
  ) {}

  async execute(command: CreateExternalBankAccountCommand) {
    return this.stripeConnectService.createExternalBankAccount({
      connectAccountId: command.connectAccountId,
      bankAccountNumber: command.bankAccountNumber,
      routingNumber: command.routingNumber,
      accountHolderName: command.accountHolderName,
      country: command.country,
      currency: command.currency,
      metadata: command.metadata,
    });
  }
}
