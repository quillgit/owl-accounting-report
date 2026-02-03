import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    (opt.label || '').toLowerCase().includes(search.toLowerCase()) || 
    (opt.value || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus-within:ring-2 focus-within:ring-[#875A7B] bg-white cursor-pointer flex items-center justify-between"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
      >
        <span className={`truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
          {selectedOption ? (selectedOption.label || `${selectedOption.value} - ${selectedOption.name}`) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </div>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-[#875A7B]"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 text-xs cursor-pointer hover:bg-purple-50 ${value === opt.value ? 'bg-purple-50 text-[#875A7B] font-medium' : 'text-gray-700'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label || `${opt.value} - ${opt.name}`}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-gray-400 text-center">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
