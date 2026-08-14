/**
 * Web & PWA Native System Notifications Helper
 * Provides native OS notification support for browser and installed PWA app.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Check if the browser / device supports Native Web Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Request system notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return Notification.permission as NotificationPermissionState;
  }
}

export interface NativeNotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  silent?: boolean;
  vibrate?: number[];
}

/**
 * Trigger an OS / Device-level Native System Notification.
 * Utilizes active PWA ServiceWorker registration if available (optimal for mobile & PWA),
 * falling back to traditional Notification API constructor.
 */
export async function sendNativeNotification(
  title: string,
  options: NativeNotificationOptions = {}
): Promise<boolean> {
  if (getNotificationPermission() !== 'granted') {
    return false;
  }

  const defaultOptions: NativeNotificationOptions = {
    icon: '/pwa-icon-192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    ...options,
  };

  try {
    // 1. Try ServiceWorker Registration (Best for PWA & Mobile OS support)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, {
          body: defaultOptions.body,
          icon: defaultOptions.icon,
          badge: defaultOptions.badge,
          tag: defaultOptions.tag,
          data: defaultOptions.data,
          silent: defaultOptions.silent,
          vibrate: defaultOptions.vibrate,
        } as NotificationOptions & { vibrate?: number[] });
        return true;
      }
    }

    // 2. Fallback to standard Notification API
    if (typeof Notification !== 'undefined') {
      const notif = new Notification(title, {
        body: defaultOptions.body,
        icon: defaultOptions.icon,
        badge: defaultOptions.badge,
        tag: defaultOptions.tag,
        data: defaultOptions.data,
        silent: defaultOptions.silent,
      });

      // Auto close after 6 seconds if supported
      setTimeout(() => {
        try {
          notif.close();
        } catch (e) {}
      }, 6000);

      return true;
    }
  } catch (error) {
    console.error('Failed to dispatch native notification:', error);
  }

  return false;
}
