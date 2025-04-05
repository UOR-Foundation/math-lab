/**
 * Plugin API Implementations
 * 
 * Exports concrete implementations of the plugin API interfaces.
 */

export { createDashboardApiImpl } from './dashboard-api';
export { createStorageApiImpl } from './storage-api';
export { createEventApiImpl, eventBus } from './event-api';
export { 
  createUiApiImpl, 
  setModalResolver, 
  resolveActiveModal, 
  setConfirmResolver, 
  resolveActiveConfirm 
} from './ui-api';
