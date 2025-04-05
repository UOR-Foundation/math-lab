# Math Lab

Official reference implementation dashboard for the UOR Foundation's math-js library.

## Overview

Math Lab is a comprehensive mathematical laboratory in the form of a Progressive Web Application (PWA), providing an interactive environment for exploration, computation, and visualization of mathematical concepts through the Prime Framework.

## Features

- Interactive dashboard for mathematical exploration
- Universal Number operations and visualizations
- Factorization laboratory with advanced algorithms
- Number Theory tools and visualizations
- Extensible plugin architecture

## Technology Stack

- Frontend: React.js with TypeScript
- State Management: Redux with Redux Toolkit
- UI Components: Material-UI
- Visualization: D3.js, Three.js
- Storage: IndexedDB with optional cloud sync
- Build System: Vite with PWA plugin
- Math Engine: UOR Foundation's math-js library

## Getting Started

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/UOR-Foundation/math-lab.git
   cd math-lab
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Deployment

The application is automatically deployed to GitHub Pages when changes are pushed to the main branch. The deployment workflow includes:

- **Production Deployment**: Pushed to the main branch at https://uor-foundation.github.io/math-lab/
- **Staging Deployment**: Can be manually triggered from GitHub Actions for testing before production

To manually trigger a deployment to staging:
1. Go to the Actions tab in the GitHub repository
2. Select the "Deploy" workflow
3. Click "Run workflow"
4. Select "staging" as the environment
5. Click "Run workflow"

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.