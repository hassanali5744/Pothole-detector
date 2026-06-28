"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/lib/types";
import { API_BASE_URL } from "@/lib/constants";
import { mapUser } from "@/lib/mappers";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            return false;
          }

          const data = await response.json();
          set({
            user: mapUser(data.user),
            token: data.access_token,
            isAuthenticated: true,
          });
          return true;
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      },

      register: async (name: string, email: string, password: string, role: UserRole) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
          });

          if (!response.ok) {
            return false;
          }

          const data = await response.json();
          set({
            user: mapUser(data.user),
            token: data.access_token,
            isAuthenticated: true,
          });
          return true;
        } catch (error) {
          console.error("Registration error:", error);
          return false;
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "roadvision-auth" }
  )
);
