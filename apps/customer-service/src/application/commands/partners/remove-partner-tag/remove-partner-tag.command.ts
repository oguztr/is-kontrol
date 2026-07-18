export class RemovePartnerTagCommand {
  constructor(
    public readonly partnerId: string,
    public readonly tag: string,
  ) {}
}
