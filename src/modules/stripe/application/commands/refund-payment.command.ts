import { RefundPaymentDto, RefundReason } from '../dto/refund-payment.dto';

/**
 * Command for refunding a payment
 */
export class RefundPaymentCommand {
  constructor(
    public readonly paymentIntentId: string,
    public readonly amount?: number,
    public readonly reason?: RefundReason,
    public readonly metadata?: Record<string, string>,
    public readonly reverseTransfer?: boolean,
    public readonly refundApplicationFee?: boolean,
  ) {}

  static fromDto(paymentIntentId: string, dto: RefundPaymentDto): RefundPaymentCommand {
    return new RefundPaymentCommand(
      paymentIntentId,
      dto.amount,
      dto.reason,
      dto.metadata,
      dto.reverseTransfer,
      dto.refundApplicationFee,
    );
  }
}
