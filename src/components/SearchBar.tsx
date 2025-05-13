import React, { useState } from 'react'; // Removed useEffect as it's not needed here anymore
import type { CategoryCount, AcademicYearCount } from '@types';

interface SearchBarProps {
  // initialSearchTerm?: string; // Could be used if you want to pre-fill from URL params etc.
  onSearchTermChange: (term: string) => void; // This is the debounced function from parent
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  availableCategories: CategoryCount;
  selectedAcademicYear: string;
  onAcademicYearChange: (year: string) => void;
  availableAcademicYears: AcademicYearCount;
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearchTermChange, // This is the debounced function from ClubList
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedAcademicYear,
  onAcademicYearChange,
  availableAcademicYears,
  selectedGrade,
  onGradeChange,
}) => {
  const [inputValue, setInputValue] = useState<string>(''); // Local state for immediate input update

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue); // Update local state immediately for responsive input field
    onSearchTermChange(newValue); // Call the debounced function passed from the parent
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        placeholder="Search clubs by name or ID..."
        value={inputValue} // Bind to local state
        onChange={handleInputChange}
        aria-label="Search clubs"
      />
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {Object.entries(availableCategories).map(([category, count]) => (
          <option key={category} value={category}>
            {category} ({count})
          </option>
        ))}
      </select>
      <select
        value={selectedAcademicYear}
        onChange={(e) => onAcademicYearChange(e.target.value)}
        aria-label="Filter by academic year"
      >
        <option value="">All Academic Years</option>
        {Object.entries(availableAcademicYears).map(([year, count]) => (
          <option key={year} value={year}>
            {year} ({count})
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Grade (1-12)"
        value={selectedGrade} // Grade filter updates directly, not usually typed fast
        onChange={(e) => onGradeChange(e.target.value)}
        min="1"
        max="12"
        aria-label="Filter by grade"
      />
    </div>
  );
};

export default SearchBar;