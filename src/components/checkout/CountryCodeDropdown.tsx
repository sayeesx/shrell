import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'flag-icons/css/flag-icons.min.css';
import { allCountries } from 'country-telephone-data';
import { useTheme } from '../../application/ThemeContext';
import { getCountryPhoneRule, PhoneRule } from '../../utils/phoneRules';

export { getCountryPhoneRule };
export type { PhoneRule };

export interface CountryDialOption {
  iso2: string;
  dialCode: string;
  name: string;
  phoneRule: PhoneRule;
}

export const ORDERED_COUNTRIES: CountryDialOption[] = (() => {
  const normalized: CountryDialOption[] = (allCountries as Array<{ name: string; iso2: string; dialCode: string }>)
    .map((c) => {
      const iso2 = c.iso2.toLowerCase();
      return {
        name: c.name.replace(/\s*\([^)]*\)\s*/g, '').trim() || c.name,
        iso2,
        dialCode: String(c.dialCode).replace(/^\+/, ''),
        phoneRule: getCountryPhoneRule(iso2),
      };
    })
    .sort((a, b) => {
      if (a.iso2 === 'in') return -1;
      if (b.iso2 === 'in') return 1;
      return a.name.localeCompare(b.name);
    });
  return normalized;
})();

export interface CountryCodeDropdownProps {
  selectedIso2: string;
  onChange: (country: CountryDialOption) => void;
}

/**
 * Custom theme-matched country dial-code selector with real SVG flags and live search.
 * Defaults to India (+91) while exposing all 250 country codes.
 */
export const CountryCodeDropdown: React.FC<CountryCodeDropdownProps> = ({
  selectedIso2,
  onChange,
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => {
    const lower = selectedIso2.toLowerCase();
    return ORDERED_COUNTRIES.find((c) => c.iso2 === lower) || ORDERED_COUNTRIES[0];
  }, [selectedIso2]);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim().replace(/^\+/, '');
    if (!q) return ORDERED_COUNTRIES;
    return ORDERED_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso2.includes(q) ||
        c.dialCode.includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 300 && rect.top > 260);
    }
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 40);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && isOpen && filteredCountries.length > 0) {
      e.preventDefault();
      onChange(filteredCountries[0]);
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative shrink-0 ${isOpen ? 'z-[75]' : ''}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Country code: ${selected.name} +${selected.dialCode}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`h-full rounded-lg pl-2.5 pr-2 py-3 text-[13px] font-mono border flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF000E] ${
          isDark
            ? 'bg-[#181113] border-[#261619] hover:border-[#3D2227] text-white'
            : 'bg-[#F5F3EE] border-[#E0DBD2] hover:border-[#C8C2B6] text-[#140E10]'
        }`}
      >
        <span
          className={`fi fi-${selected.iso2} rounded-[2px] shrink-0`}
          style={{ width: '20px', height: '15px', display: 'inline-block' }}
          aria-hidden="true"
        />
        <span className="font-semibold">+{selected.dialCode}</span>
        <i
          className={`bi bi-chevron-${openUpward && isOpen ? 'up' : 'down'} text-[10px] opacity-60`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Select country dial code"
          className={`absolute left-0 w-72 sm:w-80 rounded-xl border shadow-2xl overflow-hidden flex flex-col z-[80] ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            isDark
              ? 'bg-[#0A0A0A] border-[#261619] text-[#F1EEEE]'
              : 'bg-white border-[#E0DBD2] text-[#140E10]'
          }`}
        >
          {/* Sticky Search Input */}
          <div className={`p-2 border-b ${isDark ? 'border-[#222222] bg-[#050505]' : 'border-[#E0DBD2] bg-[#FAF8F4]'}`}>
            <div className="relative flex items-center">
              <i className="bi bi-search text-xs opacity-50 absolute left-2.5 pointer-events-none" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or +code..."
                aria-label="Search country or dial code"
                className={`w-full rounded-lg pl-7 pr-7 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF000E] border ${
                  isDark
                    ? 'bg-[#141414] border-[#262626] text-white placeholder:text-neutral-500'
                    : 'bg-white border-[#D6D0C7] text-[#140E10] placeholder:text-[#8E8587]'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear country search"
                  className="absolute right-2 opacity-60 hover:opacity-100 cursor-pointer"
                >
                  <i className="bi bi-x text-sm" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* All Country Dial Codes */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-transparent">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = country.iso2 === selected.iso2;
                return (
                  <button
                    key={country.iso2}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(country);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF000E] text-white font-semibold'
                        : isDark
                          ? 'hover:bg-[#161616] text-[#F1EEEE]'
                          : 'hover:bg-[#F5F3EE] text-[#140E10]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`fi fi-${country.iso2} rounded-[2px] shrink-0`}
                        style={{ width: '18px', height: '14px', display: 'inline-block' }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{country.name}</span>
                    </span>
                    <span className={`font-mono text-[11px] shrink-0 ${isSelected ? 'text-white' : 'opacity-70'}`}>
                      +{country.dialCode}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-5 text-center text-xs opacity-60">
                No matching countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
