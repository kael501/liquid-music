import { rawStorageGet, rawStorageSet } from '../lib/utils';

const KEY = 'liquid-music:api-config';

export interface ApiConfig {
  apiKey: string;
  region: string;
}

export const REGIONS: Array<{ code: string; label: string }> = [
  { code: 'ID', label: 'Indonesia' },
  { code: 'US', label: 'Amerika Serikat' },
  { code: 'GB', label: 'Inggris' },
  { code: 'MY', label: 'Malaysia' },
  { code: 'SG', label: 'Singapura' },
  { code: 'JP', label: 'Jepang' },
  { code: 'KR', label: 'Korea Selatan' },
  { code: 'IN', label: 'India' },
  { code: 'BR', label: 'Brasil' },
  { code: 'DE', label: 'Jerman' },
];

function defaultRegion(): string {
  const lang = typeof navigator !== 'undefined' ? navigator.language : '';
  const code = lang.split('-')[1]?.toUpperCase();
  if (code && REGIONS.some((r) => r.code === code)) return code;
  return lang.toLowerCase().startsWith('id') ? 'ID' : 'US';
}

const envKey = (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined)?.trim() ?? '';

/** Stored device-wide (not per account): the key belongs to the device, not to a login. */
export function getApiConfig(): ApiConfig {
  const saved = rawStorageGet<Partial<ApiConfig>>(KEY, {});
  return {
    apiKey: (saved.apiKey ?? '').trim() || envKey,
    region: saved.region || defaultRegion(),
  };
}

export function saveApiConfig(patch: Partial<ApiConfig>): ApiConfig {
  const next = { ...getApiConfig(), ...patch };
  rawStorageSet(KEY, { apiKey: next.apiKey.trim(), region: next.region });
  return getApiConfig();
}
