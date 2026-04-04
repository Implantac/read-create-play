import { useState, useCallback, useEffect } from "react";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const supported = typeof Notification !== "undefined";

  useEffect(() => {
    if (supported) {
      setPermission(Notification.permission);
    }
  }, [supported]);

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as NotificationPermission;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return "denied" as NotificationPermission;
    }
  }, [supported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported || Notification.permission !== "granted") return null;
      try {
        return new Notification(title, {
          icon: "/favicon.png",
          badge: "/favicon.png",
          ...options,
        });
      } catch {
        return null;
      }
    },
    [supported]
  );

  return { permission, supported, requestPermission, sendNotification };
}
