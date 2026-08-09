/** Platform is USD-only. Do not introduce other currencies. */
export const PLATFORM_CURRENCY = 'USD' as const;

export type PlatformCurrency = typeof PLATFORM_CURRENCY;

export function resolvePlatformCurrency(_value?: string | null): PlatformCurrency {
  return PLATFORM_CURRENCY;
}
