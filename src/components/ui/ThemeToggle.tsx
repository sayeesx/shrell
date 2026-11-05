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
    <div className={`toggle-switch ${className}`}>
      <label className="switch-label">
        <input 
          type="checkbox" 
          className="checkbox" 
          checked={!isDark}
          onChange={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        />
        <span className="slider" />
      </label>
      <style>{`
        .toggle-switch {
          position: relative;
          width: 50px;
          height: 25px;
        }
        .switch-label {
          position: absolute;
          width: 100%;
          height: 25px;
          background-color: #28292c;
          border-radius: 25px;
          cursor: pointer;
          border: 2px solid #28292c;
        }
        .checkbox {
          position: absolute;
          display: none;
        }
        .slider {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 25px;
          transition: 0.3s;
        }
        .checkbox:checked ~ .slider {
          background-color: #d8dbe0;
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
