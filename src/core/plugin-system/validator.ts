/**
 * Plugin Manifest Validator
 * 
 * Validates plugin manifests against the expected schema.
 */

import { PluginManifest, PluginConfigParameter, PluginPermission } from './types';

/**
 * Validate plugin manifest against schema
 * 
 * @param manifest The plugin manifest to validate
 * @throws Error if validation fails
 */
export function validateManifest(manifest: PluginManifest): void {
  // Check required fields
  const requiredFields: (keyof PluginManifest)[] = [
    'id', 'name', 'version', 'compatibility', 'author', 
    'license', 'description', 'entryPoint'
  ];
  
  for (const field of requiredFields) {
    if (!manifest[field]) {
      throw new Error(`Missing required field in plugin manifest: ${field}`);
    }
  }
  
  // Validate ID format
  if (!/^[a-zA-Z0-9\-_.]+(\.[a-zA-Z0-9\-_.]+)+$/.test(manifest.id)) {
    throw new Error(`Invalid plugin ID format: ${manifest.id}. Must be in reverse domain format (e.g., "org.example.plugin-name")`);
  }
  
  // Validate version format (semver)
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(manifest.version)) {
    throw new Error(`Invalid version format: ${manifest.version}. Must follow semver (e.g., "1.0.0")`);
  }
  
  // Validate compatibility
  if (!manifest.compatibility.mathJs || !manifest.compatibility.dashboard) {
    throw new Error('Missing compatibility requirements for mathJs or dashboard');
  }
  
  // Validate semver ranges in compatibility
  validateSemverRange(manifest.compatibility.mathJs, 'mathJs compatibility');
  validateSemverRange(manifest.compatibility.dashboard, 'dashboard compatibility');
  
  // Validate author
  if (!manifest.author.name) {
    throw new Error('Missing author name in plugin manifest');
  }
  
  // Validate dependencies
  if (manifest.dependencies) {
    for (const [index, dep] of manifest.dependencies.entries()) {
      if (!dep.id) {
        throw new Error(`Missing ID in dependency at index ${index}`);
      }
      
      if (!dep.version) {
        throw new Error(`Missing version in dependency ${dep.id}`);
      }
      
      validateSemverRange(dep.version, `dependency ${dep.id} version`);
      
      if (dep.optional === undefined) {
        throw new Error(`Missing 'optional' flag in dependency ${dep.id}`);
      }
    }
  }
  
  // Validate dashboard UI elements
  if (manifest.dashboard) {
    // Validate panels
    if (manifest.dashboard.panels) {
      for (const [index, panel] of manifest.dashboard.panels.entries()) {
        if (!panel.id) {
          throw new Error(`Missing ID in panel at index ${index}`);
        }
        
        if (!panel.title) {
          throw new Error(`Missing title in panel ${panel.id}`);
        }
        
        if (!['main', 'sidebar', 'results', 'visualization'].includes(panel.position)) {
          throw new Error(`Invalid position in panel ${panel.id}: ${panel.position}`);
        }
      }
    }
    
    // Validate toolbar items
    if (manifest.dashboard.toolbarItems) {
      for (const [index, item] of manifest.dashboard.toolbarItems.entries()) {
        if (!item.id) {
          throw new Error(`Missing ID in toolbar item at index ${index}`);
        }
        
        if (!item.title) {
          throw new Error(`Missing title in toolbar item ${item.id}`);
        }
        
        if (!item.icon) {
          throw new Error(`Missing icon in toolbar item ${item.id}`);
        }
        
        if (!item.action) {
          throw new Error(`Missing action in toolbar item ${item.id}`);
        }
      }
    }
    
    // Validate visualizations
    if (manifest.dashboard.visualizations) {
      for (const [index, vis] of manifest.dashboard.visualizations.entries()) {
        if (!vis.id) {
          throw new Error(`Missing ID in visualization at index ${index}`);
        }
        
        if (!vis.name) {
          throw new Error(`Missing name in visualization ${vis.id}`);
        }
        
        if (!vis.type || !['chart', '2d', '3d'].includes(vis.type)) {
          throw new Error(`Invalid type in visualization ${vis.id}: ${vis.type}`);
        }
        
        if (!vis.supportsData || !Array.isArray(vis.supportsData) || vis.supportsData.length === 0) {
          throw new Error(`Missing or invalid supportsData in visualization ${vis.id}`);
        }
      }
    }
  }
  
  // Validate config schema
  if (manifest.config && manifest.config.schema) {
    for (const [key, param] of Object.entries(manifest.config.schema)) {
      validateConfigParameter(key, param);
    }
  }
  
  // Validate permissions
  if (manifest.permissions) {
    for (const [index, permission] of manifest.permissions.entries()) {
      if (!isValidPermission(permission)) {
        throw new Error(`Invalid permission at index ${index}: ${permission}`);
      }
    }
  }
  
  // Validate resources
  if (manifest.resources) {
    const validLevels = ['low', 'medium', 'high'];
    
    if (manifest.resources.cpu && !validLevels.includes(manifest.resources.cpu)) {
      throw new Error(`Invalid CPU resource level: ${manifest.resources.cpu}`);
    }
    
    if (manifest.resources.memory && !validLevels.includes(manifest.resources.memory)) {
      throw new Error(`Invalid memory resource level: ${manifest.resources.memory}`);
    }
  }
}

/**
 * Validate a semver range string
 * 
 * @param range Semver range to validate
 * @param fieldName Name of the field being validated
 * @throws Error if validation fails
 */
function validateSemverRange(range: string, fieldName: string): void {
  // Simple validation for common semver range patterns
  // In a real implementation, we'd use a full semver library
  const validRangePattern = /^(\*|latest|\d+\.\d+\.\d+|[~^]\d+\.\d+\.\d+|\d+\.\d+\.\d+\s*-\s*\d+\.\d+\.\d+|\d+\.\d+\.\d+\s*[<>]=?\s*\d+\.\d+\.\d+)$/;
  
  if (!validRangePattern.test(range)) {
    throw new Error(`Invalid semver range in ${fieldName}: ${range}`);
  }
}

/**
 * Validate a configuration parameter
 * 
 * @param key Parameter key
 * @param param Parameter definition
 * @throws Error if validation fails
 */
function validateConfigParameter(key: string, param: PluginConfigParameter): void {
  const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
  
  if (!validTypes.includes(param.type)) {
    throw new Error(`Invalid type for config parameter ${key}: ${param.type}`);
  }
  
  // Type-specific validations
  if (param.type === 'number') {
    if (param.min !== undefined && param.max !== undefined && param.min > param.max) {
      throw new Error(`Invalid range for config parameter ${key}: min (${param.min}) > max (${param.max})`);
    }
    
    if (param.default !== undefined) {
      const defaultVal = param.default as number;
      if (typeof defaultVal !== 'number') {
        throw new Error(`Default value for config parameter ${key} does not match type number`);
      }
      
      if (param.min !== undefined && defaultVal < param.min) {
        throw new Error(`Default value for config parameter ${key} is less than min value`);
      }
      
      if (param.max !== undefined && defaultVal > param.max) {
        throw new Error(`Default value for config parameter ${key} is greater than max value`);
      }
    }
  }
  
  if (param.type === 'array' && param.options !== undefined && !Array.isArray(param.options)) {
    throw new Error(`Options for array config parameter ${key} must be an array`);
  }
}

/**
 * Check if a string is a valid permission
 * 
 * @param permission Permission to validate
 * @returns True if valid
 */
function isValidPermission(permission: string): permission is PluginPermission {
  const validPermissions: PluginPermission[] = [
    'storage',
    'storage.local',
    'storage.cloud',
    'computation',
    'computation.intensive',
    'network',
    'clipboard',
    'notifications'
  ];
  
  return validPermissions.includes(permission as PluginPermission);
}