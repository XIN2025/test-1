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

    // Handle web vs native differently
    if (file.uri.startsWith('blob:') || file.uri.startsWith('data:')) {
      // Web: fetch the blob from the URI
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append('file', blob, file.name || 'lab-report.pdf');
    } else {
      // Native: use the URI directly
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'lab-report.pdf',
        type: file.mimeType || 'application/pdf',
      } as any);
    }

    const url = `${API_BASE_URL}/lab-reports/upload?user_email=${encodeURIComponent(userEmail)}`;
    console.log('Uploading to:', url);
    console.log('File info:', { name: file.name, type: file.mimeType, uri: file.uri.substring(0, 50) });

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Upload error response:', errorData);
      const detail = errorData.detail || errorData.error || (await response.text());
      throw new Error(detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Upload success:', data);

    return data;
  }
}

export const labReportsApi = new LabReportsApiService();
