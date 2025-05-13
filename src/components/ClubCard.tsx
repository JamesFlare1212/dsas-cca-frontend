// src/components/ClubCard.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ClubBasic, ClubDetail } from '@types';
import { getClubDetails } from '@utils/apiService';
import activityDetailLimiter from '@utils/concurrencyLimiter';

interface ClubCardProps {
  club: ClubBasic;
  initialDetails?: ClubDetail | null;
  onDetailsLoaded?: (clubId: string, details: ClubDetail) => void;
  onViewMore: (clubDetail: ClubDetail) => void;
}

const ClubCard: React.FC<ClubCardProps> = ({ club, initialDetails = null, onDetailsLoaded, onViewMore }) => {
  const [details, setDetails] = useState<ClubDetail | null>(initialDetails);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false); // Don't set to true initially if not visible
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const fetchDetailsIfNeeded = useCallback(async () => {
    if (details || !club.id || !isVisible) return; // Already have details, no ID, or not visible

    setIsLoadingDetails(true);
    setError(null);
    try {
      // Run the API call through the concurrency limiter
      const fetchedDetails = await activityDetailLimiter.run(() => getClubDetails(club.id));
      setDetails(fetchedDetails);
      if (onDetailsLoaded) {
        onDetailsLoaded(club.id, fetchedDetails);
      }
    } catch (err: any) {
      console.error(`Failed to fetch details for club ${club.id} (concurrency controlled):`, err);
      setError(`Could not load some details. ${err.message || ''}`); // Show more specific error
    } finally {
      setIsLoadingDetails(false);
    }
  }, [club.id, details, onDetailsLoaded, isVisible]); // Add isVisible dependency

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Stop observing once visible
        }
      },
      {
        rootMargin: '0px', // Can be adjusted, e.g., '100px' to load slightly before visible
        threshold: 0.1    // Trigger when 10% of the element is visible
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []); // Run once on mount

  // Fetch details when component becomes visible and details are needed
  useEffect(() => {
    if (isVisible && !initialDetails) { // Only fetch if visible and no initial details
        fetchDetailsIfNeeded();
    }
  }, [isVisible, fetchDetailsIfNeeded, initialDetails]);

  const handleViewMoreClick = async () => {
    let currentDetails = details;
    if (!currentDetails && !isLoadingDetails) {
      // If details somehow weren't loaded and not currently loading, try again then open
      // This attempt will also go through the limiter and retry logic
      setError(null); // Clear previous error before manual retry via button
      setIsLoadingDetails(true);
      try {
        currentDetails = await activityDetailLimiter.run(() => getClubDetails(club.id));
        setDetails(currentDetails);
        if (onDetailsLoaded && currentDetails) {
          onDetailsLoaded(club.id, currentDetails);
        }
      } catch (err: any) {
         console.error(`Manual fetch failed for club ${club.id}:`, err);
         setError(`Failed to load details. ${err.message || ''}`);
      } finally {
        setIsLoadingDetails(false);
      }
    }

    if (currentDetails) {
      onViewMore(currentDetails);
    } else {
        // Optionally inform user that details couldn't be loaded even after click
        console.warn("Details not available to show in modal for club:", club.id);
    }
  };

  const renderDetailItem = (label: string, value: string | undefined | null) => {
    // Show "Loading..." only if it's visible and actively loading
    if (isVisible && isLoadingDetails && !details) return <p className="card-info-placeholder">{label}: Loading...</p>;
    if (details && !value) return <p className="card-info-placeholder">{label}: N/A</p>;
    if (!details && !isLoadingDetails && isVisible) return <p className="card-info-placeholder">{label}: N/A</p>;
    if (!isVisible && !initialDetails) return <p className="card-info-placeholder">{label}: (Scroll to load)</p>; // Placeholder before visible
    if (value) return <p><strong>{label}:</strong> {value}</p>;
    if (initialDetails && !value) return <p className="card-info-placeholder">{label}: N/A</p>; // For initialDetails case
    return <p className="card-info-placeholder">{label}: N/A</p>; // Default placeholder
  };


  return (
    <div className="card" ref={cardRef}>
      <div className="card-photo-container">
        <img
          src={club.photo}
          alt={club.name}
          className="card-photo"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
         />
      </div>
      <div className="card-content">
        <h3>{club.name}</h3>
        {error && <p className="error-message" style={{ fontSize: '0.8em', color: '#e74c3c' }}>{error}</p>}

        {renderDetailItem("Category", details?.category)}
        {renderDetailItem("Grades", details ? `G${details.grades.min} - G${details.grades.max}` : undefined)}
        {renderDetailItem("Meets", details ? `${details.meeting.day}, ${details.meeting.startTime}-${details.meeting.endTime}` : undefined)}
        {renderDetailItem("Location", details?.meeting.location.room)}

        <button
          onClick={handleViewMoreClick}
          className="card-button"
          disabled={isLoadingDetails} // Disable if actively loading
        >
          {isLoadingDetails ? 'Loading...' : 'View Full Details'}
        </button>
      </div>
    </div>
  );
};

export default ClubCard;