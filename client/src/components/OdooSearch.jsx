import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

const OdooSearch = ({ onSearch, placeholder = "Search...", searchableFields = [] }) => {
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState([]); // Array of { field, value, label }
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notify parent whenever filters or input changes
  useEffect(() => {
    // We pass both the current text input (for generic search) and the structured filters
    onSearch({ text: inputValue, filters });
  }, [inputValue, filters]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % (searchableFields.length + 1)); // +1 for generic search
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + searchableFields.length + 1) % (searchableFields.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        if (focusedIndex === 0) {
           // Generic search (just keep text)
           setShowDropdown(false);
        } else {
           // Field specific search
           const field = searchableFields[focusedIndex - 1];
           addFilter(field, inputValue);
        }
      }
    } else if (e.key === 'Backspace' && !inputValue && filters.length > 0) {
      removeFilter(filters.length - 1);
    }
  };

  const addFilter = (field, value) => {
    const newFilter = {
      field: field.key,
      label: `${field.label}: ${value}`,
      value: value
    };
    setFilters([...filters, newFilter]);
    setInputValue('');
    setShowDropdown(false);
    setFocusedIndex(0);
  };

  const removeFilter = (index) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="flex flex-wrap items-center gap-2 w-full pl-9 pr-4 py-1.5 rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-[#875A7B] focus-within:border-transparent transition-all shadow-sm min-h-[42px]"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        
        {filters.map((filter, idx) => (
          <span key={idx} className="flex items-center gap-1 bg-purple-100 text-[#875A7B] text-xs font-medium px-2 py-1 rounded-full border border-purple-200">
            {filter.label}
            <button 
              onClick={(e) => { e.stopPropagation(); removeFilter(idx); }}
              className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] outline-none text-sm py-1"
          placeholder={filters.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(!!e.target.value.trim());
            setFocusedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
              if (inputValue.trim()) setShowDropdown(true);
          }}
        />
        
        {/* Dropdown arrow if needed, but search icon usually suffices */}
      </div>

      {showDropdown && inputValue.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
           {/* Generic Option */}
           <div 
             className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between ${focusedIndex === 0 ? 'bg-purple-50 text-[#875A7B]' : 'text-gray-700 hover:bg-gray-50'}`}
             onClick={() => setShowDropdown(false)}
           >
             <span>Search <span className="font-bold">"{inputValue}"</span>...</span>
           </div>
           
           <div className="border-t border-gray-100 my-1"></div>
           
           <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
             Search by...
           </div>

           {searchableFields.map((field, idx) => (
             <div 
               key={field.key}
               className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between ${focusedIndex === idx + 1 ? 'bg-purple-50 text-[#875A7B]' : 'text-gray-700 hover:bg-gray-50'}`}
               onClick={() => addFilter(field, inputValue)}
             >
               <span>Search <span className="font-bold">"{inputValue}"</span> in <span className="font-medium text-gray-900">{field.label}</span></span>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default OdooSearch;
