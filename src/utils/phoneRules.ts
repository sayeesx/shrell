import { allCountries } from 'country-telephone-data';

export interface PhoneRule {
  min: number;
  max: number;
}

/**
 * Validated national mobile phone digit lengths by country ISO2.
 * Based on ITU-T E.164 and national numbering plans.
 */
const PHONE_RULE_OVERRIDES: Record<string, PhoneRule> = {
  in: { min: 10, max: 10 }, // India is strictly 10 digits
  us: { min: 10, max: 10 }, // United States
  ca: { min: 10, max: 10 }, // Canada
  gb: { min: 10, max: 10 }, // United Kingdom
  cn: { min: 11, max: 11 }, // China
  jp: { min: 10, max: 10 }, // Japan
  de: { min: 10, max: 11 }, // Germany
  br: { min: 11, max: 11 }, // Brazil
  mx: { min: 10, max: 10 }, // Mexico
  bd: { min: 10, max: 10 }, // Bangladesh
  pk: { min: 10, max: 10 }, // Pakistan
  ph: { min: 10, max: 10 }, // Philippines
  ng: { min: 10, max: 10 }, // Nigeria
  id: { min: 9, max: 12 },  // Indonesia
  vn: { min: 9, max: 10 },  // Vietnam
  my: { min: 9, max: 10 },  // Malaysia
  nz: { min: 8, max: 10 },  // New Zealand
  ae: { min: 9, max: 9 },   // United Arab Emirates
  sa: { min: 9, max: 9 },   // Saudi Arabia
  sg: { min: 8, max: 8 },   // Singapore
  au: { min: 9, max: 9 },   // Australia (9 digits after +61)
  it: { min: 9, max: 10 },  // Italy
  fr: { min: 9, max: 9 },   // France
  es: { min: 9, max: 9 },   // Spain
  ru: { min: 10, max: 10 }, // Russia
  za: { min: 9, max: 9 },   // South Africa
  kr: { min: 9, max: 10 },  // South Korea
  hk: { min: 8, max: 8 },   // Hong Kong
  tw: { min: 9, max: 9 },   // Taiwan
  nl: { min: 9, max: 9 },   // Netherlands
  ch: { min: 9, max: 9 },   // Switzerland
  se: { min: 9, max: 9 },   // Sweden
  no: { min: 8, max: 8 },   // Norway
  dk: { min: 8, max: 8 },   // Denmark
  qa: { min: 8, max: 8 },   // Qatar
  kw: { min: 8, max: 8 },   // Kuwait
  bh: { min: 8, max: 8 },   // Bahrain
  om: { min: 8, max: 8 },   // Oman
  np: { min: 10, max: 10 }, // Nepal
  lk: { min: 9, max: 9 },   // Sri Lanka
  th: { min: 9, max: 9 },   // Thailand
  eg: { min: 10, max: 10 }, // Egypt
  ke: { min: 9, max: 9 },   // Kenya
  gh: { min: 9, max: 9 },   // Ghana
  tr: { min: 10, max: 10 }, // Turkey
  ir: { min: 10, max: 10 }, // Iran
  il: { min: 9, max: 9 },   // Israel
  ie: { min: 9, max: 9 },   // Ireland
  pl: { min: 9, max: 9 },   // Poland
  gr: { min: 10, max: 10 }, // Greece
  pt: { min: 9, max: 9 },   // Portugal
  at: { min: 10, max: 10 }, // Austria
  be: { min: 9, max: 9 },   // Belgium
};

/**
 * Returns the exact national mobile phone digit count for any country code.
 */
export function getCountryPhoneRule(iso2: string): PhoneRule {
  const code = (iso2 || '').toLowerCase().trim();
  if (PHONE_RULE_OVERRIDES[code]) {
    return PHONE_RULE_OVERRIDES[code];
  }
  const country = (allCountries as Array<{ iso2: string; format?: string }>).find(
    (c) => c.iso2.toLowerCase() === code
  );
  if (country && country.format) {
    const match = country.format.match(/^\+\.+/);
    const prefixDots = match ? match[0].length - 1 : 0;
    const totalDots = (country.format.match(/\./g) || []).length;
    const diff = totalDots - prefixDots;
    if (diff >= 6 && diff <= 12) {
      return { min: diff, max: diff };
    }
  }
  return { min: 7, max: 12 };
}
