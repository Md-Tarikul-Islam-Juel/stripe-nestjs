import { CreatePayoutDto } from '../dto/create-payout.dto';

/**
 * Command for creating a payout
 */
export class CreatePayoutCommand {
  constructor(
    public readonly connectAccountId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly externalAccountId: string,
    public readonly description?: string,
  ) {}

  static fromDto(dto: CreatePayoutDto): CreatePayoutCommand {
    return new CreatePayoutCommand(
      dto.connectAccountId,
      dto.amount,
      dto.currency,
      dto.externalAccountId,
      dto.description,
    );
  }
}
