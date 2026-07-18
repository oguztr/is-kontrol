export class ContactEntity {
  public readonly id: string;
  public partnerId: string;
  public firstName: string;
  public lastName: string;
  public title: string | null;
  public department: string | null;
  public phone: string | null;
  public email: string | null;
  public isPrimary: boolean;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    partnerId: string;
    firstName: string;
    lastName: string;
    title: string | null;
    department: string | null;
    phone: string | null;
    email: string | null;
    isPrimary: boolean;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.partnerId = params.partnerId;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.title = params.title;
    this.department = params.department;
    this.phone = params.phone;
    this.email = params.email;
    this.isPrimary = params.isPrimary;
    this.createdAt = params.createdAt;
  }
}
