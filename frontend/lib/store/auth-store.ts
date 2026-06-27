"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/lib/types";
import { mockUsers } from "@/lib/mock-data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, _password: string) => {
        const found = mockUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        if (found) {
          set({ user: found, isAuthenticated: true });
          return true;
        }
        return false;
      },

      register: async (name: string, email: string, _password: string, role: UserRole) => {
        const newUser: User = {
          id: `u${Date.now()}`,
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
        };
        set({ user: newUser, isAuthenticated: true });
        return true;
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "roadvision-auth" }
  )
);
