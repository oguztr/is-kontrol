/* KURUMSAL partnerin 1:1 firma bilgisi. Ödeme koşulu alanları yalnızca
 * referans amaçlıdır; asıl sahibi ileride Purchasing/Finance servisi
 * olabilir (bkz. ürün kararı notu). */
export class CompanyProfileEntity {
  public readonly id: string;
  public partnerId: string;
  public tradeName: string;
  public taxNumber: string | null;
  public taxOffice: string | null;
  public industry: string | null;
  public website: string | null;
  /** Holding/şube ilişkisi: üst firmanın partner id'si. */
  public parentPartnerId: string | null;
  public paymentTermDays: number | null;
  public preferredCurrencyCode: string | null;
  public readonly createdAt: Date;

  constructor(params: {
    id: string;
    partnerId: string;
    tradeName: string;
    taxNumber: string | null;
    taxOffice: string | null;
    industry: string | null;
    website: string | null;
    parentPartnerId: string | null;
    paymentTermDays: number | null;
    preferredCurrencyCode: string | null;
    createdAt: Date;
  }) {
    this.id = params.id;
    this.partnerId = params.partnerId;
    this.tradeName = params.tradeName;
    this.taxNumber = params.taxNumber;
    this.taxOffice = params.taxOffice;
    this.industry = params.industry;
    this.website = params.website;
    this.parentPartnerId = params.parentPartnerId;
    this.paymentTermDays = params.paymentTermDays;
    this.preferredCurrencyCode = params.preferredCurrencyCode;
    this.createdAt = params.createdAt;
  }
}
