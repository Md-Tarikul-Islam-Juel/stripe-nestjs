import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  StripeConnectAccountNotFoundError,
  StripeConnectError,
  StripeWebhookVerificationError,
} from '../../domain/errors/stripe.error';
import { StripeConnectServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Stripe Connect Adapter
 * Infrastructure layer implementation of StripeConnectServicePort
 */
@Injectable()
export class StripeConnectAdapter implements StripeConnectServicePort {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  async createConnectAccount(params: {
    country: string;
    email: string;
    businessName?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    accountId: string;
    country: string;
    type: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  }> {
    try {
      const connectAccount = await this.stripe.accounts.create({
        type: 'express',
        country: params.country.toUpperCase(),
        email: params.email,
        business_profile: params.businessName
          ? {
              name: params.businessName,
            }
          : undefined,
        metadata: params.metadata || {},
      });

      return {
        accountId: connectAccount.id,
        country: connectAccount.country || 'US',
        type: connectAccount.type,
        chargesEnabled: connectAccount.charges_enabled,
        payoutsEnabled: connectAccount.payouts_enabled,
        detailsSubmitted: connectAccount.details_submitted,
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to create Connect account');
    }
  }

  async getConnectAccount(accountId: string): Promise<{
    id: string;
    country: string;
    type: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    businessProfile?: any;
    metadata?: Record<string, string>;
  }> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        id: account.id,
        country: account.country || 'US',
        type: account.type,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        businessProfile: account.business_profile,
        metadata: account.metadata,
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to retrieve Connect account');
    }
  }

  async createAccountLink(params: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<{
    url: string;
    expiresAt: number;
  }> {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: params.accountId,
        refresh_url: params.refreshUrl,
        return_url: params.returnUrl,
        type: 'account_onboarding',
      });

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at || 0,
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to create account link');
    }
  }

  async createExternalBankAccount(params: {
    connectAccountId: string;
    bankAccountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    country: string;
    currency?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    last4: string;
    status: string;
    country: string;
    currency: string;
  }> {
    try {
      const externalAccount = await this.stripe.accounts.createExternalAccount(
        params.connectAccountId,
        {
          external_account: {
            object: 'bank_account',
            country: params.country.toUpperCase(),
            currency: params.currency || this.getCurrencyForCountry(params.country),
            account_number: params.bankAccountNumber,
            routing_number: params.routingNumber,
            account_holder_name: params.accountHolderName,
            account_holder_type: 'individual',
          },
          metadata: params.metadata || {},
        },
      );

      return {
        id: externalAccount.id,
        last4: (externalAccount as any).last4 || '',
        status: (externalAccount as any).status || 'new',
        country: externalAccount.country || 'US',
        currency: externalAccount.currency || 'usd',
      };
    } catch (error: any) {
      throw this.handleStripeError(
        error,
        'Failed to create external bank account',
      );
    }
  }

  async listExternalAccounts(connectAccountId: string): Promise<
    Array<{
      id: string;
      last4: string;
      status: string;
      country: string;
      currency: string;
      bankName?: string;
      routingNumber?: string;
      accountHolderName?: string;
    }>
  > {
    try {
      const externalAccounts = await this.stripe.accounts.listExternalAccounts(
        connectAccountId,
        {
          object: 'bank_account',
        },
      );

      return externalAccounts.data.map((account) => ({
        id: account.id,
        last4: (account as any).last4 || '',
        status: (account as any).status || 'new',
        country: account.country || 'US',
        currency: account.currency || 'usd',
        bankName: (account as any).bank_name,
        routingNumber: (account as any).routing_number,
        accountHolderName: (account as any).account_holder_name,
      }));
    } catch (error: any) {
      throw this.handleStripeError(
        error,
        'Failed to list external accounts',
      );
    }
  }

  async deleteExternalAccount(
    connectAccountId: string,
    externalAccountId: string,
  ): Promise<void> {
    try {
      await this.stripe.accounts.deleteExternalAccount(
        connectAccountId,
        externalAccountId,
      );
    } catch (error: any) {
      throw this.handleStripeError(
        error,
        'Failed to delete external account',
      );
    }
  }

  async createTransfer(params: {
    amount: number;
    currency: string;
    destination: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    amount: number;
    currency: string;
    destination: string;
  }> {
    try {
      const transfer = await this.stripe.transfers.create({
        amount: params.amount,
        currency: params.currency,
        destination: params.destination,
        description: params.description,
        metadata: params.metadata || {},
      });

      return {
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        destination: transfer.destination as string,
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to create transfer');
    }
  }

  async createPayout(params: {
    connectAccountId: string;
    amount: number;
    currency: string;
    destination: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: number;
  }> {
    try {
      const payout = await this.stripe.payouts.create(
        {
          amount: params.amount,
          currency: params.currency,
          description: params.description,
          destination: params.destination,
          metadata: params.metadata || {},
        },
        {
          stripeAccount: params.connectAccountId,
        },
      );

      return {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        arrivalDate: payout.arrival_date || 0,
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to create payout');
    }
  }

  async getPayoutStatus(payoutId: string): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: number;
    description?: string;
    metadata?: Record<string, string>;
  }> {
    try {
      const payout = await this.stripe.payouts.retrieve(payoutId);

      return {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        arrivalDate: payout.arrival_date || 0,
        description: payout.description || undefined,
        metadata: payout.metadata ? (payout.metadata as Record<string, string>) : undefined,
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to retrieve payout status');
    }
  }

  async getConnectBalance(connectAccountId: string): Promise<{
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  }> {
    try {
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: connectAccountId,
      });

      return {
        available: balance.available.map((b) => ({
          amount: b.amount,
          currency: b.currency,
        })),
        pending: balance.pending.map((b) => ({
          amount: b.amount,
          currency: b.currency,
        })),
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to retrieve Connect balance');
    }
  }

  async listPayouts(params: {
    connectAccountId: string;
    limit?: number;
  }): Promise<Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: number;
    description?: string;
    metadata?: Record<string, string>;
    created: number;
  }>> {
    try {
      const payouts = await this.stripe.payouts.list(
        {
          limit: params.limit || 10,
        },
        {
          stripeAccount: params.connectAccountId,
        },
      );

      return payouts.data.map((payout) => ({
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        arrivalDate: payout.arrival_date || 0,
        description: payout.description || undefined,
        metadata: payout.metadata ? (payout.metadata as Record<string, string>) : undefined,
        created: payout.created,
      }));
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to list payouts');
    }
  }

  async cancelPayout(payoutId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    try {
      const payout = await this.stripe.payouts.cancel(payoutId);
      return {
        id: payout.id,
        status: payout.status,
        amount: payout.amount,
        currency: payout.currency,
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to cancel payout');
    }
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
  }): Promise<{
    id: string;
    last4: string;
    status: string;
    country: string;
    currency: string;
  }> {
    try {
      // Create new external account first
      const newAccount = await this.createExternalBankAccount({
        connectAccountId: params.connectAccountId,
        bankAccountNumber: params.bankAccountNumber,
        routingNumber: params.routingNumber,
        accountHolderName: params.accountHolderName,
        country: params.country,
        currency: params.currency,
        metadata: params.metadata,
      });

      // Delete old external account
      try {
        await this.deleteExternalAccount(
          params.connectAccountId,
          params.externalAccountId,
        );
      } catch (error) {
        // If deletion fails, log but don't fail the operation
        console.warn(`Failed to delete old external account: ${error instanceof Error ? error.message : String(error)}`);
      }

      return newAccount;
    } catch (error: any) {
      throw this.handleStripeError(
        error,
        'Failed to update external bank account',
      );
    }
  }

  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): Promise<any> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        secret,
      );
      return event;
    } catch (error: any) {
      throw new StripeWebhookVerificationError(error.message);
    }
  }

  /**
   * Get currency for a country (simplified version)
   */
  private getCurrencyForCountry(country: string): string {
    const countryToCurrency: Record<string, string> = {
      US: 'usd',
      CA: 'cad',
      GB: 'gbp',
      AU: 'aud',
      DE: 'eur',
      FR: 'eur',
      IT: 'eur',
      ES: 'eur',
      NL: 'eur',
      BE: 'eur',
      AT: 'eur',
      FI: 'eur',
      IE: 'eur',
      PT: 'eur',
      JP: 'jpy',
      CN: 'cny',
      IN: 'inr',
      BR: 'brl',
      MX: 'mxn',
    };

    const normalizedCountry = country.toUpperCase();
    return countryToCurrency[normalizedCountry] || 'usd';
  }

  /**
   * Handle Stripe errors and convert to domain errors
   */
  private handleStripeError(error: any, defaultMessage: string): Error {
    if (error.type === 'StripeInvalidRequestError') {
      return new StripeConnectError(error.message || defaultMessage, error.code);
    }

    if (error.code === 'resource_missing') {
      if (error.message?.includes('account')) {
        return new StripeConnectAccountNotFoundError(error.param || '');
      }
    }

    return new StripeConnectError(
      error.message || defaultMessage,
      error.code,
      error.type,
    );
  }
}
