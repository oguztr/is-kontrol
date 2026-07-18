/* İsteği yapan aktörün (şirket + kullanıcı) kapsamı. Use case'ler şirket
 * bazlı veri izolasyonunu bu port üzerinden uygular: kapsam dışı bir
 * aggregate'e erişim, kaynak yokmuş gibi (notFound) reddedilir. */
export interface IActorContextPort {
  /**
   * Bağlamda şirket yoksa (arka plan worker'ı, servis içi çağrı) erişim
   * serbesttir; varsa yalnızca kendi şirketinin verisine izin verilir.
   */
  allowsCompany(companyId: string): boolean;
  /** Kimliği doğrulanmış kullanıcı (x-user-id); yoksa null. */
  userId(): string | null;
}
