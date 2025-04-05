# Math Lab Plugins Repository

This repository manages plugins for the UOR Foundation's Math Lab application.

## Repository Structure

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

## Plugin Categories

Plugins are organized into the following categories:

1. **Core Extensions**: Extend the functionality of the math-js library
2. **Visualizations**: Add new visualization types
3. **Tools**: Specialized calculators and utilities
4. **Domains**: Support for specific mathematical domains
5. **Education**: Teaching and learning tools
6. **Integrations**: Connect with external services or data sources
7. **Themes**: Visual customization of the dashboard
8. **Language Packs**: Localization and internationalization

## Getting Started

See the [Plugin Development Guide](docs/development-guide.md) for instructions on creating and submitting plugins.

## Plugin Submission Process

### Official Plugins

1. **Development**:
   - Develop plugin following architecture guidelines
   - Test thoroughly with test harness

2. **Submission**:
   - Submit as PR to this repository under `official/` directory
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

### Community Plugins

1. **Development**:
   - Use plugin templates as starting point
   - Follow development guidelines

2. **Submission**:
   - Submit as PR to this repository under `community/` directory
   - Include documentation and tests

3. **Review**:
   - Automated validation
   - Community review
   - Security scan

4. **Publication**:
   - Merge to repository
   - Update registry
   - Listed with appropriate tags

## License

MIT