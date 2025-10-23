import React, { useState, useEffect, useRef, useMemo } from 'react';

interface ComboBoxProps {
  label: string;
  id: string;
  options: { value: string | number; label: string }[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
}

const ComboBox: React.FC<ComboBoxProps> = ({ label, id, options, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!inputValue) {
      return options;
    }
    const selectedOption = options.find(option => option.value === value);
    if (selectedOption && selectedOption.label === inputValue) {
        return options;
    }

    return options.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, options, value]);

  useEffect(() => {
    const selectedOption = options.find(option => option.value === value);
    setInputValue(selectedOption ? selectedOption.label : '');
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selectedOption = options.find(option => option.value === value);
        setInputValue(selectedOption ? selectedOption.label : ''); // Reset on close if no selection
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, value, options]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setInputValue(term);
    setIsOpen(true);
    if (term === '') {
        onChange('');
    }
  };

  const handleOptionClick = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col" ref={wrapperRef}>
      <label htmlFor={id} className="mb-2 font-medium text-sm text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-shadow duration-200 w-full"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg top-full">
          {filteredOptions.length > 0 ? filteredOptions.map(option => (
            <li
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {option.label}
            </li>
          )) : <li className="px-4 py-2 text-gray-500">No options found</li>}
        </ul>
      )}
    </div>
  );
};

export default ComboBox;