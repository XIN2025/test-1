import Constants from 'expo-constants';
import { CriticalRiskAlert } from '../types/criticalRiskAlerts';

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface HealthAlertsResponse {
  alerts: CriticalRiskAlert[];
}

class HealthAlertsApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        ...options,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch health alerts');
      }

      return data.data as T;
    } catch (error) {
      console.error('Health alerts API error:', error);
      throw error;
    }
  }

  async getActiveAlerts(userEmail: string): Promise<CriticalRiskAlert[]> {
    try {
      const response = await this.makeRequest<HealthAlertsResponse>(
        `/api/health-alert/${encodeURIComponent(userEmail)}/active`,
      );
      return response.alerts || [];
    } catch (error) {
      console.error('Failed to fetch active health alerts:', error);
      return [];
    }
  }

  async resolveHealthAlert(healthAlertId: string): Promise<boolean> {
    try {
      await this.makeRequest<null>(`/api/health-alert/${encodeURIComponent(healthAlertId)}/resolve`, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      console.error('Failed to resolve health alert:', error);
      return false;
    }
  }
}

export const healthAlertsApi = new HealthAlertsApiService();
