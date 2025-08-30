import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Analytics from '@/pages/Analytics';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/analytics" element={<Analytics />} />
  </Routes>
);

export default AppRoutes;
