export class AddPartnerTagCommand {
  constructor(
    public readonly partnerId: string,
    public readonly tag: string,
  ) {}
}
