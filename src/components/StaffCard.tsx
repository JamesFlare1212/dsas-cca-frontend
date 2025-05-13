import React from 'react';
import type { StaffMember } from '@types';

interface StaffCardProps {
  staff: StaffMember;
}

const StaffCard: React.FC<StaffCardProps> = ({ staff }) => {
  return (
    <div className="card staff-card"> {/* Re-use card for base styling, add specific class */}
      <h3>{staff.name}</h3>
      <p><strong>ID:</strong> {staff.id}</p>
    </div>
  );
};

export default StaffCard;