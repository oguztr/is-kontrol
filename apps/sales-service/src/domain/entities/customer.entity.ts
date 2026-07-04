export class CustomerEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public phone: string | null,
    public email: string | null,
    public companyName: string | null,
    public address: string | null
  ) {}
}
