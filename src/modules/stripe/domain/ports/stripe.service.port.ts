/**
 * Stripe Service Port
 * Domain layer interface for Stripe API operations
 * Following Dependency Inversion Principle (DIP)
 * 
 * Location: domain/ports/ (not domain/repositories/) because:
 * - Repository Ports = Database operations (e.g., user.repository.port.ts)
 * - Service Ports = External API services (e.g., stripe.service.port.ts, email.service.port.ts)
 * 
 * This port defines the contract for Stripe API operations, which are implemented
 * by adapters in the infrastructure layer (stripe-payment.adapter.ts, stripe-connect.adapter.ts)
 */
export interface StripePaymentServicePort {
  /**
   * Create a payment intent in Stripe
   */
  createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerEmail: string;
    description?: string;
    metadata?: Record<string, string>;
    paymentMethodId?: string;
    customerId?: string;
    paymentMethodTypes?: string[];
  }): Promise<string>; // Returns client_secret

  /**
   * Confirm a payment intent
   */
  confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
  ): Promise<{
    status: string;
    paymentIntent: any;
    message: string;
  }>;

  /**
   * Capture a payment intent
   */
  capturePayment(paymentIntentId: string): Promise<any>;

  /**
   * Cancel/void a payment intent
   */
  cancelPayment(paymentIntentId: string): Promise<any>;

  /**
   * Refund a payment
   */
  refundPayment(params: {
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
  }>;

  /**
   * Get payment intent status
   */
  getPaymentIntentStatus(paymentIntentId: string): Promise<any>;

  /**
   * Create a setup intent for saving payment methods
   */
  createSetupIntent(customerId: string): Promise<string>; // Returns client_secret

  /**
   * Create a customer in Stripe
   */
  createCustomer(email: string): Promise<string>; // Returns customer ID

  /**
   * Get customer ID by email
   */
  getCustomerIdByEmail(email: string): Promise<string | null>;

  /**
   * Get default payment method for a customer
   */
  getDefaultPaymentMethod(customerId: string): Promise<{
    paymentMethodId: string;
    customerId: string;
    card: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  } | null>;

  /**
   * Attach payment method to a customer
   */
  attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<any>;

  /**
   * Set default payment method for a customer
   */
  setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<void>;

  /**
   * Bulk refund payment intents
   */
  bulkRefundPaymentIntents(paymentIntentIds: string[]): Promise<{
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
  }>;
}

export interface StripeConnectServicePort {
  /**
   * Create a Stripe Connect account
   */
  createConnectAccount(params: {
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
  }>;

  /**
   * Get Connect account details
   */
  getConnectAccount(accountId: string): Promise<{
    id: string;
    country: string;
    type: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    businessProfile?: any;
    metadata?: Record<string, string>;
  }>;

  /**
   * Create account link for onboarding
   */
  createAccountLink(params: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<{
    url: string;
    expiresAt: number;
  }>;

  /**
   * Create external bank account
   */
  createExternalBankAccount(params: {
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
  }>;

  /**
   * List external accounts for a Connect account
   */
  listExternalAccounts(connectAccountId: string): Promise<Array<{
    id: string;
    last4: string;
    status: string;
    country: string;
    currency: string;
    bankName?: string;
    routingNumber?: string;
    accountHolderName?: string;
  }>>;

  /**
   * Delete external account
   */
  deleteExternalAccount(
    connectAccountId: string,
    externalAccountId: string,
  ): Promise<void>;

  /**
   * Create transfer to Connect account
   */
  createTransfer(params: {
    amount: number;
    currency: string;
    destination: string; // Connect account ID
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    amount: number;
    currency: string;
    destination: string;
  }>;

  /**
   * Create payout from Connect account
   */
  createPayout(params: {
    connectAccountId: string;
    amount: number;
    currency: string;
    destination: string; // External account ID
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: number;
  }>;

  /**
   * Get payout status
   */
  getPayoutStatus(payoutId: string): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: number;
    description?: string;
    metadata?: Record<string, string>;
  }>;

  /**
   * Get Connect account balance
   */
  getConnectBalance(connectAccountId: string): Promise<{
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  }>;

  /**
   * List payouts for a Connect account
   */
  listPayouts(params: {
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
  }>>;

  /**
   * Cancel a payout
   */
  cancelPayout(payoutId: string): Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
  }>;

  /**
   * Update external bank account (by creating new and deleting old)
   */
  updateExternalBankAccount(params: {
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
  }>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Uint8Array,
    signature: string,
    secret: string,
  ): Promise<any>;
}
