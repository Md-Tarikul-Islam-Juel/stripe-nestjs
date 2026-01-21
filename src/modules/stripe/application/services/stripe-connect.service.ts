import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateConnectAccountDto } from '../dto/create-connect-account.dto';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { CreateAccountLinkCommand } from '../commands/create-account-link.command';
import { CreateConnectAccountCommand } from '../commands/create-connect-account.command';
import { CreateExternalBankAccountCommand } from '../commands/create-external-bank-account.command';
import { CreatePayoutCommand } from '../commands/create-payout.command';
import { STRIPE_CONNECT_SERVICE_PORT } from '../di-tokens';
import { StripeConnectServicePort } from '../../domain/ports/stripe.service.port';
import { CreateAccountLinkUseCase } from '../use-cases/create-account-link.use-case';
import { CreateConnectAccountUseCase } from '../use-cases/create-connect-account.use-case';
import { CreateExternalBankAccountUseCase } from '../use-cases/create-external-bank-account.use-case';
import { CreatePayoutUseCase } from '../use-cases/create-payout.use-case';

/**
 * Stripe Connect Application Service
 * Facade service that orchestrates Connect operations by calling use-cases
 * Similar to AuthService pattern - acts as a facade between controller and use-cases
 */
@Injectable()
export class StripeConnectService {
  constructor(
    private readonly createConnectAccountUseCase: CreateConnectAccountUseCase,
    private readonly createAccountLinkUseCase: CreateAccountLinkUseCase,
    private readonly createExternalBankAccountUseCase: CreateExternalBankAccountUseCase,
    private readonly createPayoutUseCase: CreatePayoutUseCase,
    @Inject(STRIPE_CONNECT_SERVICE_PORT)
    private readonly stripeConnectService: StripeConnectServicePort,
    private readonly configService: ConfigService,
  ) {}

  async createConnectAccount(dto: CreateConnectAccountDto) {
    const command = CreateConnectAccountCommand.fromDto(dto);
    return this.createConnectAccountUseCase.execute(command);
  }

  async getConnectAccount(
    accountId: string,
    refreshUrl?: string,
    returnUrl?: string,
  ) {
    // Read operation - using repository directly
    const account = await this.stripeConnectService.getConnectAccount(accountId);

    // Check if account needs onboarding
    const needsOnboarding =
      !account.detailsSubmitted ||
      !account.chargesEnabled ||
      !account.payoutsEnabled;

    // Use provided URLs or fall back to environment variables
    const finalRefreshUrl =
      refreshUrl ||
      this.configService.get<string>('STRIPE_CONNECT_REFRESH_URL');
    const finalReturnUrl =
      returnUrl ||
      this.configService.get<string>('STRIPE_CONNECT_RETURN_URL');

    // If account is incomplete and URLs available (provided or from env), create account link
    if (needsOnboarding && finalRefreshUrl && finalReturnUrl) {
      const accountLink = await this.createAccountLink(
        accountId,
        finalRefreshUrl,
        finalReturnUrl,
      );

      return {
        ...account,
        needsOnboarding: true,
        onboardingUrl: accountLink.url,
        onboardingExpiresAt: accountLink.expiresAt,
      };
    }

    // If account is incomplete but no URLs provided, indicate it needs onboarding
    if (needsOnboarding) {
      return {
        ...account,
        needsOnboarding: true,
        onboardingUrl: null,
        message:
          'Account onboarding incomplete. Provide refreshUrl and returnUrl query parameters, or set STRIPE_CONNECT_REFRESH_URL and STRIPE_CONNECT_RETURN_URL environment variables.',
      };
    }

    // Account is complete
    return {
      ...account,
      needsOnboarding: false,
    };
  }

  async createAccountLink(
    accountId: string,
    refreshUrl?: string,
    returnUrl?: string,
  ) {
    // Use provided URLs or fall back to environment variables
    const finalRefreshUrl =
      refreshUrl ||
      this.configService.get<string>('STRIPE_CONNECT_REFRESH_URL');
    const finalReturnUrl =
      returnUrl ||
      this.configService.get<string>('STRIPE_CONNECT_RETURN_URL');

    if (!finalRefreshUrl || !finalReturnUrl) {
      throw new BadRequestException(
        'refreshUrl and returnUrl are required. Provide them in the request body or set STRIPE_CONNECT_REFRESH_URL and STRIPE_CONNECT_RETURN_URL environment variables.',
      );
    }

    const command = new CreateAccountLinkCommand(
      accountId,
      finalRefreshUrl,
      finalReturnUrl,
    );
    return this.createAccountLinkUseCase.execute(command);
  }

  async createExternalBankAccount(params: {
    connectAccountId: string;
    bankAccountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    country: string;
    currency?: string;
    metadata?: Record<string, string>;
  }) {
    const command = new CreateExternalBankAccountCommand(
      params.connectAccountId,
      params.bankAccountNumber,
      params.routingNumber,
      params.accountHolderName,
      params.country,
      params.currency,
      params.metadata,
    );
    return this.createExternalBankAccountUseCase.execute(command);
  }

  async listExternalAccounts(connectAccountId: string) {
    // Read operation - using repository directly
    return this.stripeConnectService.listExternalAccounts(connectAccountId);
  }

  async deleteExternalAccount(
    connectAccountId: string,
    externalAccountId: string,
  ) {
    // Write operation - using repository directly (could be converted to use-case)
    return this.stripeConnectService.deleteExternalAccount(
      connectAccountId,
      externalAccountId,
    );
  }

  async createTransfer(params: {
    amount: number;
    currency: string;
    destination: string;
    description?: string;
    metadata?: Record<string, string>;
  }) {
    // Convert amount from dollars to cents
    const amountInCents = Math.round(params.amount * 100);
    // Write operation - using repository directly (could be converted to use-case)
    return this.stripeConnectService.createTransfer({
      ...params,
      amount: amountInCents,
    });
  }

  async createPayout(dto: CreatePayoutDto) {
    const command = CreatePayoutCommand.fromDto(dto);
    return this.createPayoutUseCase.execute(command);
  }

  async getPayoutStatus(payoutId: string, connectAccountId: string) {
    // Read operation - using repository directly
    return this.stripeConnectService.getPayoutStatus(payoutId, connectAccountId);
  }

  async getConnectBalance(connectAccountId: string) {
    // Read operation - using repository directly
    return this.stripeConnectService.getConnectBalance(connectAccountId);
  }

  async verifyWebhookSignature(
    payload: string | Uint8Array,
    signature: string,
    secret: string,
  ) {
    // Utility operation - using repository directly
    return this.stripeConnectService.verifyWebhookSignature(
      payload,
      signature,
      secret,
    );
  }

  async listPayouts(connectAccountId: string, limit?: number) {
    // Read operation - using repository directly
    return this.stripeConnectService.listPayouts({
      connectAccountId,
      limit,
    });
  }

  async cancelPayout(payoutId: string) {
    // Write operation - using repository directly (could be converted to use-case)
    return this.stripeConnectService.cancelPayout(payoutId);
  }

  async updateExternalBankAccount(params: {
    connectAccountId: string;
    externalAccountId: string;
    bankAccountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    country: string;
    currency?: string;
    metadata?: Record<string, string>;
  }) {
    // Write operation - using repository directly (could be converted to use-case)
    return this.stripeConnectService.updateExternalBankAccount(params);
  }
}
