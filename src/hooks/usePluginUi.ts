/**
 * Hook for using plugin UI API in React components
 */

import { useCallback } from 'react';
import { getPluginApiService } from '../core/plugin-system/service';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationOptions {
  type?: NotificationType;
  duration?: number;
}

/**
 * Hook for using plugin UI functionality
 * 
 * @returns UI utility functions
 */
export function usePluginUi() {
  const uiApi = getPluginApiService().getUiApi();
  
  /**
   * Show a notification
   * 
   * @param message Notification message
   * @param options Notification options
   */
  const showNotification = useCallback(
    (message: string, options?: NotificationOptions) => {
      uiApi.showNotification(message, options);
    },
    [uiApi]
  );
  
  /**
   * Show a modal dialog
   * 
   * @param title Modal title
   * @param content Modal content
   * @returns Promise that resolves when modal is closed
   */
  const showModal = useCallback(
    (title: string, content: unknown) => {
      return uiApi.showModal(title, content);
    },
    [uiApi]
  );
  
  /**
   * Show a confirmation dialog
   * 
   * @param message Confirmation message
   * @returns Promise that resolves to boolean indicating user's choice
   */
  const showConfirm = useCallback(
    (message: string) => {
      return uiApi.showConfirm(message);
    },
    [uiApi]
  );
  
  return {
    showNotification,
    showModal,
    showConfirm
  };
}
