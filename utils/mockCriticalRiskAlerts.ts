import { CriticalRiskAlert } from '../types/criticalRiskAlerts';

export const mockCriticalRiskAlerts: CriticalRiskAlert[] = [
  {
    id: 'ObjectId("68cfd32667ebc78461f467c2")',
    health_data_id: '68cfc61da12ab88cc2f00431',
    metric: 'HeartRate',
    title: 'High Resting Heart Rate',
    key_point: '85 bpm (+20% above baseline)',
    message: 'Your resting heart rate today is higher than usual. Consider taking it easy and monitoring.',
    status: 'active',
    severity: 'Critical',
    created_at: '2025-09-21T10:27:50.290+00:00',
    date: 'June 20, 2022',
    type: 'RHR Spike',
    value: '75 bpm (+38% above baseline)',
    description: 'Immediate rest or easy training recommended',
    recommendation: 'Take immediate rest and monitor heart rate closely',
    user_email: 'demo@example.com',
  },
  {
    id: 'ObjectId("68cfd32667ebc78461f467c3")',
    health_data_id: '68cfc61da12ab88cc2f00432',
    metric: 'HeartRate',
    title: 'RHR Elevation',
    key_point: '72 bpm maximum',
    message: 'Monitor for 2-3 days, reduce intensity if persists',
    status: 'active',
    severity: 'Warning',
    created_at: '2025-04-25T08:15:30.000+00:00',
    date: 'April 25, 2022',
    type: 'RHR Elevation',
    value: '72 bpm maximum',
    description: 'Monitor for 2-3 days, reduce intensity if persists',
    recommendation: 'Reduce training intensity and monitor progression',
    user_email: 'demo@example.com',
  },
  {
    id: 'ObjectId("68cfd32667ebc78461f467c4")',
    health_data_id: '68cfc61da12ab88cc2f00433',
    metric: 'HeartRateVariability',
    title: 'RHR & HRV Decline',
    key_point: '60 bpm avg, HRV declining trend',
    message: 'Consider recovery week or reduced training load',
    status: 'active',
    severity: 'Warning',
    created_at: '2021-08-09T06:45:15.000+00:00',
    date: 'August 9, 2021',
    type: 'RHR & HRV Decline',
    value: '60 bpm avg, HRV declining trend',
    description: 'Consider recovery week or reduced training load',
    recommendation: 'Take a recovery week to allow body to adapt',
    user_email: 'demo@example.com',
  },
];

// Function to get mock alerts (simulating API call)
export const getMockCriticalRiskAlerts = async (): Promise<CriticalRiskAlert[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockCriticalRiskAlerts;
};
