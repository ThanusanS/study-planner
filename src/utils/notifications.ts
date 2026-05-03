export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon.png',
      badge: '/badge.png',
      ...options,
    });
  }
};

export const scheduleTaskReminder = (taskTitle: string, reminderTime: string) => {
  const now = new Date();
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const reminderDate = new Date();
  reminderDate.setHours(hours, minutes, 0, 0);

  if (reminderDate <= now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  const timeUntilReminder = reminderDate.getTime() - now.getTime();

  if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      sendNotification('Task Reminder', {
        body: taskTitle,
        tag: 'task-reminder',
      });
    }, timeUntilReminder);
  }
};
