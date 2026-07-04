const BFF_BASE_URL = process.env.EXPO_PUBLIC_BFF_URL ?? 'http://localhost:4000/bff';

export async function fetchStockStatus() {
  const response = await fetch(`${BFF_BASE_URL}/stock/status`);
  if (!response.ok) {
    throw new Error('Stok durumu alınamadı');
  }
  return response.json();
}

export async function fetchSalesDashboard() {
  const response = await fetch(`${BFF_BASE_URL}/sales/dashboard`);
  if (!response.ok) {
    throw new Error('Satış paneli alınamadı');
  }
  return response.json();
}

export async function createOffer(payload: { customerId: string; totalAmount: number }) {
  const response = await fetch(`${BFF_BASE_URL}/sales/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Teklif oluşturulamadı');
  }
  return response.json();
}
