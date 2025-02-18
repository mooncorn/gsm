import React, { useRef, useEffect } from "react";
import FormInput from "./FormInput";

interface SearchDropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  options: string[];
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  placeholder?: string;
  required?: boolean;
  isLoading?: boolean;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  label,
  value,
  onChange,
  onSelect,
  options,
  showDropdown,
  setShowDropdown,
  placeholder,
  required,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowDropdown]);

  return (
    <div className="relative" ref={inputRef}>
      <FormInput
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value && setShowDropdown(true)}
        placeholder={placeholder}
        required={required}
      />
      {showDropdown && options.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {isLoading ? (
              <li className="px-4 py-2 text-sm text-gray-400">Loading...</li>
            ) : (
              options.map((option) => (
                <li
                  key={option}
                  className="px-4 py-2 text-sm hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    onSelect(option);
                    setShowDropdown(false);
                  }}
                >
                  {option}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
