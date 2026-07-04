export type OfflineRecord = {
  id: string;
  type: 'offer' | 'stock-check';
  payload: Record<string, unknown>;
  synced: boolean;
};

export const offlineQueue: OfflineRecord[] = [];

export function enqueueOfflineAction(record: Omit<OfflineRecord, 'synced'>) {
  offlineQueue.push({ ...record, synced: false });
}

export function getPendingActions() {
  return offlineQueue.filter((item) => !item.synced);
}
