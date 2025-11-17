import React, { useState, useMemo } from 'react';

type DropdownOption = string | number | { value: string | number; label: string | number };

interface HoverDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
}

const HoverDropdown: React.FC<HoverDropdownProps> = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (optionValue: string | number) => {
    onChange(String(optionValue));
    setIsOpen(false);
  };
  
  // FIX: The original type guard was not narrowing the type correctly.
  // By checking for primitive types (string/number) first, TypeScript can
  // correctly infer that the 'else' branch must contain an object, resolving the type error.
  const getOptionValue = (option: DropdownOption): string | number => {
    if (typeof option === 'string' || typeof option === 'number') {
      return option;
    }
    return option.value;
  };

  // FIX: The original type guard was not narrowing the type correctly.
  // By checking for primitive types (string/number) first, TypeScript can
  // correctly infer that the 'else' branch must contain an object, resolving the type error.
  const getOptionLabel = (option: DropdownOption): string | number => {
    if (typeof option === 'string' || typeof option === 'number') {
      return option;
    }
    return option.label;
  };

  const selectedLabel = useMemo(() => {
    if (!value) return 'Todos';
    const selectedOption = options.find(opt => String(getOptionValue(opt)) === value);
    return selectedOption ? getOptionLabel(selectedOption) : 'Todos';
  }, [options, value]);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <label className="text-xs font-medium text-brand-text-secondary">{label}</label>
      <div className="mt-1 block w-full bg-brand-surface text-brand-text rounded-md py-1.5 px-3 text-sm flex items-center cursor-pointer">
        <span className={value ? 'text-brand-text' : 'text-brand-text-secondary'}>
          {selectedLabel}
        </span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-brand-bg-light border border-brand-surface rounded-md shadow-lg z-40 max-h-60 overflow-y-auto pt-1">
          <ul>
            <li
              className={`p-2 text-sm cursor-pointer hover:bg-brand-primary/20 ${!value ? 'bg-brand-primary/20 text-brand-primary' : 'hover:text-brand-primary'}`}
              onClick={() => handleSelect('')}
            >
              Todos
            </li>
            {options.map((opt, index) => {
              const optValue = getOptionValue(opt);
              const optLabel = getOptionLabel(opt);
              return (
                <li
                  key={`${String(optValue)}-${index}`}
                  className={`p-2 text-sm cursor-pointer hover:bg-brand-primary/20 ${String(value) === String(optValue) ? 'bg-brand-primary/20 text-brand-primary' : 'hover:text-brand-primary'}`}
                  onClick={() => handleSelect(optValue)}
                >
                  {optLabel}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HoverDropdown;