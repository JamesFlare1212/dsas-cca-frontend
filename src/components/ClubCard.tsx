import React, { useState, useEffect, useCallback } from 'react';
import type { ClubBasic, ClubDetail } from '@types';
import { getClubDetails } from '@utils/apiService';

interface ClubCardProps {
  club: ClubBasic;
  initialDetails?: ClubDetail | null;
  onDetailsLoaded?: (clubId: string, details: ClubDetail) => void;
  onViewMore: (clubDetail: ClubDetail) => void; // Callback to open modal in parent
}

const ClubCard: React.FC<ClubCardProps> = ({ club, initialDetails = null, onDetailsLoaded, onViewMore }) => {
  const [details, setDetails] = useState<ClubDetail | null>(initialDetails);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(!initialDetails);
  const [error, setError] = useState<string | null>(null);

  const fetchDetailsIfNeeded = useCallback(async () => {
    if (details || !club.id) return; // Already have details or no ID

    setIsLoadingDetails(true);
    setError(null);
    try {
      const fetchedDetails = await getClubDetails(club.id);
      setDetails(fetchedDetails);
      if (onDetailsLoaded) {
        onDetailsLoaded(club.id, fetchedDetails);
      }
    } catch (err) {
      console.error(`Failed to fetch details for club ${club.id}:`, err);
      setError('Could not load some details.'); // Less critical error now
    } finally {
      setIsLoadingDetails(false);
    }
  }, [club.id, details, onDetailsLoaded]);

  // Fetch details when component mounts if not already provided
  useEffect(() => {
    fetchDetailsIfNeeded();
  }, [fetchDetailsIfNeeded]);

  const handleViewMoreClick = () => {
    if (details) {
      onViewMore(details);
    } else if (!isLoadingDetails) {
      fetchDetailsIfNeeded().then(() => {
        // Re-check details state after fetch attempt
        if(details) onViewMore(details);
      });
    }
  };

  const renderDetailItem = (label: string, value: string | undefined | null) => {
    if (isLoadingDetails && !details) return <p className="card-info-placeholder">{label}: Loading...</p>;
    // Check specifically for the case where details ARE loaded but the value is missing/null/undefined
    if (details && !value) return <p className="card-info-placeholder">{label}: N/A</p>;
    // If details are not loaded yet, and we are not actively loading, show N/A or nothing? Let's stick to Loading... or the value
    if (!details && !isLoadingDetails) return <p className="card-info-placeholder">{label}: N/A</p> // Or maybe return null
    // If we have a value (implies details are loaded)
    if (value) return <p><strong>{label}:</strong> {value}</p>;
    // Fallback for the loading state (already handled above, but as safety)
    return <p className="card-info-placeholder">{label}: Loading...</p>;
  }


  return (
    <div className="card">
      <div className="card-photo-container">
        {/* === Updated img tag below === */}
        <img
          src={club.photo}
          alt={club.name}
          className="card-photo"
          loading="lazy"          // Defer loading until near viewport
          decoding="async"        // Hint to decode off main thread
          fetchpriority="low"     // Hint that it's not critical compared to other resources
         />
        {/* === End of updated img tag === */}
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
          disabled={isLoadingDetails && !details} // Disable if actively loading initial essential details
        >
          {isLoadingDetails && !details ? 'Loading Details...' : 'View Full Details'}
        </button>
      </div>
    </div>
  );
};

export default ClubCard;