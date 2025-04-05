# Math Lab: GitHub Repository Specification

**Version:** 1.0.0  
**Date:** April 5, 2025  
**Status:** Draft  

## 1. Repository Overview

This document provides a pragmatic implementation guide for setting up and organizing the GitHub repository for the Math Lab project, based on the dashboard specification requirements.

## 2. Repository Structure

```
math-lab/
├── .github/                      # GitHub-specific files
│   ├── workflows/                # GitHub Actions workflows
│   │   ├── ci.yml                # CI pipeline
│   │   ├── deploy.yml            # Deployment workflow
│   │   └── release.yml           # Release automation
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md  # PR template
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── assets/                   # Icons, images
│   └── favicon.ico               # Favicon
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── dashboard/            # Dashboard UI components
│   │   ├── panels/               # Panel components
│   │   ├── visualization/        # Visualization components
│   │   └── shared/               # Shared UI components
│   ├── core/                     # Core functionality
│   │   ├── expression-engine/    # Expression parsing and evaluation
│   │   ├── computation/          # Computation manager & workers
│   │   ├── storage/              # Storage system
│   │   └── plugin-system/        # Plugin infrastructure
│   ├── plugins/                  # Built-in plugins
│   │   ├── number-theory/        # Number theory tools
│   │   ├── factorization/        # Factorization tools
│   │   └── visualization/        # Visualization plugins
│   ├── hooks/                    # React hooks
│   ├── store/                    # Redux store
│   │   ├── slices/               # Redux slices
│   │   └── index.ts              # Store configuration
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── workers/                  # Web worker scripts
│   ├── App.tsx                   # Main application component
│   └── index.tsx                 # Entry point
├── plugin-templates/             # Templates for plugin development
│   ├── basic/                    # Basic plugin template
│   ├── visualization/            # Visualization plugin template
│   └── tool/                     # Tool plugin template
├── docs/                         # Documentation
│   ├── architecture/             # Architecture documentation
│   ├── plugin-development/       # Plugin development guide
│   └── api/                      # API documentation
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
├── scripts/                      # Build & development scripts
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # NPM package file
├── README.md                     # Project README
└── LICENSE                       # License file
```

## 3. GitHub Repository Setup

### 3.1 Repository Configuration

- **Repository Name:** `math-lab`
- **Repository Owner:** UOR Foundation (GitHub Organization)
- **Description:** Official reference implementation dashboard for the UOR Foundation's math-js library
- **Visibility:** Public
- **License:** MIT

### 3.2 Branch Strategy

- **Main Branch:** `main` (protected)
- **Development Branch:** `develop` (protected)
- **Feature Branches:** `feature/<feature-name>`
- **Bugfix Branches:** `bugfix/<issue-number>`
- **Release Branches:** `release/v<major>.<minor>.<patch>`

### 3.3 Protection Rules

#### Main Branch Protection

- Require pull request reviews before merging
- Require status checks to pass before merging:
  - CI build and tests
  - TypeScript type checking
- Require linear history
- Include administrators in restrictions

#### Develop Branch Protection

- Require status checks to pass before merging:
  - CI build and tests
  - TypeScript type checking

### 3.4 Issues Configuration

- **Labels:**
  - `bug`: Bug reports
  - `enhancement`: Feature requests
  - `documentation`: Documentation updates
  - `plugin`: Plugin-related issues
  - `performance`: Performance improvements
  - `accessibility`: Accessibility issues
  - `good first issue`: Beginner-friendly issues
  - `help wanted`: Issues needing community assistance
  
- **Issue Templates:**
  - Bug report template
  - Feature request template
  - Plugin submission template
  - Documentation update template

### 3.5 Pull Request Template

```markdown
## Description

[Describe the changes you've made]

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Plugin addition/update

## Checklist

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have added tests that prove my fix/feature works
- [ ] All new and existing tests pass
- [ ] I have updated the documentation accordingly
- [ ] I have checked for accessibility issues

## Related Issues

Closes #[issue_number]
```

## 4. CI/CD Workflows

### 4.1 Continuous Integration (ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Type check
        run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/
```

### 4.2 Deployment (deploy.yml)

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 4.3 Release (release.yml)

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Create release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
      - name: Zip distribution
        run: zip -r math-lab-${{ github.ref_name }}.zip dist
      - name: Upload release asset
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./math-lab-${{ github.ref_name }}.zip
          asset_name: math-lab-${{ github.ref_name }}.zip
          asset_content_type: application/zip
```

## 5. Package Configuration

### 5.1 package.json

```json
{
  "name": "math-lab",
  "version": "1.0.0",
  "description": "Official reference implementation dashboard for the UOR Foundation's math-js library",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  },
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/material": "^5.15.0",
    "@reduxjs/toolkit": "^2.0.0",
    "@uor-foundation/math-js": "^1.0.0",
    "d3": "^7.8.5",
    "idb": "^7.1.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^9.0.0",
    "three": "^0.159.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@types/d3": "^7.4.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.15",
    "@types/three": "^0.159.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@vitejs/plugin-react": "^4.2.1",
    "cypress": "^13.6.0",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "jsdom": "^23.0.1",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vite-plugin-pwa": "^0.17.4",
    "vitest": "^1.0.4"
  }
}
```

### 5.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 5.3 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Math Lab',
        short_name: 'MathLab',
        description: 'Interactive mathematical laboratory',
        theme_color: '#4a90e2',
        icons: [
          {
            src: 'assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
          mathjs: ['@uor-foundation/math-js'],
          visualization: ['d3', 'three']
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
});
```

## 6. Core Implementation Structure

### 6.1 Plugin System

The plugin system will be implemented following the specified architecture in the dashboard spec:

- `src/core/plugin-system/` will contain:
  - `types.ts` - Plugin interfaces and types
  - `loader.ts` - Plugin loading mechanism
  - `registry.ts` - Plugin registration and management
  - `sandbox.ts` - Security sandbox for plugin execution
  - `api.ts` - Plugin API exposing dashboard functionality

### 6.2 Computation Manager

The computation manager will be implemented as outlined in the dashboard spec:

- `src/core/computation/` will contain:
  - `worker-manager.ts` - Web worker pool management
  - `computation-queue.ts` - Task prioritization and management
  - `executor.ts` - Expression execution
  - `computation-worker.ts` - Web worker script for calculations

### 6.3 Storage System

The storage system will follow the layered approach described in the spec:

- `src/core/storage/` will contain:
  - `session-storage.ts` - In-memory storage for the current session
  - `local-storage.ts` - IndexedDB-based persistent storage
  - `cloud-storage.ts` - Optional cloud synchronization
  - `storage-manager.ts` - Unified API for all storage layers

## 7. Plugin Repository Structure

A separate repository will be created for managing Math Lab plugins:

```
math-lab-plugins/
├── official/                     # Official plugins
│   ├── universal-number/         # Universal Number Explorer
│   ├── factorization/            # Prime Factorization
│   ├── number-theory/            # Number Theory Tools
│   └── visualization/            # Visualization plugins
├── community/                    # Community plugins
├── registry/                     # Plugin registry data
│   ├── index.json                # Plugin index
│   └── metadata/                 # Plugin metadata files
├── validation/                   # Validation tools
├── templates/                    # Plugin templates
└── docs/                         # Plugin documentation
```

## 8. Development Workflow

### 8.1 Feature Development Process

1. **Issue Creation**:
   - Create an issue describing the feature or bug
   - Apply appropriate labels
   - Assign to milestone if applicable

2. **Branch Creation**:
   - Create feature branch from `develop`
   - Follow naming convention: `feature/<issue-number>-short-description`

3. **Development**:
   - Implement feature according to specification
   - Write tests for new functionality
   - Update documentation as needed

4. **Pull Request**:
   - Create PR targeting `develop` branch
   - Fill out PR template
   - Reference related issues
   - Request reviews from team members

5. **Review Process**:
   - CI checks must pass
   - At least one approving review required
   - Address review comments

6. **Merge**:
   - Merge feature branch into `develop`
   - Delete feature branch after merge

### 8.2 Release Process

1. **Release Preparation**:
   - Create release branch from `develop`: `release/v1.x.x`
   - Update version numbers in package.json
   - Update CHANGELOG.md
   - Perform final testing

2. **Release Finalization**:
   - Create PR to merge release branch to `main`
   - After approval and merge, tag the release: `v1.x.x`
   - GitHub Actions will automatically build and deploy

3. **Post-Release**:
   - Merge `main` back to `develop`
   - Announce release in GitHub Discussions

## 9. Documentation Strategy

### 9.1 In-Repository Documentation

- `README.md`: Project overview, getting started, basic usage
- `docs/`: Detailed documentation
  - Architecture documents
  - Plugin development guides
  - API documentation

### 9.2 GitHub Wiki

- User Guide: Complete user documentation
- Tutorials: Step-by-step guides for common tasks
- FAQ: Frequently asked questions

### 9.3 GitHub Discussions

- Announcements: Project updates and releases
- Q&A: Community support
- Ideas: Feature requests and suggestions
- Show and Tell: Share plugins and integrations

## 10. Plugin Submission and Review Process

### 10.1 Official Plugins

1. **Development**:
   - Develop plugin following architecture guidelines
   - Test thoroughly with test harness

2. **Submission**:
   - Submit as PR to `math-lab-plugins` repository under `official/` directory
   - Include complete documentation
   - Provide test coverage

3. **Review**:
   - Code review by core team
   - Security review
   - Performance review

4. **Publication**:
   - Merge to repository
   - Generate plugin package
   - Update registry

### 10.2 Community Plugins

1. **Development**:
   - Use plugin templates as starting point
   - Follow development guidelines

2. **Submission**:
   - Submit as PR to `math-lab-plugins` repository under `community/` directory
   - Include documentation and tests

3. **Review**:
   - Automated validation
   - Community review
   - Security scan

4. **Publication**:
   - Merge to repository
   - Update registry
   - Listed with appropriate tags

## 11. Implementation Roadmap

### 11.1 Phase 1: Infrastructure (Q2 2025)

- Repository setup
- CI/CD pipeline configuration
- Core framework scaffolding
- Basic UI components

### 11.2 Phase 2: Core Features (Q3 2025)

- Expression engine
- Computation manager
- Storage system
- Basic plugin system

### 11.3 Phase 3: Plugins and Refinements (Q4 2025)

- Standard plugins implementation
- UI refinements
- Performance optimizations
- Plugin repository launch

### 11.4 Phase 4: Advanced Features (Q1 2026)

- Cloud synchronization
- Collaborative features
- Advanced visualizations
- Mobile optimizations

---

*This specification is subject to change as the Math Lab project evolves.*