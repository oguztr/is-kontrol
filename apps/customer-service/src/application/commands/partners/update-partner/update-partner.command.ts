export class UpdatePartnerCommand {
  constructor(
    public readonly partnerId: string,
    public readonly name: string,
  ) {}
}
