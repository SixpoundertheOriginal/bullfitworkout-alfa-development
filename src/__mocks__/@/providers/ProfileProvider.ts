import { vi } from 'vitest';

export const useProfile = vi.fn(() => ({
  userId: 'test-user',
  bodyweightKg: 70,
  preferredUnit: 'kg',
}));

export const useBodyweightKg = vi.fn(() => 70);

export const ProfileProvider = ({ children }: { children: any }) => children;

export default {
  useProfile,
  useBodyweightKg,
  ProfileProvider,
};
