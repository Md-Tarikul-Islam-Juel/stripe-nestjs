/**
 * Command for creating an external bank account
 */
export class CreateExternalBankAccountCommand {
  constructor(
    public readonly connectAccountId: string,
    public readonly bankAccountNumber: string,
    public readonly routingNumber: string,
    public readonly accountHolderName: string,
    public readonly country: string,
    public readonly currency?: string,
    public readonly metadata?: Record<string, string>,
  ) {}
}
