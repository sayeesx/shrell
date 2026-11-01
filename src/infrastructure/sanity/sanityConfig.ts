/**
 * Sanity CMS Configuration Manager
 * Safely persists and retrieves Sanity credentials and API configurations.
 */

export interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  useCdn: boolean;
  token?: string;
  studioUrl?: string;
}

const STORAGE_KEY = 'shrell_sanity_config';

const DEFAULT_CONFIG: SanityConfig = {
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SANITY_PROJECT_ID) || '',
  dataset: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SANITY_DATASET) || 'production',
  apiVersion: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SANITY_API_VERSION) || '2024-01-01',
  useCdn: true,
  token: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SANITY_API_TOKEN) || '',
  studioUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SANITY_STUDIO_URL) || '',
};

export function getSanityConfig(): SanityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        projectId: parsed.projectId || DEFAULT_CONFIG.projectId,
        dataset: parsed.dataset || DEFAULT_CONFIG.dataset,
      };
    }
  } catch (err) {
    console.warn('Failed to parse stored Sanity config:', err);
  }
  return DEFAULT_CONFIG;
}

export function saveSanityConfig(config: Partial<SanityConfig>): SanityConfig {
  const current = getSanityConfig();
  const updated: SanityConfig = {
    ...current,
    ...config,
    projectId: config.projectId !== undefined ? config.projectId.trim() : current.projectId,
    dataset: config.dataset !== undefined ? config.dataset.trim() || 'production' : current.dataset,
    token: config.token !== undefined ? config.token.trim() : current.token,
    studioUrl: config.studioUrl !== undefined ? config.studioUrl.trim() : current.studioUrl,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save Sanity config to localStorage:', err);
  }

  return updated;
}

export function resetSanityConfig(): SanityConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
  return DEFAULT_CONFIG;
}

export function isSanityConfigured(): boolean {
  const cfg = getSanityConfig();
  return Boolean(cfg.projectId && cfg.projectId.length >= 4);
}
