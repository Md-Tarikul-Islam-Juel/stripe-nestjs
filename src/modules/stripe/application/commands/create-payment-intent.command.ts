import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';

/**
 * Command for creating a payment intent
 */
export class CreatePaymentIntentCommand {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
    public readonly customerEmail: string,
    public readonly description?: string,
    public readonly metadata?: Record<string, string>,
    public readonly paymentMethodId?: string,
    public readonly customerId?: string,
    public readonly paymentMethodTypes?: string[],
  ) {}

  static fromDto(dto: CreatePaymentIntentDto): CreatePaymentIntentCommand {
    return new CreatePaymentIntentCommand(
      dto.amount,
      dto.currency,
      dto.customerEmail,
      dto.description,
      dto.metadata,
      dto.paymentMethodId,
      dto.customerId,
      dto.paymentMethodTypes,
    );
  }
}
