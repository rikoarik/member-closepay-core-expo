/**
 * Features Notification - Notification Model
 * Generic notification model
 */

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'push';
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

export interface NotificationFilters {
  type?: Notification['type'];
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

