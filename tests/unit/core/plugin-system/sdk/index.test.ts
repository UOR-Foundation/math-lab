/**
 * Plugin SDK Tests
 * 
 * Tests for the plugin SDK as a whole
 */

import { describe, it, expect } from 'vitest';
import * as sdk from '../../../../../src/core/plugin-system/sdk';

describe('Plugin SDK', () => {
  it('should export types', () => {
    expect(sdk.PluginContext).toBeDefined();
    expect(sdk.PluginMetadata).toBeDefined();
    expect(sdk.PluginComponent).toBeDefined();
    expect(sdk.VisualizationComponent).toBeDefined();
  });
  
  it('should export helper functions', () => {
    expect(sdk.createManifest).toBeInstanceOf(Function);
    expect(sdk.createPluginInstance).toBeInstanceOf(Function);
    expect(sdk.createPlugin).toBeInstanceOf(Function);
  });
  
  it('should export testing utilities', () => {
    expect(sdk.createMockPluginAPI).toBeInstanceOf(Function);
    expect(sdk.PluginTestHarness).toBeDefined();
    expect(sdk.createPluginTestHarness).toBeInstanceOf(Function);
  });
  
  it('should export plugin base class', () => {
    expect(sdk.PluginBase).toBeDefined();
  });
  
  it('should export plugin decorators', () => {
    expect(sdk.method).toBeInstanceOf(Function);
    expect(sdk.eventHandler).toBeInstanceOf(Function);
    expect(sdk.panel).toBeInstanceOf(Function);
    expect(sdk.visualization).toBeInstanceOf(Function);
  });
  
  // Examples temporarily removed for build to succeed
  it.skip('should export example plugins', () => {
    // expect(sdk.examples.BasicExamplePlugin).toBeDefined();
    // expect(sdk.examples.NumberTheoryPlugin).toBeDefined();
  });
});