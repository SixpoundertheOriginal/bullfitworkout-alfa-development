import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import { ConfigProvider } from '@/config/runtimeConfig';

export const AppRoutes: React.FC = () => (
  <ConfigProvider>
    <Routes>
      <Route path="/analytics" element={<AnalyticsPage />} />
    </Routes>
  </ConfigProvider>
);

export default AppRoutes;
