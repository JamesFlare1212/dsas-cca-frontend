import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { ClubBasic, ClubDetail, CategoryCount, AcademicYearCount } from '@types';
import {
  listAllClubs,
  filterClubs,
  getAvailableCategories,
  getAvailableAcademicYears,
} from '@utils/apiService';
import { debounce } from '@utils/debounce';
import ClubCard from './ClubCard';
import SearchBar from './SearchBar';
import ClubDetailModal from './ClubDetailModal'; // Import the modal

const ClubList: React.FC = () => {
  const [allClubsData, setAllClubsData] = useState<ClubBasic[]>([]);
  const [displayedClubs, setDisplayedClubs] = useState<ClubBasic[]>([]);
  const [clubDetailsCache, setClubDetailsCache] = useState<{ [id: string]: ClubDetail }>({});

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');

  const [availableCategories, setAvailableCategories] = useState<CategoryCount>({});
  const [availableAcademicYears, setAvailableAcademicYears] = useState<AcademicYearCount>({});

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedClubForModal, setSelectedClubForModal] = useState<ClubDetail | null>(null);

  const fuse = useMemo(() => {
    if (!allClubsData.length) return null;
    return new Fuse(allClubsData, {
      keys: ['name', 'id'],
      threshold: 0.3,
    });
  }, [allClubsData]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categories, academicYears] = await Promise.all([
          getAvailableCategories(),
          getAvailableAcademicYears(),
        ]);
        setAvailableCategories(categories);
        setAvailableAcademicYears(academicYears);
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  const fetchFilteredClubsFromAPI = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const gradeNumber = selectedGrade ? parseInt(selectedGrade, 10) : undefined;
      if (selectedGrade && (isNaN(gradeNumber) || gradeNumber < 1 || gradeNumber > 12)) {
        setError("Invalid grade. Please enter a number between 1 and 12.");
        setAllClubsData([]);
        setDisplayedClubs([]);
        setIsLoading(false);
        return;
      }

      let clubs;
      if (selectedCategory || selectedAcademicYear || (gradeNumber && gradeNumber >= 1 && gradeNumber <= 12)) {
        clubs = await filterClubs({
          category: selectedCategory || undefined,
          academicYear: selectedAcademicYear || undefined,
          grade: gradeNumber,
        });
      } else {
        clubs = await listAllClubs();
      }
      setAllClubsData(clubs);
    } catch (err) {
      console.error('Failed to fetch clubs:', err);
      setError('Could not load clubs. Please try refreshing.');
      setAllClubsData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedAcademicYear, selectedGrade]);

  useEffect(() => {
    fetchFilteredClubsFromAPI();
  }, [fetchFilteredClubsFromAPI]);

  useEffect(() => {
    if (!allClubsData.length && !searchTerm) {
      setDisplayedClubs([]);
      return;
    }
    if (!fuse) {
      setDisplayedClubs(allClubsData);
      return;
    }

    if (searchTerm.trim() === '') {
      setDisplayedClubs(allClubsData);
    } else {
      const results = fuse.search(searchTerm);
      setDisplayedClubs(results.map(result => result.item));
    }
  }, [searchTerm, allClubsData, fuse]);

  const debouncedSetSearchTerm = useMemo(() => debounce(setSearchTerm, 300), []);

  const handleDetailsLoadedForCache = useCallback((clubId: string, details: ClubDetail) => {
    setClubDetailsCache(prevCache => ({ ...prevCache, [clubId]: details }));
  }, []);

  // Modal handler functions
  const handleOpenModal = useCallback((clubDetail: ClubDetail) => {
    setSelectedClubForModal(clubDetail);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedClubForModal(null);
  }, []);


  if (isLoading && !allClubsData.length && !Object.keys(availableCategories).length) return <p className="loading-message">Loading clubs and filters...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <SearchBar
        onSearchTermChange={debouncedSetSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        availableCategories={availableCategories}
        selectedAcademicYear={selectedAcademicYear}
        onAcademicYearChange={setSelectedAcademicYear}
        availableAcademicYears={availableAcademicYears}
        selectedGrade={selectedGrade}
        onGradeChange={setSelectedGrade}
      />
      {isLoading && <p className="loading-message">Filtering clubs...</p>}
      {!isLoading && displayedClubs.length === 0 && (
        <p className="loading-message">No clubs match your criteria.</p>
      )}
      <div className="cards-grid">
        {displayedClubs.map(club => (
          <ClubCard
            key={club.id}
            club={club}
            initialDetails={clubDetailsCache[club.id]} // Pass cached details if available
            onDetailsLoaded={handleDetailsLoadedForCache}
            onViewMore={handleOpenModal} // Pass the modal opener function
          />
        ))}
      </div>

      <ClubDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        clubDetail={selectedClubForModal}
      />
    </div>
  );
};

export default ClubList;