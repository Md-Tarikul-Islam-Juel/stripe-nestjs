import { CreateConnectAccountDto } from '../dto/create-connect-account.dto';

/**
 * Command for creating a Stripe Connect account
 */
export class CreateConnectAccountCommand {
  constructor(
    public readonly country: string,
    public readonly email: string,
    public readonly businessName?: string,
    public readonly metadata?: Record<string, string>,
  ) {}

  static fromDto(dto: CreateConnectAccountDto): CreateConnectAccountCommand {
    return new CreateConnectAccountCommand(
      dto.country,
      dto.email,
      dto.businessName,
      dto.metadata,
    );
  }
}
