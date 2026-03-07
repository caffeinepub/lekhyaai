import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Notification {
  id: string;
  fromRole: "superuser" | "admin" | "user";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  toAll: boolean;
  toPrincipal?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    n: Omit<Notification, "id" | "isRead" | "createdAt">,
  ) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const LS_KEY = "lekhya_notifications";

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-seed-1",
    fromRole: "superuser",
    title: "Welcome to LekhyaAI v2!",
    message:
      "Phase A is live: CRM, Activity Log, Notification Bell, and real-time clock are now available. Check the sidebar under Developer Mode.",
    isRead: false,
    createdAt: Date.now() - 1000 * 60 * 30,
    toAll: true,
  },
  {
    id: "notif-seed-2",
    fromRole: "superuser",
    title: "GST Filing Deadline Reminder",
    message:
      "GSTR-3B for March 2026 is due on 20 April 2026. Please ensure all invoices are filed before the deadline.",
    isRead: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    toAll: true,
  },
];

function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Notification[];
  } catch {
    // ignore
  }
  // First load: seed notifications
  localStorage.setItem(LS_KEY, JSON.stringify(SEED_NOTIFICATIONS));
  return SEED_NOTIFICATIONS;
}

function saveNotifications(ns: Notification[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ns));
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
});

export function NotificationProvider({
  children,
}: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadNotifications(),
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const addNotification = useCallback(
    (n: Omit<Notification, "id" | "isRead" | "createdAt">) => {
      const newNotif: Notification = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        isRead: false,
        createdAt: Date.now(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    [],
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
