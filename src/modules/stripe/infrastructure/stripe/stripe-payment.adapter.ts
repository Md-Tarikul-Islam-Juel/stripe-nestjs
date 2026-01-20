import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  StripeCustomerNotFoundError,
  StripeInvalidRequestError,
  StripePaymentError,
  StripePaymentIntentNotFoundError,
} from '../../domain/errors/stripe.error';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Stripe Payment Adapter
 * Infrastructure layer implementation of StripePaymentServicePort
 */
@Injectable()
export class StripePaymentAdapter implements StripePaymentServicePort {
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

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerEmail: string;
    description?: string;
    metadata?: Record<string, string>;
    paymentMethodId?: string;
    customerId?: string;
    paymentMethodTypes?: string[];
  }): Promise<string> {
    try {
      // Validate customerId format if provided (Stripe customer IDs start with 'cus_')
      let validCustomerId: string | undefined = params.customerId;
      if (params.customerId && !params.customerId.startsWith('cus_')) {
        // Invalid customer ID format - ignore it and create payment intent without customer
        // The customer can be created separately if needed
        validCustomerId = undefined;
      }

      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: params.amount,
        currency: params.currency,
        receipt_email: params.customerEmail,
        description: params.description,
        capture_method: 'manual',
        payment_method_types: params.paymentMethodTypes || ['card'], // Default to card if not specified
        metadata: params.metadata || {},
      };

      if (params.paymentMethodId) {
        paymentIntentParams.payment_method = params.paymentMethodId;
      }

      if (validCustomerId) {
        paymentIntentParams.customer = validCustomerId;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(
        paymentIntentParams,
      );

      return paymentIntent.client_secret || '';
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to create payment intent');
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
  ): Promise<{
    status: string;
    paymentIntent: any;
    message: string;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        },
      );

      if (
        paymentIntent.status !== 'succeeded' &&
        paymentIntent.status !== 'requires_capture'
      ) {
        throw new InternalServerErrorException(
          `Unexpected payment status: ${paymentIntent.status}`,
        );
      }

      return {
        status: paymentIntent.status,
        paymentIntent,
        message:
          paymentIntent.status === 'requires_capture'
            ? 'Payment authorized, awaiting capture.'
            : 'Payment succeeded.',
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to confirm payment intent');
    }
  }

  async capturePayment(paymentIntentId: string): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(
        paymentIntentId,
      );
      return paymentIntent;
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to capture payment');
    }
  }

  async cancelPayment(paymentIntentId: string): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(
        paymentIntentId,
      );
      return paymentIntent;
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to void payment');
    }
  }

  async refundPayment(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
    reverseTransfer?: boolean;
    refundApplicationFee?: boolean;
  }): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    reason: string | null;
    receiptNumber: string | null;
    metadata: Record<string, string>;
  }> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.paymentIntentId,
      };

      if (params.amount) {
        refundParams.amount = params.amount;
      }

      if (params.reason) {
        refundParams.reason = params.reason;
      }

      if (params.metadata) {
        refundParams.metadata = params.metadata;
      }

      if (params.reverseTransfer !== undefined) {
        refundParams.reverse_transfer = params.reverseTransfer;
      }

      if (params.refundApplicationFee !== undefined) {
        refundParams.refund_application_fee = params.refundApplicationFee;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status || 'pending',
        reason: refund.reason,
        receiptNumber: refund.receipt_number,
        metadata: (refund.metadata as Record<string, string>) || {},
      };
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to refund payment');
    }
  }

  async getPaymentIntentStatus(paymentIntentId: string): Promise<any> {
    try {
      const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge', 'customer'],
      });

      const [refundList, chargeList] = await Promise.all([
        this.stripe.refunds.list({
          payment_intent: paymentIntentId,
          limit: 100,
        }),
        this.stripe.charges.list({
          payment_intent: paymentIntentId,
          limit: 100,
        }),
      ]);

      const refunds = refundList.data ?? [];
      const charges = chargeList.data ?? [];

      const totalCaptured = pi.amount_received ?? 0;
      const totalRefunded = refunds.reduce(
        (sum, r) => sum + (r.amount ?? 0),
        0,
      );
      const refundableRemaining = Math.max(totalCaptured - totalRefunded, 0);

      const refund_summary = {
        total_captured: totalCaptured,
        total_refunded: totalRefunded,
        refundable_remaining: refundableRemaining,
        currency: pi.currency,
        is_fully_refunded: totalCaptured > 0 && totalRefunded >= totalCaptured,
        is_partially_refunded:
          totalRefunded > 0 && totalRefunded < totalCaptured,
        refunds: refunds.map((r) => ({
          id: r.id,
          amount: r.amount,
          currency: r.currency,
          status: r.status,
          created: r.created,
          charge: typeof r.charge === 'string' ? r.charge : r.charge?.id,
          reason: r.reason ?? null,
        })),
      };

      return {
        id: pi.id,
        status: pi.status,
        capture_method: pi.capture_method,
        confirmation_method: pi.confirmation_method,
        created: pi.created,
        currency: pi.currency,
        description: pi.description,
        amount: pi.amount,
        amount_capturable: pi.amount_capturable,
        amount_received: pi.amount_received,
        customer:
          typeof pi.customer === 'string' ? pi.customer : pi.customer?.id ?? null,
        receipt_email: pi.receipt_email,
        payment_method:
          typeof pi.payment_method === 'string'
            ? pi.payment_method
            : pi.payment_method?.id ?? null,
        payment_method_types: pi.payment_method_types,
        metadata: pi.metadata ?? {},
        charges: charges.map((c) => ({
          id: c.id,
          status: c.status,
          captured: c.captured,
          paid: c.paid,
          amount: c.amount,
          currency: c.currency,
          created: c.created,
          description: c.description,
          failure_code: c.failure_code,
          failure_message: c.failure_message,
          receipt_url: c.receipt_url,
        })),
        refund_summary,
      };
    } catch (error: any) {
      throw this.handleStripeError(
        error,
        'Failed to retrieve payment intent status',
      );
    }
  }

  async createSetupIntent(customerId: string): Promise<string> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
      });
      return setupIntent.client_secret || '';
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to create setup intent');
    }
  }

  async createCustomer(email: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email: email,
        metadata: {
          notes: 'New customer created',
        },
      });
      return customer.id;
    } catch (error: any) {
      throw this.handleStripeError(error, 'Failed to create customer');
    }
  }

  async getCustomerIdByEmail(email: string): Promise<string | null> {
    try {
      const customers = await this.stripe.customers.list({
        email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0].id;
      }

      return null;
    } catch (error: any) {
      throw this.handleStripeError(
        error,
        'Failed to retrieve customer from Stripe',
      );
    }
  }

  async getDefaultPaymentMethod(customerId: string): Promise<{
    paymentMethodId: string;
    customerId: string;
    card: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  } | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new StripeCustomerNotFoundError(customerId);
      }

      if (typeof customer === 'string') {
        return null;
      }

      const paymentMethodId = customer.invoice_settings?.default_payment_method;

      if (!paymentMethodId || typeof paymentMethodId !== 'string') {
        return null;
      }

      const paymentMethod = await this.stripe.paymentMethods.retrieve(
        paymentMethodId,
      );

      if (!paymentMethod.card) {
        return null;
      }

      return {
        paymentMethodId: paymentMethod.id,
        customerId,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        },
      };
    } catch (error: any) {
      if (error instanceof StripeCustomerNotFoundError) {
        throw error;
      }
      throw this.handleStripeError(
        error,
        'Failed to retrieve default payment method',
      );
    }
  }

  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<any> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        },
      );
      return paymentMethod;
    } catch (error: any) {
      throw this.handleStripeError(
        error,
        'Failed to attach payment method',
      );
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<void> {
    try {
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error: any) {
      throw this.handleStripeError(
        error,
        'Failed to set default payment method',
      );
    }
  }

  async bulkRefundPaymentIntents(paymentIntentIds: string[]): Promise<{
    results: Array<{
      paymentIntentId: string;
      status: string;
      refundAmount: number;
      currency: string;
    }>;
    errors: Array<{
      paymentIntentId: string;
      error: string;
    }>;
  }> {
    const results = [];
    const errors = [];

    for (const paymentIntentId of paymentIntentIds) {
      try {
        const refundResult = await this.refundPayment({
          paymentIntentId,
        });
        results.push({
          paymentIntentId,
          status: 'succeeded',
          refundAmount: refundResult.amount,
          currency: refundResult.currency,
        });
      } catch (error: any) {
        errors.push({
          paymentIntentId,
          error: error.message || 'Refund failed',
        });
      }
    }

    return { results, errors };
  }

  /**
   * Handle Stripe errors and convert to domain errors
   */
  private handleStripeError(error: any, defaultMessage: string): Error {
    if (error.type === 'StripeInvalidRequestError') {
      return new StripeInvalidRequestError(
        error.message || defaultMessage,
        error.code,
      );
    }

    if (error.type === 'StripeCardError') {
      return new StripePaymentError(error.message || defaultMessage, error.code, 'card_error');
    }

    if (error.code === 'resource_missing') {
      if (error.message?.includes('payment_intent')) {
        return new StripePaymentIntentNotFoundError(error.param || '');
      }
      if (error.message?.includes('customer')) {
        return new StripeCustomerNotFoundError(error.param || '');
      }
    }

    return new StripePaymentError(error.message || defaultMessage, error.code, error.type);
  }
}
