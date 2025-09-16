import Constants from 'expo-constants';
import { DocumentPickerAsset } from 'expo-document-picker';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:8000';

export type LabReportSummary = {
  id: string;
  test_title?: string;
  test_description: string;
  test_date: string; // ISO string
  properties_count: number;
  filename: string;
  created_at: string; // ISO string
};

export type LabReportDetailProperty = {
  property_name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  status: 'normal' | 'high' | 'low' | 'critical' | string;
  property_description?: string;
};

export type LabReportDetail = {
  id: string;
  user_email: string;
  test_title?: string;
  test_description: string;
  properties: LabReportDetailProperty[];
  test_date: string; // ISO string
  lab_name?: string;
  doctor_name?: string;
  filename: string;
  created_at: string; // ISO string
};

type UploadResponse = {
  success: boolean;
  lab_report_id: string;
  message: string;
  test_description: string;
  properties_count: number;
};

class LabReportsApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.detail || errorData.error || (await response.text());
      throw new Error(detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAll(userEmail: string): Promise<LabReportSummary[]> {
    return this.makeRequest(`/lab-reports/?user_email=${encodeURIComponent(userEmail)}`);
  }

  async getById(reportId: string, userEmail: string): Promise<LabReportDetail> {
    return this.makeRequest(`/lab-reports/${encodeURIComponent(reportId)}?user_email=${encodeURIComponent(userEmail)}`);
  }

  async uploadPdf(file: DocumentPickerAsset, userEmail: string): Promise<UploadResponse> {
    const formData = new FormData();
    // RN web polyfill: ensure filename and type are set when possible
    formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);

    const url = `${API_BASE_URL}/lab-reports/upload?user_email=${encodeURIComponent(userEmail)}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    console.log('got response again');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.detail || errorData.error || (await response.text());
      throw new Error(detail || `HTTP error! status: ${response.status}`);
    }
    console.log('got response again again');
    const data = await response.json();
    console.log('got data');
    console.log(data);
    console.log('url', url);

    return data;
  }
}

export const labReportsApi = new LabReportsApiService();
