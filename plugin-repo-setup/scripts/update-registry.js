#!/usr/bin/env node

/**
 * Script to update the plugin registry index
 * This scans all plugins in the official and community directories,
 * validates them, and updates the registry/index.json file
 */

const fs = require('fs');
const path = require('path');
const { validatePlugin } = require('../validation/validate-plugin');

// Paths
const REGISTRY_PATH = path.join(__dirname, '..', 'registry', 'index.json');
const OFFICIAL_PLUGINS_PATH = path.join(__dirname, '..', 'official');
const COMMUNITY_PLUGINS_PATH = path.join(__dirname, '..', 'community');

/**
 * Get plugin metadata from a plugin directory
 * @param {string} pluginDir - Path to the plugin directory
 * @param {string} type - Plugin type (official or community)
 * @returns {object|null} Plugin metadata or null if invalid
 */
function getPluginMetadata(pluginDir, type) {
  const result = validatePlugin(pluginDir);
  if (!result.valid) {
    console.error(`Invalid plugin in ${pluginDir}:`);
    result.errors.forEach(error => console.error(`- ${error.message}`));
    return null;
  }
  
  const manifestPath = path.join(pluginDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    author: manifest.author,
    keywords: manifest.keywords || [],
    compatibility: manifest.compatibility,
    type,
    path: path.relative(path.join(__dirname, '..'), pluginDir),
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Scan a directory for plugins
 * @param {string} dir - Directory to scan
 * @param {string} type - Plugin type (official or community)
 * @returns {Array} Array of plugin metadata
 */
function scanPlugins(dir, type) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  const plugins = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pluginDir = path.join(dir, entry.name);
      const metadata = getPluginMetadata(pluginDir, type);
      if (metadata) {
        plugins.push(metadata);
      }
    }
  }
  
  return plugins;
}

/**
 * Update the registry index
 */
function updateRegistry() {
  // Load the current registry
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch (error) {
    registry = {
      schemaVersion: '1.0.0',
      plugins: []
    };
  }
  
  // Scan for plugins
  const officialPlugins = scanPlugins(OFFICIAL_PLUGINS_PATH, 'official');
  const communityPlugins = scanPlugins(COMMUNITY_PLUGINS_PATH, 'community');
  
  // Merge plugins
  const allPlugins = [...officialPlugins, ...communityPlugins];
  
  // Update registry
  registry.plugins = allPlugins;
  registry.lastUpdated = new Date().toISOString();
  
  // Write the updated registry
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  
  console.log(`Registry updated with ${allPlugins.length} plugins (${officialPlugins.length} official, ${communityPlugins.length} community)`);
}

// Run the update
updateRegistry();