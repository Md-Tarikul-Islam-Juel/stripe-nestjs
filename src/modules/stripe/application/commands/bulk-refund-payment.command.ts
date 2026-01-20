/**
 * Command for bulk refunding payments
 */
export class BulkRefundPaymentCommand {
  constructor(public readonly paymentIntentIds: string[]) {}
}
