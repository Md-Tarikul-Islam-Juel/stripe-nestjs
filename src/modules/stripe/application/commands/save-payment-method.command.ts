/**
 * Command for saving a payment method
 */
export class SavePaymentMethodCommand {
  constructor(
    public readonly paymentMethodId: string,
    public readonly customerId: string,
    public readonly setAsDefault: boolean = true,
  ) {}
}
