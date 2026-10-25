export interface ClubBasic {
  id: string;
  name: string;
  photo: string;
}

export interface Meeting {
  day: string;
  startTime: string;
  endTime: string;
  location: { block: string; room: string; site: string };
  staff?: string[];
}

export interface ClubDetail extends ClubBasic {
  academicYear: string;
  category: string;
  description: string;
  descriptionZh?: string;
  duration: { startDate: string; endDate: string; isRecurringWeekly: boolean };
  grades: { min: string | null; max: string | null };
  isPreSignup: boolean;
  isStudentLed: boolean;
  materials: string[];
  meeting: Meeting;
  meetings?: Meeting[];
  poorWeatherPlan: string | null;
  requirements: string[];
  schedule: string;
  semesterCost: string | null;
  staff: string[];
  staffForReports: string[];
  studentLeaders: string[];
  lastCheck: string;
  cache: string;
}

export interface StaffMember {
  id: string;
  name: string;
}

export interface Filters {
  category: string;
  academicYear: string;
  grade: string;
  leader: string;
}

export type Counts = Record<string, number>;
export type ViewMode = 'grid' | 'list';
export type SortOrder = 'newest' | 'name-asc' | 'name-desc';
