import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../application/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  /** compact: icon-only button; default: icon + label */
  compact?: boolean;
}

const Switch = styled.div`
  .toggle-switch {
    position: relative;
    width: 60px;
    height: 30px;
    --light: #d8dbe0;
    --dark: #28292c;
    --link: rgb(27, 129, 112);
    --link-hover: rgb(24, 94, 82);
  }
  
  .switch-label {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: var(--dark);
    border-radius: 25px;
    cursor: pointer;
    border: 3px solid var(--dark);
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
    -webkit-transition: 0.3s;
    transition: 0.3s;
  }
  
  .checkbox:checked ~ .slider {
    background-color: var(--light);
  }
  
  .slider::before {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    -webkit-box-shadow: inset 12px -4px 0px 0px var(--light);
    box-shadow: inset 12px -4px 0px 0px var(--light);
    background-color: var(--dark);
    -webkit-transition: 0.3s;
    transition: 0.3s;
  }
  
  .checkbox:checked ~ .slider::before {
    -webkit-transform: translateX(30px);
    -ms-transform: translateX(30px);
    transform: translateX(30px);
    background-color: var(--dark);
    -webkit-box-shadow: none;
    box-shadow: none;
  }
`;

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', compact = false }) => {
  const { toggleTheme, isDark } = useTheme();

  const handleToggle = () => {
    toggleTheme();
  };

  return (
    <div className={className}>
      <Switch>
        <div className="toggle-switch">
          <label className="switch-label">
            <input 
              type="checkbox" 
              className="checkbox" 
              checked={!isDark} 
              onChange={handleToggle}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            />
            <span className="slider" />
          </label>
        </div>
      </Switch>
      {!compact && (
        <span className="text-xs mt-1 block text-center">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;