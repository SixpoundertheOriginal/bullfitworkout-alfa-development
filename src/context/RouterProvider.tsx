
import { useAuth } from "@/context/AuthContext";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { WorkoutNavigationContextProvider } from "@/context/WorkoutNavigationContext";
import { MainLayout } from "@/components/layouts/MainLayout";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import TrainingSessionPage from "@/pages/TrainingSession";
import WorkoutComplete from "@/pages/WorkoutComplete";
import WorkoutDetailsPage from "@/pages/WorkoutDetailsPage";
import WorkoutSummaryPage from "@/pages/WorkoutSummaryPage";
import ProfilePage from "@/pages/ProfilePage";
import Auth from "@/pages/Auth";
import AllExercisesPage from "@/pages/AllExercisesPage";
import Overview from "@/pages/Overview";
import Analytics from "@/pages/Analytics";
import { FEATURE_FLAGS } from "@/config/flags";
import { WorkoutManagementPage } from "@/pages/WorkoutManagementPage";
import EnhancedTrainingCoachPage from "@/pages/EnhancedTrainingCoachPage";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
};

export const RouterProvider = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";

  return (
    <WorkoutNavigationContextProvider>
      <div className="bg-gray-900 min-h-screen">
        {isAuthPage ? (
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout>
                  <Index />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/overview" element={
              <ProtectedRoute>
                <MainLayout>
                  <Overview />
                </MainLayout>
              </ProtectedRoute>
            } />
            {FEATURE_FLAGS.KPI_ANALYTICS_ENABLED && (
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Analytics />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            )}
            <Route path="/workouts" element={
              <ProtectedRoute>
                <MainLayout>
                  <WorkoutManagementPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/training-session" element={
              <ProtectedRoute>
                <MainLayout>
                  <TrainingSessionPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/workout-complete" element={
              <ProtectedRoute>
                <MainLayout>
                  <WorkoutComplete />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/workout-summary" element={
              <ProtectedRoute>
                <MainLayout>
                  <WorkoutSummaryPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/workout-details" element={
              <ProtectedRoute>
                <MainLayout>
                  <WorkoutDetailsPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/workout-details/:workoutId" element={
              <ProtectedRoute>
                <MainLayout>
                  <WorkoutDetailsPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/workout/:workoutId" element={
              <ProtectedRoute>
                <MainLayout>
                  <WorkoutDetailsPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/all-exercises" element={
              <ProtectedRoute>
                <MainLayout>
                  <AllExercisesPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/ai-coach" element={
              <ProtectedRoute>
                <MainLayout>
                  <EnhancedTrainingCoachPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </div>
    </WorkoutNavigationContextProvider>
  );
};
