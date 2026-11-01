// Helper nomor telepon (dipakai outlet AHS baru yang punya No. HP)
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function waHref(phone: string): string {
  const n = phone.replace(/\D/g, '');
  return `https://wa.me/${n.startsWith('0') ? '62' + n.slice(1) : n}`;
}
