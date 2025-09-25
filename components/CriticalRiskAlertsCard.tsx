import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TriangleAlert, AlertTriangle } from 'lucide-react-native';
import { CriticalRiskAlert } from '../types/criticalRiskAlerts';

interface CriticalRiskAlertsCardProps {
  isDarkMode: boolean;
  alerts: CriticalRiskAlert[];
  width?: number;
  onAlertPress?: (alert: CriticalRiskAlert) => void;
}

export default function CriticalRiskAlertsCard({
  isDarkMode,
  alerts,
  width,
  onAlertPress,
}: CriticalRiskAlertsCardProps) {
  const cardBackgroundColor = isDarkMode ? '#374151' : '#ffffff';
  const textColor = isDarkMode ? '#f3f4f6' : '#1f2937';
  const subtitleColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const borderColor = isDarkMode ? '#4b5563' : '#f3f4f6';

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
      case 'high':
        return '#ef4444'; // red-500
      case 'Warning':
      case 'medium':
        return '#f59e0b'; // amber-500
      case 'low':
        return '#10b981'; // green-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getSeverityBackgroundColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
      case 'high':
        return isDarkMode ? '#7f1d1d' : '#fef2f2'; // red-900 : red-50
      case 'Warning':
      case 'medium':
        return isDarkMode ? '#78350f' : '#fffbeb'; // amber-900 : amber-50
      case 'low':
        return isDarkMode ? '#064e3b' : '#f0fdf4'; // green-900 : green-50
      default:
        return isDarkMode ? '#374151' : '#f9fafb'; // gray-700 : gray-50
    }
  };

  const getAlertIcon = (type: string | undefined, severity: string) => {
    const color = getSeverityColor(severity);
    const size = 16;

    switch (type) {
      case 'RHR Spike':
        return <TriangleAlert size={size} color={color} />;
      case 'RHR Elevation':
        return <AlertTriangle size={size} color={color} />;
      case 'RHR & HRV Decline':
        return <TriangleAlert size={size} color={color} />;
      default:
        return <AlertTriangle size={size} color={color} />;
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        width: width || '100%',
        backgroundColor: cardBackgroundColor,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 2,
        borderColor: borderColor,
      }}
    >
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDarkMode ? '#ef4444' : '#fef2f2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TriangleAlert size={20} color={isDarkMode ? '#ffffff' : '#ef4444'} />
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: textColor,
            }}
          >
            Critical Risk Alerts from Your Data
          </Text>
        </View>
      </View>

      {/* Alerts List */}
      <View>
        {alerts.map((alert, index) => (
          <TouchableOpacity
            key={alert.id}
            onPress={() => onAlertPress?.(alert)}
            style={{
              backgroundColor: getSeverityBackgroundColor(alert.severity),
              borderRadius: 12,
              padding: 16,
              marginBottom: index < alerts.length - 1 ? 12 : 0,
              borderLeftWidth: 4,
              borderLeftColor: getSeverityColor(alert.severity),
            }}
            activeOpacity={0.7}
          >
            {/* Alert Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: subtitleColor,
                    marginBottom: 4,
                  }}
                >
                  {alert.date ||
                    new Date(alert.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {getAlertIcon(alert.type, alert.severity)}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: subtitleColor,
                    }}
                  >
                    {alert.type || alert.title}
                  </Text>
                </View>
              </View>

              {/* Severity Badge */}
              <View
                style={{
                  backgroundColor: getSeverityColor(alert.severity),
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}
                >
                  {alert.severity}
                </Text>
              </View>
            </View>

            {/* Alert Value */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: getSeverityColor(alert.severity),
                marginBottom: 8,
              }}
            >
              {alert.value || alert.key_point}
            </Text>

            {/* Alert Description */}
            <Text
              style={{
                fontSize: 14,
                color: textColor,
                lineHeight: 20,
              }}
            >
              {alert.description || alert.message}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
