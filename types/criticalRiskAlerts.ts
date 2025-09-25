export interface CriticalRiskAlert {
  id: string;
  health_data_id: string;
  metric: string;
  title: string;
  key_point: string;
  message: string;
  status: 'active' | 'resolved';
  severity: 'high' | 'medium' | 'low' | 'Critical' | 'Warning';
  user_email: string;
  created_at: string;
  date?: string;
  type?: string;
  value?: string;
  description?: string;
  recommendation?: string;
}

export interface CriticalRiskAlertsResponse {
  alerts: CriticalRiskAlert[];
  total_count: number;
}
