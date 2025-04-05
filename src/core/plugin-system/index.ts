/**
 * Plugin System
 * 
 * Exports the public API for the plugin system.
 */

// Export types
export * from './types';

// Export plugin registry
export { pluginRegistry } from './registry';

// Export plugin loading functions
export { 
  loadPlugin, 
  initializePlugin, 
  unloadPlugin, 
  clearPluginCache, 
  getCacheInfo 
} from './loader';

// Export plugin manager
export { createPluginManager, PluginManager } from './manager';

// Export API factory
export { createPluginAPI } from './api';

// Export manifest validator
export { validateManifest } from './validator';

// Export sandbox creator
export { createSandbox } from './sandbox';

// Export plugin API service
export { 
  PluginApiService, 
  getPluginApiService 
} from './service';

// Export API implementations 
export {
  createDashboardApiImpl,
  createStorageApiImpl,
  createEventApiImpl,
  createUiApiImpl,
  eventBus,
  setModalResolver,
  resolveActiveModal,
  setConfirmResolver,
  resolveActiveConfirm
} from './implementations';

// Export repository connector
export { createPluginRepositoryConnector, PluginRepositoryConnector } from './repo-connector';
export type { RepositoryPluginMetadata, RepositoryIndex } from './repo-connector';

// Export SDK for plugin development
export * as sdk from './sdk';