import React, { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";

const CustomInput = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <div className="relative w-full">
    <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400 z-10 pointer-events-none" />
    <input
      type="text"
      onClick={onClick}
      ref={ref}
      value={value}
      readOnly
      placeholder={placeholder}
      className={`pl-8 w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:ring-2 focus:ring-[#875A7B] focus:border-transparent outline-none cursor-pointer bg-white ${className}`}
    />
  </div>
));

const DatePicker = ({ value, onChange, placeholder = "DD-MM-YYYY", className = "", showMonthYearPicker = false }) => {
  const dateFormat = showMonthYearPicker ? "MM/yyyy" : "dd-MM-yyyy";

  // Parse the input string (DD-MM-YYYY or MM/yyyy) to a Date object
  const getSelectedDate = () => {
    if (!value) return null;
    const parsedDate = parse(value, showMonthYearPicker ? 'MM-yyyy' : 'dd-MM-yyyy', new Date());
    return isValid(parsedDate) ? parsedDate : null;
  };

  // Handle date change
  const handleChange = (date) => {
    if (date) {
      const formattedDate = format(date, showMonthYearPicker ? 'MM-yyyy' : 'dd-MM-yyyy');
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  return (
    <ReactDatePicker
      selected={getSelectedDate()}
      onChange={handleChange}
      dateFormat={dateFormat}
      placeholderText={placeholder}
      customInput={<CustomInput className={className} />}
      wrapperClassName="w-full"
      showMonthYearPicker={showMonthYearPicker}
      showMonthDropdown
      showYearDropdown
      yearDropdownItemNumber={15}
      scrollableYearDropdown
      dropdownMode="select"
    />
  );
};

export default DatePicker;
