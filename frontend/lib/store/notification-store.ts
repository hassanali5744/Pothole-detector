import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import { mapNotifications } from "@/lib/mappers";

interface NotificationStoreState {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  unreadCount: 0,
  refreshUnreadCount: async () => {
    try {
      const data = await apiClient.get("/api/notifications");
      const notifs = mapNotifications(data as Record<string, unknown>[]);
      set({ unreadCount: notifs.filter((n) => !n.read).length });
    } catch (error) {
      console.error("Failed to refresh notification count:", error);
      set({ unreadCount: 0 });
    }
  },
  setUnreadCount: (count: number) => set({ unreadCount: count }),
  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}));
