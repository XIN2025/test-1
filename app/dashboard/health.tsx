import React from 'react';
import { Platform } from 'react-native';
import HealthDashboardIOS from './health.ios';
import HealthDashboardAndroid from './health.android';

export default function HealthDashboard() {
  if (Platform.OS === 'ios') {
    return <HealthDashboardIOS />;
  } else if (Platform.OS === 'android') {
    return <HealthDashboardAndroid />;
  } else {
    return null;
  }
}
