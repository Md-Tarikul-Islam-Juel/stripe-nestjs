/**
 * Command for confirming a payment intent
 */
export class ConfirmPaymentIntentCommand {
  constructor(
    public readonly paymentIntentId: string,
    public readonly paymentMethodId: string,
  ) {}
}
