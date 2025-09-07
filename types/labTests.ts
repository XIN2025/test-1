export interface LabTestItem {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  normalRange?: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  details: string;
  lastUpdated?: string;
}

export interface LabTest {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'pending' | 'in_progress';
  items: LabTestItem[];
  summary?: string;
}

export interface LabTestsData {
  tests: LabTest[];
  isConnected: boolean;
  lastSync?: string;
}
