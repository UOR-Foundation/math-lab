/**
 * UI API Implementation
 * 
 * Provides the concrete implementation of the PluginUIAPI interface
 * for use with the plugin system.
 */

import { PluginUIAPI } from '../types';
import store from '../../../store';
import { addNotification } from '../../../store/slices/uiSlice';

// Keep track of modal promise resolvers
type ModalResolver = (value: void | PromiseLike<void>) => void;
type ConfirmResolver = (value: boolean | PromiseLike<boolean>) => void;

let activeModalResolver: ModalResolver | null = null;
let activeConfirmResolver: ConfirmResolver | null = null;

/**
 * Set resolver for active modal
 * @param resolver Function to resolve the modal promise
 */
export function setModalResolver(resolver: ModalResolver | null): void {
  activeModalResolver = resolver;
}

/**
 * Resolve the active modal
 */
export function resolveActiveModal(): void {
  if (activeModalResolver) {
    activeModalResolver();
    activeModalResolver = null;
  }
}

/**
 * Set resolver for active confirm dialog
 * @param resolver Function to resolve the confirm dialog promise
 */
export function setConfirmResolver(resolver: ConfirmResolver | null): void {
  activeConfirmResolver = resolver;
}

/**
 * Resolve the active confirm dialog
 * @param confirmed Whether the user confirmed or cancelled
 */
export function resolveActiveConfirm(confirmed: boolean): void {
  if (activeConfirmResolver) {
    activeConfirmResolver(confirmed);
    activeConfirmResolver = null;
  }
}

/**
 * Creates a UI API implementation that uses Redux and modal resolvers
 * to manage UI interactions.
 * 
 * @returns UI API implementation
 */
export function createUiApiImpl(): PluginUIAPI {
  return {
    showNotification: (message, options = {}) => {
      store.dispatch(addNotification({
        message,
        type: options.type || 'info',
      }));
    },

    showModal: (title, content) => {
      return new Promise<void>((resolve) => {
        // Store resolver to be called when modal is closed
        setModalResolver(resolve);
        
        // Dispatch action to show modal
        store.dispatch({
          type: 'ui/showModal',
          payload: { title, content }
        });
      });
    },

    showConfirm: (message) => {
      return new Promise<boolean>((resolve) => {
        // Store resolver to be called when confirm dialog is closed
        setConfirmResolver(resolve);
        
        // Dispatch action to show confirm dialog
        store.dispatch({
          type: 'ui/showConfirm',
          payload: { message }
        });
      });
    }
  };
}
