export interface IProcessedEventRepository {
  /**
   * Event'i işlenmiş olarak kaydetmeyi dener.
   * İlk kez görülüyorsa true döner (işlemeye devam edilmeli);
   * daha önce kaydedilmişse false döner (event atlanmalı).
   */
  tryMarkProcessed(eventId: string, eventType: string): Promise<boolean>;
}
