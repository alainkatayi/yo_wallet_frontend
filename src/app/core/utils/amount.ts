export function normalizeAmount(raw: string): string | null {
  const text = raw.trim().replace(',', '.');
  if (!/^(?:0|[1-9]\d{0,13})(?:\.\d{1,2})?$/.test(text)) {
    return null;
  }
  const [whole, fraction = ''] = text.split('.');
  const scale = (fraction + '00').slice(0, 2);
  if (whole === '0' && scale === '00') {
    return null;
  }
  return `${whole}.${scale}`;
}
