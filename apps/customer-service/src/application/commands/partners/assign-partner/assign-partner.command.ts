export class AssignPartnerCommand {
  constructor(
    public readonly partnerId: string,
    /** null: sorumlu temsilci ataması kaldırılır. */
    public readonly assignedUserId: string | null,
  ) {}
}
