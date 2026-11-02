// ========== Enhanced Notification Service ==========
// Supports browser notifications + service worker push notifications

const NOTIFICATION_PREFS_KEY = "study_planner_notification_prefs";

export interface NotificationPrefs {
  enabled: boolean;
  taskReminders: boolean;
  examCountdown: boolean;
  pomodoroAlerts: boolean;
  streakReminders: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  taskReminders: true,
  examCountdown: true,
  pomodoroAlerts: true,
  streakReminders: true,
};

// Get notification preferences
export const getNotificationPrefs = (): NotificationPrefs => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFS;
};

// Save notification preferences
export const setNotificationPrefs = (prefs: Partial<NotificationPrefs>) => {
  const current = getNotificationPrefs();
  const updated = { ...current, ...prefs };
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
  return updated;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

// Send a notification
export const sendNotification = (
  title: string,
  options?: NotificationOptions
) => {
  const prefs = getNotificationPrefs();
  if (!prefs.enabled) return;

  if (Notification.permission === "granted") {
    // Try service worker notification first (works in background)
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: "/icons/icon-192x192.svg",
          badge: "/favicon.svg",
          vibrate: [200, 100, 200],
          ...options,
        });
      });
    } else {
      // Fallback to basic notification
      new Notification(title, {
        icon: "/icons/icon-192x192.svg",
        badge: "/favicon.svg",
        ...options,
      });
    }
  }
};

// Schedule a task reminder
export const scheduleTaskReminder = (
  taskTitle: string,
  reminderTime: string
) => {
  const prefs = getNotificationPrefs();
  if (!prefs.taskReminders) return;

  const now = new Date();
  const [hours, minutes] = reminderTime.split(":").map(Number);
  const reminderDate = new Date();
  reminderDate.setHours(hours, minutes, 0, 0);

  if (reminderDate <= now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  const timeUntilReminder = reminderDate.getTime() - now.getTime();

  if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      sendNotification("📚 Task Reminder", {
        body: taskTitle,
        tag: "task-reminder",
      });
    }, timeUntilReminder);
  }
};

// Schedule an exam countdown notification
export const scheduleExamReminder = (
  examName: string,
  examDate: string,
  daysBeforeArr: number[] = [7, 3, 1, 0]
) => {
  const prefs = getNotificationPrefs();
  if (!prefs.examCountdown) return;

  const exam = new Date(examDate);
  const now = new Date();

  daysBeforeArr.forEach((daysBefore) => {
    const reminderDate = new Date(exam);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);
    reminderDate.setHours(9, 0, 0, 0); // Remind at 9 AM

    const timeUntil = reminderDate.getTime() - now.getTime();
    if (timeUntil > 0 && timeUntil < 30 * 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        const emoji = daysBefore === 0 ? "🚨" : daysBefore === 1 ? "⚡" : "📅";
        const message =
          daysBefore === 0
            ? `${examName} is TODAY! Good luck! 🍀`
            : `${examName} is in ${daysBefore} day${daysBefore > 1 ? "s" : ""}!`;

        sendNotification(`${emoji} Exam Alert`, {
          body: message,
          tag: `exam-${examName}-${daysBefore}`,
        });
      }, timeUntil);
    }
  });
};

// Pomodoro notification
export const sendPomodoroNotification = (type: "work" | "break") => {
  const prefs = getNotificationPrefs();
  if (!prefs.pomodoroAlerts) return;

  if (type === "break") {
    sendNotification("⏰ Break Time!", {
      body: "Great focus session! Take a short break to recharge.",
      tag: "pomodoro-break",
    });
  } else {
    sendNotification("🎯 Focus Time!", {
      body: "Break's over! Let's get back to studying.",
      tag: "pomodoro-work",
    });
  }
};

// Daily streak reminder (schedule for 7 PM if no study activity)
export const scheduleStreakReminder = () => {
  const prefs = getNotificationPrefs();
  if (!prefs.streakReminders) return;

  const now = new Date();
  const reminderTime = new Date();
  reminderTime.setHours(19, 0, 0, 0); // 7 PM

  if (reminderTime <= now) return; // Already past 7 PM

  const timeUntil = reminderTime.getTime() - now.getTime();

  setTimeout(() => {
    sendNotification("🔥 Don't Break Your Streak!", {
      body: "You haven't studied today yet. Even 10 minutes counts!",
      tag: "streak-reminder",
    });
  }, timeUntil);
};

// Check if app is online
export const isOnline = (): boolean => navigator.onLine;

// Listen for online/offline events
export const onConnectivityChange = (
  callback: (online: boolean) => void
): (() => void) => {
  const onlineHandler = () => callback(true);
  const offlineHandler = () => callback(false);

  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", offlineHandler);

  return () => {
    window.removeEventListener("online", onlineHandler);
    window.removeEventListener("offline", offlineHandler);
  };
};
