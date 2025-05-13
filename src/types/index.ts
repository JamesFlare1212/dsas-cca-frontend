export interface ClubBasic {
  id: string; // API gives numbers as keys, but we'll use them as strings
  name: string;
  photo: string;
}

export interface ClubMeeting {
  day: string;
  endTime: string;
  location: {
    block: string;
    room: string;
    site: string;
  };
  startTime: string;
}

export interface ClubDuration {
  endDate: string;
  isRecurringWeekly: boolean;
  startDate: string;
}

export interface ClubGrades {
  max: string; // API gives strings
  min: string; // API gives strings
}

export interface ClubDetail {
  academicYear: string;
  category: string;
  description: string;
  duration: ClubDuration;
  grades: ClubGrades;
  id: string;
  isPreSignup: boolean;
  isStudentLed: boolean;
  materials: string[];
  meeting: ClubMeeting;
  name: string;
  photo: string;
  poorWeatherPlan: string;
  requirements: string[];
  schedule: string;
  semesterCost: number | null;
  staff: string[];
  staffForReports: string[];
  studentLeaders: string[];
  lastCheck: string;
  cache: "HIT" | "MISS" | "ERROR";
}

export interface CategoryCount {
  [categoryName: string]: number;
}

export interface AcademicYearCount {
  [academicYear: string]: number;
}

export interface StaffMember {
  id: string;
  name: string;
}

// For the API response format of /v1/activity/list
export interface ApiClubListResponse {
  [id: string]: {
    name: string;
    photo: string;
  };
}

// For the API response format of /v1/staffs
export interface ApiStaffListResponse {
  [id: string]: string;
}