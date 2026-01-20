import { CreateCustomerDto } from '../dto/create-customer.dto';

/**
 * Command for creating a Stripe customer
 */
export class CreateCustomerCommand {
  constructor(
    public readonly email: string,
    public readonly name?: string,
    public readonly metadata?: Record<string, string>,
  ) {}

  static fromDto(dto: CreateCustomerDto): CreateCustomerCommand {
    return new CreateCustomerCommand(dto.email, dto.name, dto.metadata);
  }
}
