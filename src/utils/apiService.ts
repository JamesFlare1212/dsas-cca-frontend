import type {
  ApiClubListResponse,
  ClubDetail,
  CategoryCount,
  AcademicYearCount,
  ApiStaffListResponse,
  ClubBasic,
  StaffMember
} from '@types';

const BASE_URL = 'https://dsas-cca.jamesflare.com/v1';

async function fetchWithErrorHandling<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      throw new Error(
        `API Error: ${response.status} ${response.statusText}. ${errorData?.error || ''}`
      );
    }
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Failed to fetch from ${url}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}

export async function listAllClubs(): Promise<ClubBasic[]> {
  const data = await fetchWithErrorHandling<ApiClubListResponse>(`${BASE_URL}/activity/list`);
  return Object.entries(data).map(([id, club]) => ({ id, ...club }));
}

export async function filterClubs(params: {
  category?: string;
  academicYear?: string;
  grade?: number;
}): Promise<ClubBasic[]> {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.academicYear) queryParams.append('academicYear', params.academicYear);
  if (params.grade !== undefined) queryParams.append('grade', String(params.grade));

  const url = `${BASE_URL}/activity/list?${queryParams.toString()}`;
  const data = await fetchWithErrorHandling<ApiClubListResponse>(url);
  return Object.entries(data).map(([id, club]) => ({ id, ...club }));
}

export async function getClubDetails(activityId: string): Promise<ClubDetail> {
  return fetchWithErrorHandling<ClubDetail>(`${BASE_URL}/activity/${activityId}`);
}

export async function getAvailableCategories(): Promise<CategoryCount> {
  return fetchWithErrorHandling<CategoryCount>(`${BASE_URL}/activity/category`);
}

export async function getAvailableAcademicYears(): Promise<AcademicYearCount> {
  return fetchWithErrorHandling<AcademicYearCount>(`${BASE_URL}/activity/academicYear`);
}

export async function getAllStaff(): Promise<StaffMember[]> {
  const data = await fetchWithErrorHandling<ApiStaffListResponse>(`${BASE_URL}/staffs`);
  return Object.entries(data).map(([id, name]) => ({ id, name }));
}