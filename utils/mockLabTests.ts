import { LabTestsData } from '../types/labTests';

export const mockLabTestsData: LabTestsData = {
  isConnected: true,
  lastSync: '2025-08-15T10:30:00Z',
  tests: [
    {
      id: 'test-1',
      name: 'Test 1',
      date: '2025-08-15',
      status: 'completed',
      summary: 'Comprehensive metabolic panel and blood work',
      items: [
        {
          id: 'glucose-1',
          name: 'Glucose',
          value: 2,
          unit: 'mmol/L',
          normalRange: '3.9-6.1 mmol/L',
          status: 'low',
          details:
            'Blood glucose level indicates how much sugar is in your blood. Low levels may indicate hypoglycemia, which can cause symptoms like dizziness, confusion, and fatigue. Consider eating regular meals and monitoring blood sugar levels.',
          lastUpdated: '2025-08-15T08:00:00Z',
        },
        {
          id: 'cbc-1',
          name: 'CBC',
          value: 2,
          unit: 'x10^9/L',
          normalRange: '4.0-11.0 x10^9/L',
          status: 'low',
          details:
            'Complete Blood Count (CBC) measures the number of blood cells in your body. Low white blood cell count may indicate a weakened immune system or bone marrow problems. Consult your healthcare provider for further evaluation.',
          lastUpdated: '2025-08-15T08:00:00Z',
        },
        {
          id: 'vitamin-d-1',
          name: 'Vitamin D',
          value: 2,
          unit: 'ng/mL',
          normalRange: '30-100 ng/mL',
          status: 'low',
          details:
            'Vitamin D is essential for bone health and immune function. Low levels can lead to bone weakness, muscle pain, and increased risk of infections. Consider vitamin D supplementation and increased sun exposure.',
          lastUpdated: '2025-08-15T08:00:00Z',
        },
      ],
    },
    {
      id: 'test-2',
      name: 'Test 2',
      date: '2025-08-10',
      status: 'completed',
      summary: 'Lipid panel and cardiovascular markers',
      items: [
        {
          id: 'cholesterol-2',
          name: 'Total Cholesterol',
          value: 180,
          unit: 'mg/dL',
          normalRange: '<200 mg/dL',
          status: 'normal',
          details:
            'Total cholesterol measures all cholesterol in your blood. Your level is within the desirable range, which helps reduce risk of heart disease. Continue maintaining a healthy diet and regular exercise.',
          lastUpdated: '2025-08-10T09:15:00Z',
        },
        {
          id: 'hdl-2',
          name: 'HDL Cholesterol',
          value: 55,
          unit: 'mg/dL',
          normalRange: '>40 mg/dL (men), >50 mg/dL (women)',
          status: 'normal',
          details:
            'HDL (good) cholesterol helps remove other forms of cholesterol from your bloodstream. Higher levels are better for heart health. Your level indicates good cardiovascular protection.',
          lastUpdated: '2025-08-10T09:15:00Z',
        },
      ],
    },
    {
      id: 'test-3',
      name: 'Test 3',
      date: '2025-08-05',
      status: 'completed',
      summary: 'Thyroid function and hormone levels',
      items: [
        {
          id: 'tsh-3',
          name: 'TSH',
          value: 2.5,
          unit: 'mIU/L',
          normalRange: '0.4-4.0 mIU/L',
          status: 'normal',
          details:
            'Thyroid Stimulating Hormone (TSH) regulates your thyroid gland function. Your level is within normal range, indicating proper thyroid function and metabolism regulation.',
          lastUpdated: '2025-08-05T07:30:00Z',
        },
        {
          id: 'cortisol-3',
          name: 'Cortisol',
          value: 15,
          unit: 'μg/dL',
          normalRange: '6-23 μg/dL',
          status: 'normal',
          details:
            "Cortisol is your body's main stress hormone. Normal levels indicate healthy stress response and adrenal function. Continue managing stress through relaxation techniques and adequate sleep.",
          lastUpdated: '2025-08-05T07:30:00Z',
        },
      ],
    },
  ],
};

// Mock data for empty state (no connection)
export const mockEmptyLabTestsData: LabTestsData = {
  isConnected: false,
  tests: [],
};
