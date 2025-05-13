import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { StaffMember } from '@types';
import { getAllStaff } from '@utils/apiService';
import { debounce } from '@utils/debounce';
import StaffCard from './StaffCard';

const StaffList: React.FC = () => {
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [displayedStaff, setDisplayedStaff] = useState<StaffMember[]>([]);

  const [inputValue, setInputValue] = useState<string>(''); // For immediate input responsiveness
  const [actualSearchTerm, setActualSearchTerm] = useState<string>(''); // For debounced search logic

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const staffData = await getAllStaff();
        setAllStaff(staffData);
        // setDisplayedStaff(staffData); // Moved to the search effect
      } catch (err) {
        console.error('Failed to fetch staff:', err);
        setError('Could not load staff members. Please try refreshing.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const fuse = useMemo(() => {
    if (!allStaff.length) return null;
    return new Fuse(allStaff, {
      keys: ['name', 'id'],
      threshold: 0.3,
    });
  }, [allStaff]);

  // Debounced function to update the actualSearchTerm that triggers Fuse.js
  const debouncedSetActualSearchTerm = useMemo(
    () => debounce(setActualSearchTerm, 300),
    [] // No dependencies, debounce function is stable
  );

  // Effect to apply Fuse.js search based on actualSearchTerm
  useEffect(() => {
    if (isLoading) return; // Don't filter if still loading initial data

    if (!fuse) { // If fuse is not ready (e.g. allStaff is empty)
      setDisplayedStaff(allStaff); // Show all staff (which would be empty if allStaff is empty)
      return;
    }

    if (actualSearchTerm.trim() === '') {
      setDisplayedStaff(allStaff);
    } else {
      const results = fuse.search(actualSearchTerm);
      setDisplayedStaff(results.map(result => result.item));
    }
  }, [actualSearchTerm, allStaff, fuse, isLoading]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue); // Update input field immediately
    debouncedSetActualSearchTerm(newValue); // Trigger debounced search logic
  };


  if (isLoading && !allStaff.length) return <p className="loading-message">Loading staff members...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div className="search-bar-container" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search staff by name or ID..."
          value={inputValue} // Use local inputValue for responsiveness
          onChange={handleInputChange}
          aria-label="Search staff"
          style={{width: '100%'}}
        />
      </div>
      {isLoading && <p className="loading-message">Processing...</p>}
      {!isLoading && displayedStaff.length === 0 && actualSearchTerm && (
         <p className="loading-message">No staff members match "{actualSearchTerm}".</p>
      )}
      {!isLoading && displayedStaff.length === 0 && !actualSearchTerm && allStaff.length > 0 && (
         <p className="loading-message">No staff members found (Type to search).</p>
      )}
       {!isLoading && displayedStaff.length === 0 && !actualSearchTerm && allStaff.length === 0 && !error && (
         <p className="loading-message">No staff data available.</p>
      )}
      <div className="cards-grid">
        {displayedStaff.map(staffMember => (
          <StaffCard key={staffMember.id} staff={staffMember} />
        ))}
      </div>
    </div>
  );
};

export default StaffList;