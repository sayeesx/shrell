import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../application/ThemeContext';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

interface StateSearchDropdownProps {
  value: string;
  onChange: (state: string) => void;
  required?: boolean;
}

export const StateSearchDropdown: React.FC<StateSearchDropdownProps> = ({
  value,
  onChange,
  required = true,
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter states based on query
  const filteredStates = INDIAN_STATES.filter((st) =>
    st.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open and check space to open upward or downward
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If space below is constrained (especially above fixed bottom checkout bar), open upward
        if (spaceBelow < 280 && rect.top > 250) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && isOpen && filteredStates.length > 0) {
      e.preventDefault();
      onChange(filteredStates[0]);
      setIsOpen(false);
    }
  };

  const handleSelect = (st: string) => {
    onChange(st);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-[65]' : ''}`} onKeyDown={handleKeyDown}>
      <label className="block text-[11px] font-semibold mb-1 opacity-80">
        State / Union Territory {required ? '*' : ''}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full rounded-lg px-3.5 py-3 text-[13px] border text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[#FF000E] cursor-pointer ${
          isDark
            ? 'bg-[#181113] border-[#261619] text-white hover:border-[#3D2024]'
            : 'bg-[#F5F3EE] border-[#E0DBD2] text-black hover:border-gray-400'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {value || <span className="text-gray-400">Select delivery state</span>}
        </span>
        <i
          className={`bi bi-chevron-down text-[11px] text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-[#FF000E]' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown with Search */}
      {isOpen && (
        <div
          className={`absolute z-[70] left-0 right-0 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } rounded-xl border shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-150 ${
            isDark
              ? 'bg-[#120E0F] border-[#261619] shadow-black/80'
              : 'bg-white border-[#E0DBD2] shadow-2xl'
          }`}
          role="listbox"
        >
          {/* Search Input Box */}
          <div className={`p-2.5 border-b ${isDark ? 'border-[#261619] bg-[#161012]' : 'border-[#E0DBD2] bg-[#FAF8F5]'}`}>
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search state or UT..."
                className={`w-full rounded-lg pl-8 pr-7 py-2 text-xs border focus:outline-none focus:ring-1 focus:ring-[#FF000E] ${
                  isDark
                    ? 'bg-[#0E0A0B] border-[#261619] text-white placeholder-gray-500'
                    : 'bg-white border-[#E0DBD2] text-black placeholder-gray-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-circle-fill text-xs" />
                </button>
              )}
            </div>
          </div>

          {/* List of States */}
          <div className="max-h-56 overflow-y-auto py-1 text-xs">
            {filteredStates.length > 0 ? (
              filteredStates.map((st) => {
                const isSelected = st === value;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSelect(st)}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#FF000E]/15 text-[#FF000E] font-bold'
                          : 'bg-[#FF000E]/10 text-[#FF000E] font-bold'
                        : isDark
                          ? 'text-gray-300 hover:bg-[#1A1214] hover:text-white'
                          : 'text-gray-800 hover:bg-[#F5F3EE] hover:text-black'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{st}</span>
                    {isSelected && <i className="bi bi-check2 text-sm text-[#FF000E]" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-gray-400">
                <i className="bi bi-geo-alt text-lg block mb-1 opacity-50" />
                <span>No state found matching &ldquo;{searchQuery}&rdquo;</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

