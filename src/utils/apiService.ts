// src/utils/apiService.ts
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

// Helper function for delaying
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithErrorHandling<T>(url: string, isRetryable: boolean = false, attempt: number = 1): Promise<T> {
  const MAX_RETRY_ATTEMPTS_FOR_NON_PERSISTENT = 3;
  const RETRY_DELAY_MS = 1000;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // For 4xx errors, typically don't retry indefinitely as it's a client/request issue
      if (response.status >= 400 && response.status < 500 && isRetryable) {
         console.warn(`API Client Error for ${url}: ${response.status}. Not retrying.`);
         const errorData = await response.json().catch(() => ({ error: "Failed to parse client error response" }));
         throw new Error(`API Client Error: ${response.status} ${response.statusText}. ${errorData?.error || ''}`);
      }
      // For 5xx server errors or network issues, retry is more appropriate
      const errorData = await response.json().catch(() => ({ error: "Failed to parse server error response" }));
      throw new Error(
        `API Error: ${response.status} ${response.statusText}. ${errorData?.error || ''}`
      );
    }
    return response.json() as Promise<T>;
  } catch (error: any) {
    if (isRetryable) {
      console.warn(`Attempt ${attempt} failed for ${url}: ${error.message}. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await delay(RETRY_DELAY_MS);
      return fetchWithErrorHandling<T>(url, isRetryable, attempt + 1); // Persistent retry
    } else if (attempt < MAX_RETRY_ATTEMPTS_FOR_NON_PERSISTENT) {
      // Non-persistent retry for general errors (e.g., initial list fetches)
      console.warn(`Attempt ${attempt} failed for ${url}: ${error.message}. Retrying (non-persistent)...`);
      await delay(RETRY_DELAY_MS * attempt); // Simple increasing backoff
      return fetchWithErrorHandling<T>(url, isRetryable, attempt + 1);
    }
    console.error(`Failed to fetch from ${url} after multiple attempts:`, error);
    throw error; // Re-throw to be handled by the caller after max retries or if not retryable
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
  isStudentLed?: boolean | undefined;
}): Promise<ClubBasic[]> {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.academicYear) queryParams.append('academicYear', params.academicYear);
  if (params.grade !== undefined) queryParams.append('grade', String(params.grade));
  if (params.isStudentLed !== undefined) queryParams.append('isStudentLed', String(params.isStudentLed));

  const url = `${BASE_URL}/activity/list?${queryParams.toString()}`;
  const data = await fetchWithErrorHandling<ApiClubListResponse>(url);
  return Object.entries(data).map(([id, club]) => ({ id, ...club }));
}

// Make getClubDetails retryable persistently
export async function getClubDetails(activityId: string): Promise<ClubDetail> {
  // Pass `true` for isRetryable to enable persistent retries for this specific endpoint
  return fetchWithErrorHandling<ClubDetail>(`${BASE_URL}/activity/${activityId}`, true);
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