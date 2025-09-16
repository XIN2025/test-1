import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import HealthSection from './HealthSection';

interface HealthMetric {
  type: string;
  value: string | number;
  unit?: string;
  label: string;
  isAvailable?: boolean;
}

interface HealthDashboardContentProps {
  isDarkMode?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  sections: {
    title: string;
    metrics: HealthMetric[];
    columns?: 1 | 2;
  }[];
}

export default function HealthDashboardContent({
  isDarkMode = false,
  refreshing = false,
  onRefresh,
  sections,
}: HealthDashboardContentProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
    >
      {sections.map((section, index) => (
        <HealthSection
          key={`${section.title}-${index}`}
          title={section.title}
          metrics={section.metrics}
          isDarkMode={isDarkMode}
          columns={section.columns || 1}
        />
      ))}
    </ScrollView>
  );
}
