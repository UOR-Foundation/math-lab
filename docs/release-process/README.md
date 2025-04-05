# Math Lab Release Process

This document describes the automated release process for the Math Lab application.

## Release Automation

The Math Lab project uses GitHub Actions to automate the release process. The automation handles:

1. Version bumping (major, minor, patch)
2. Changelog generation
3. Git tagging
4. Building and testing the application
5. Creating GitHub releases with assets
6. Publishing the release

## Creating a New Release

### Automated Release (Recommended)

To create a new release:

1. Go to the GitHub repository's Actions tab
2. Select the "Release" workflow
3. Click "Run workflow"
4. In the form that appears:
   - Select the type of version bump (patch, minor, or major)
   - Optionally add release notes
   - Click "Run workflow"

The workflow will:
- Bump the version in package.json according to your selection
- Generate a changelog based on commits since the last release
- Create a git tag for the new version
- Build and validate the application
- Create a GitHub release with the changelog and build artifacts
- Publish the release

### Manual Release (Alternative)

You can also create a release manually:

1. Update version in package.json
2. Create a git tag with the version (e.g., `git tag v1.2.3`)
3. Push the tag to GitHub (`git push origin v1.2.3`)

This will trigger the release workflow, which will:
- Build and validate the application
- Create a GitHub release with a changelog and build artifacts
- Publish the release

## Version Numbers

Math Lab follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

## Changelog Generation

The release workflow automatically generates a changelog based on commits since the last release. For best results:

- Use conventional commit messages (feat:, fix:, docs:, etc.)
- Reference issue numbers in commit messages

## Release Assets

Each release includes:
- The compiled application as a ZIP file (math-lab-x.y.z.zip)
- A changelog listing all changes since the previous release

## Post-Release Steps

After a release is published:
1. The new version is automatically deployed to the production environment
2. Update documentation if necessary
3. Announce the release to users through appropriate channels