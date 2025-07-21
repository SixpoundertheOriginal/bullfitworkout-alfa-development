import { useCorruptionMonitor } from '@/hooks/useCorruptionMonitor';

interface WorkoutSessionLayoutProps {
  children: React.ReactNode;
}

export const WorkoutSessionLayout: React.FC<WorkoutSessionLayoutProps> = ({ children }) => {
  useCorruptionMonitor();
  
  return <>{children}</>;
};