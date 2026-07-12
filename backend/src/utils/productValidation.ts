export const PRODUCT_LIMITS = {
  provider: 100,
  name: 200,
  location: 100,
  url: 500,
  remark: 500,
  cpu: 1024,
  capacity: 10_000_000,
  price: 1_000_000_000,
} as const;

export function parseStrictPositiveId(value: unknown): number | null {
  const text = typeof value === 'string' ? value : String(value ?? '');
  if (!/^[1-9]\d*$/.test(text)) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) && id <= 2_147_483_647 ? id : null;
}

export function validateRequiredText(value: unknown, field: string, maxLength: number): { value: string } | { error: string } {
  if (typeof value !== 'string') return { error: `Field ${field} must be a string` };
  const normalized = value.trim();
  if (!normalized) return { error: `Field ${field} cannot be empty` };
  if (normalized.length > maxLength) return { error: `Field ${field} must be at most ${maxLength} characters` };
  return { value: normalized };
}

export function validateOptionalText(value: unknown, field: string, maxLength: number): { value: string | null } | { error: string } {
  if (value === undefined || value === null) return { value: null };
  if (typeof value !== 'string') return { error: `Field ${field} must be a string` };
  const normalized = value.trim();
  if (!normalized) return { value: null };
  if (normalized.length > maxLength) return { error: `Field ${field} must be at most ${maxLength} characters` };
  return { value: normalized };
}

export function validateProductNumber(
  value: unknown,
  field: string,
  options: { min?: number; inclusive?: boolean; integer?: boolean; max?: number; decimalPlaces?: number } = {},
): { value: number } | { error: string } {
  const parsed = typeof value === 'number'
    ? value
    : (typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN);
  if (!Number.isFinite(parsed)) return { error: `Field ${field} must be a valid number` };
  if (options.integer && !Number.isInteger(parsed)) return { error: `Field ${field} must be an integer` };
  if (options.decimalPlaces !== undefined) {
    const scaled = parsed * (10 ** options.decimalPlaces);
    if (Math.abs(scaled - Math.round(scaled)) > Number.EPSILON * Math.max(1, Math.abs(scaled))) {
      return { error: `Field ${field} must have at most ${options.decimalPlaces} decimal places` };
    }
  }
  const min = options.min ?? 0;
  const validMin = options.inclusive ? parsed >= min : parsed > min;
  if (!validMin) return { error: `Field ${field} must be ${options.inclusive ? '>=' : '>'} ${min}` };
  if (options.max !== undefined && parsed > options.max) return { error: `Field ${field} must be at most ${options.max}` };
  return { value: parsed };
}
