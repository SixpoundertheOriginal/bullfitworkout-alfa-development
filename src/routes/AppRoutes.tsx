import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

export const AppRoutes: React.FC = () => (
  <ConfigProvider>
    <Routes>
      <Route path="/analytics" element={<AnalyticsPage />} />
    </Routes>
  </ConfigProvider>
);

export default AppRoutes;
