export class MergePartnersCommand {
  constructor(
    /** Kalan (hayatta kalan) partner. */
    public readonly survivorPartnerId: string,
    /** Birleştirilip kapatılacak mükerrer partner. */
    public readonly sourcePartnerId: string,
  ) {}
}
