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

  // Helper to format semester cost
  const formatSemesterCost = (cost: number | null): string => {
    if (cost === null) {
      return 'N/A';
    }
    if (cost === 0) {
      return 'Free';
    }
    // Assuming the cost is a simple number, you might want to add currency formatting
    // e.g., using Intl.NumberFormat if it's a monetary value with a specific currency.
    // For now, just displaying the number.
    return String(cost); // Or `cost.toFixed(2)` if it's meant to be currency-like
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close modal">&times;</button>
        <h2>{clubDetail.name}</h2>
        <div className="modal-scrollable-content">
          <img src={clubDetail.photo} alt={clubDetail.name} className="modal-photo" />
          <p><strong>ID:</strong> {clubDetail.id}</p>
          <p><strong>Academic Year:</strong> {clubDetail.academicYear}</p>
          <p><strong>Category:</strong> {clubDetail.category}</p>
          <p><strong>Grades:</strong> G{clubDetail.grades.min} - G{clubDetail.grades.max}</p>
          <p><strong>Schedule:</strong> {clubDetail.schedule}</p>

          <h4>Meeting Information</h4>
          <p><strong>Day:</strong> {clubDetail.meeting.day}</p>
          <p><strong>Time:</strong> {clubDetail.meeting.startTime} - {clubDetail.meeting.endTime}</p>
          <p><strong>Location:</strong> {clubDetail.meeting.location.room} ({clubDetail.meeting.location.block}, {clubDetail.meeting.location.site})</p>
          <p><strong>Duration:</strong> {clubDetail.duration.startDate} to {clubDetail.duration.endDate} ({clubDetail.duration.isRecurringWeekly ? "Recurring Weekly" : "Fixed Duration"})</p>

          <h4>Description</h4>
          <p style={{ whiteSpace: 'pre-wrap' }}>{clubDetail.description}</p>

          {/* Display Semester Cost if it's not null */}
          {/* The API defines semesterCost as 'null' or a number */}
          <p><strong>Semester Cost:</strong> {formatSemesterCost(clubDetail.semesterCost)}</p>

          {/* Display Poor Weather Plan if it's not an empty string */}
          {clubDetail.poorWeatherPlan && clubDetail.poorWeatherPlan.trim() !== '' && (
            <>
              <h4>Poor Weather Plan</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{clubDetail.poorWeatherPlan}</p>
            </>
          )}

          {clubDetail.requirements && clubDetail.requirements.length > 0 && (
            <>
              <h4>Requirements</h4>
              <ul>
                {clubDetail.requirements.map((req, index) => <li key={`req-${index}`}>{req}</li>)}
              </ul>
            </>
          )}

          {clubDetail.materials && clubDetail.materials.length > 0 && (
            <>
              <h4>Materials Needed</h4>
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