// src/components/SearchBar.tsx
import React, { useState } from 'react';
import type { CategoryCount, AcademicYearCount } from '@types';

interface SearchBarProps {
  onSearchTermChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  availableCategories: CategoryCount;
  selectedAcademicYear: string;
  onAcademicYearChange: (year: string) => void;
  availableAcademicYears: AcademicYearCount;
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  selectedStudentLed: string;
  onStudentLedChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearchTermChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedAcademicYear,
  onAcademicYearChange,
  availableAcademicYears,
  selectedGrade,
  onGradeChange,
  selectedStudentLed,
  onStudentLedChange,
}) => {
  const [inputValue, setInputValue] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onSearchTermChange(newValue);
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        placeholder="Search clubs by name or ID..."
        value={inputValue}
        onChange={handleInputChange}
        aria-label="Search clubs"
      />
      <input
        type="number"
        placeholder="Grade (1-12)"
        value={selectedGrade}
        onChange={(e) => onGradeChange(e.target.value)}
        min="1"
        max="12"
        aria-label="Filter by grade"
      />
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
        value={selectedStudentLed}
        onChange={(e) => onStudentLedChange(e.target.value)}
        aria-label="Filter by student-led status"
      >
        <option value="">All Types</option>
        <option value="true">Student-Led Only</option>
        <option value="false">Teacher-Led Only</option>
      </select>
    </div>
  );
};

export default SearchBar;