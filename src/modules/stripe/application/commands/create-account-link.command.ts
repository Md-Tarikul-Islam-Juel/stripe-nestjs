/**
 * Command for creating an account link
 */
export class CreateAccountLinkCommand {
  constructor(
    public readonly accountId: string,
    public readonly refreshUrl: string,
    public readonly returnUrl: string,
  ) {}
}
