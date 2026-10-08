import type { Notification } from './types';

/** DaisyUI semantic color for a notification. */
export type NotificationColor = 'success' | 'error' | 'warning' | 'info';

export type NotificationIcon = NotificationColor | 'loading';

export function getNotificationColor(notification: Notification): NotificationColor {
	if (notification.type === 'promise') {
		if (notification.promise?.status === 'resolved') return 'success';
		if (notification.promise?.status === 'rejected') return 'error';
		return 'info';
	}
	return notification.type;
}

export function getNotificationIcon(notification: Notification): NotificationIcon {
	if (notification.type === 'promise' && notification.promise?.status === 'pending') {
		return 'loading';
	}
	return getNotificationColor(notification);
}
