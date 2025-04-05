#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Create an Ajv instance
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load the schema
const manifestSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schema', 'manifest-schema.json'), 'utf8')
);

// Compile the schema
const validateManifest = ajv.compile(manifestSchema);

/**
 * Validates a plugin manifest
 * @param {string} manifestPath - Path to the manifest file
 * @returns {object} Validation result
 */
function validatePluginManifest(manifestPath) {
  try {
    // Read the manifest file
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Validate against the schema
    const valid = validateManifest(manifest);
    
    if (!valid) {
      return {
        valid: false,
        errors: validateManifest.errors,
      };
    }
    
    return {
      valid: true,
      manifest,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ message: `Failed to parse manifest: ${error.message}` }],
    };
  }
}

/**
 * Validates the plugin structure
 * @param {string} pluginDir - Path to the plugin directory
 * @returns {object} Validation result
 */
function validatePluginStructure(pluginDir) {
  const requiredFiles = ['manifest.json', 'index.js', 'package.json'];
  const requiredDirs = ['docs'];
  const errors = [];
  
  // Check for required files
  for (const file of requiredFiles) {
    const filePath = path.join(pluginDir, file);
    if (!fs.existsSync(filePath)) {
      errors.push({ message: `Required file not found: ${file}` });
    }
  }
  
  // Check for required directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(pluginDir, dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      errors.push({ message: `Required directory not found: ${dir}` });
    }
  }
  
  // Check manifest file
  const manifestPath = path.join(pluginDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifestResult = validatePluginManifest(manifestPath);
    if (!manifestResult.valid) {
      return {
        valid: false,
        errors: [
          ...errors,
          ...manifestResult.errors.map(err => ({
            message: `Manifest validation error: ${err.instancePath} ${err.message}`,
          })),
        ],
      };
    }
    
    // Check that the entry point exists
    const entryPoint = manifestResult.manifest.entryPoint;
    const entryPointPath = path.join(pluginDir, entryPoint);
    if (!fs.existsSync(entryPointPath)) {
      errors.push({ message: `Entry point not found: ${entryPoint}` });
    }
    
    // Check that documentation files exist
    if (manifestResult.manifest.documentation) {
      const { main, api } = manifestResult.manifest.documentation;
      if (main && !fs.existsSync(path.join(pluginDir, main))) {
        errors.push({ message: `Documentation file not found: ${main}` });
      }
      if (api && !fs.existsSync(path.join(pluginDir, api))) {
        errors.push({ message: `API documentation file not found: ${api}` });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a plugin
 * @param {string} pluginDir - Path to the plugin directory
 * @returns {object} Validation result
 */
function validatePlugin(pluginDir) {
  // Validate the plugin structure
  const structureResult = validatePluginStructure(pluginDir);
  if (!structureResult.valid) {
    return structureResult;
  }
  
  // Add more validations as needed
  
  return {
    valid: true,
    message: 'Plugin validation successful',
  };
}

// If the script is run directly, validate the specified plugin
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Please specify a plugin directory');
    process.exit(1);
  }
  
  const pluginDir = path.resolve(args[0]);
  if (!fs.existsSync(pluginDir) || !fs.statSync(pluginDir).isDirectory()) {
    console.error(`Directory not found: ${pluginDir}`);
    process.exit(1);
  }
  
  const result = validatePlugin(pluginDir);
  if (result.valid) {
    console.log(result.message);
    process.exit(0);
  } else {
    console.error('Plugin validation failed:');
    for (const error of result.errors) {
      console.error(`- ${error.message}`);
    }
    process.exit(1);
  }
}

module.exports = {
  validatePlugin,
  validatePluginManifest,
  validatePluginStructure,
};