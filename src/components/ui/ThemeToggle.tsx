import React from 'react';
import { useTheme } from '../../application/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  /** compact: icon-only button; default: icon + label */
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className={`toggle-switch ${className}`} style={{ width: '50px', height: '25px' }}>
      <label className="switch-label" style={{ 
        position: 'absolute',
        width: '100%',
        height: '25px',
        backgroundColor: isDark ? '#28292c' : '#d8dbe0',
        borderRadius: '25px',
        cursor: 'pointer',
        border: '2px solid',
        borderColor: isDark ? '#28292c' : '#d8dbe0'
      }}>
        <input 
          type="checkbox" 
          className="checkbox" 
          checked={!isDark}
          onChange={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          style={{ position: 'absolute', display: 'none' }}
        />
        <span className="slider" style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '25px',
          transition: '0.3s',
          backgroundColor: isDark ? '#28292c' : '#d8dbe0'
        }} />
      </label>
      <style>{`
        .checkbox {
          position: absolute;
          display: none !important;
        }
        .checkbox:checked ~ .slider {
          background-color: #d8dbe0 !important;
        }
        .slider::before {
          content: "";
          position: absolute;
          top: 5px;
          left: 5px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          box-shadow: inset 6px -2px 0px 0px #d8dbe0;
          background-color: #28292c;
          transition: 0.3s;
        }
        .checkbox:checked ~ .slider::before {
          transform: translateX(25px);
          background-color: #28292c;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};
