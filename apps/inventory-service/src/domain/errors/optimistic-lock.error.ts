/* Optimistic kilit çakışması: bakiye, okunduğu sürümden farklı bir sürümle
 * güncellenmeye çalışıldı. Unit-of-work bu hatayı yakalayıp transaction'ı
 * baştan dener; iş yükü güncel sürümü yeniden okur. */
export class OptimisticLockError extends Error {
  constructor(
    public readonly warehouseId: string,
    public readonly productId: string,
  ) {
    super(
      `Stok bakiyesi eşzamanlı güncellendi: warehouse=${warehouseId} product=${productId}`,
    );
    this.name = "OptimisticLockError";
  }
}
