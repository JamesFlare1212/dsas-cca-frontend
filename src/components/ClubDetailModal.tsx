import React from 'react';
import type { ClubDetail } from '@types';

interface ClubDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubDetail: ClubDetail | null;
}

const ClubDetailModal: React.FC<ClubDetailModalProps> = ({ isOpen, onClose, clubDetail }) => {
  if (!isOpen || !clubDetail) {
    return null;
  }

  // Helper to display string fields that might be null or empty
  const displayOptionalString = (value: string | null | undefined, labelIfEmpty: string = 'N/A'): string => {
    if (value === null || value === undefined || value.trim() === "") {
      return labelIfEmpty;
    }
    // Check for specific string values like "Free" for semesterCost, case-insensitive
    if (value.toLowerCase() === 'free') {
        return 'Free';
    }
    if (value === "0") { // If cost is "0" string
        return 'Free'; // Or display "0" if that's preferred
    }
    return value;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close modal">&times;</button>
        <h2>{clubDetail.name}</h2>
        <div className="modal-scrollable-content">
          <img src={clubDetail.photo} alt={clubDetail.name} className="modal-photo" />
          <h3>Meta Information</h3>
          <p><strong>ID:</strong> {clubDetail.id}</p>
          <p><strong>Academic Year:</strong> {clubDetail.academicYear}</p>
          <p><strong>Category:</strong> {clubDetail.category}</p>
          <p><strong>Grades:</strong> G{clubDetail.grades.min} - G{clubDetail.grades.max}</p>
          <p><strong>Schedule:</strong> {clubDetail.schedule}</p>

          <h3>Meeting Information</h3>
          <p><strong>Day:</strong> {clubDetail.meeting.day}</p>
          <p><strong>Time:</strong> {clubDetail.meeting.startTime} - {clubDetail.meeting.endTime}</p>
          <p><strong>Location:</strong> {clubDetail.meeting.location.room} ({clubDetail.meeting.location.block}, {clubDetail.meeting.location.site})</p>
          <p><strong>Duration:</strong> {clubDetail.duration.startDate} to {clubDetail.duration.endDate} ({clubDetail.duration.isRecurringWeekly ? "Recurring Weekly" : "Fixed Duration"})</p>

          <h3>Description</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{clubDetail.description}</p>

          <p><strong>Semester Cost:</strong> {displayOptionalString(clubDetail.semesterCost)}</p>

          {/* Display Poor Weather Plan - display the section only if there's content */}
          {clubDetail.poorWeatherPlan && clubDetail.poorWeatherPlan.trim() !== '' ? (
            <>
              <h3>Poor Weather Plan</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{clubDetail.poorWeatherPlan}</p>
            </>
          ) : (
            <p><strong>Poor Weather Plan:</strong> N/A</p>
          )}


          {clubDetail.requirements && clubDetail.requirements.length > 0 && (
            <>
              <h3>Requirements</h3>
              <ul>
                {clubDetail.requirements.map((req, index) => <li key={`req-${index}`}>{req}</li>)}
              </ul>
            </>
          )}

          {clubDetail.materials && clubDetail.materials.length > 0 && (
            <>
              <h3>Materials Needed</h3>
              <ul>
                {clubDetail.materials.map((mat, index) => <li key={`mat-${index}`}>{mat}</li>)}
              </ul>
            </>
          )}

          <p><strong>Student Led:</strong> {clubDetail.isStudentLed ? 'Yes' : 'No'}</p>
          {clubDetail.studentLeaders && clubDetail.studentLeaders.length > 0 && (
            <p><strong>Student Leaders:</strong> {clubDetail.studentLeaders.join(', ')}</p>
          )}
          <p><strong>Staff:</strong> {clubDetail.staff.join(', ')}</p>

          <p><small>Cache Status: {clubDetail.cache} (Last Checked: {new Date(clubDetail.lastCheck).toLocaleString()})</small></p>
        </div>
      </div>
    </div>
  );
};

export default ClubDetailModal;