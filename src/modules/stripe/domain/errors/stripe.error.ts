/**
 * Stripe Domain Errors
 * Domain-specific error classes for Stripe operations
 */
export class StripePaymentError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly type?: string,
  ) {
    super(message);
    this.name = 'StripePaymentError';
  }
}

export class StripeCustomerNotFoundError extends StripePaymentError {
  constructor(customerId: string) {
    super(`Customer not found: ${customerId}`, 'CUSTOMER_NOT_FOUND');
    this.name = 'StripeCustomerNotFoundError';
  }
}

export class StripePaymentIntentNotFoundError extends StripePaymentError {
  constructor(paymentIntentId: string) {
    super(`Payment intent not found: ${paymentIntentId}`, 'PAYMENT_INTENT_NOT_FOUND');
    this.name = 'StripePaymentIntentNotFoundError';
  }
}

export class StripeInvalidRequestError extends StripePaymentError {
  constructor(message: string, code?: string) {
    super(message, code, 'invalid_request_error');
    this.name = 'StripeInvalidRequestError';
  }
}

export class StripeConnectError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly type?: string,
  ) {
    super(message);
    this.name = 'StripeConnectError';
  }
}

export class StripeConnectAccountNotFoundError extends StripeConnectError {
  constructor(accountId: string) {
    super(`Connect account not found: ${accountId}`, 'ACCOUNT_NOT_FOUND');
    this.name = 'StripeConnectAccountNotFoundError';
  }
}

export class StripeWebhookVerificationError extends Error {
  constructor(message: string) {
    super(`Webhook verification failed: ${message}`);
    this.name = 'StripeWebhookVerificationError';
  }
}
