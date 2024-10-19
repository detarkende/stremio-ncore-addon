import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JWTState {
  jwt: string | null;
  setJwt: (jwt: string) => void;
  logout: () => void;
}

export const useJwtStore = create<JWTState>()(
  persist(
    (set) => ({
      jwt: null,
      setJwt: (jwt) => set({ jwt }),
      logout: () => set({ jwt: null }),
    }),
    {
      name: 'jwt-storage',
    },
  ),
);
