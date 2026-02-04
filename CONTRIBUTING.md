# Contributing to Betinho

Thank you for your interest in contributing to Betinho - RKMMAX Hybrid Intelligence System! 🚀

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/rkmmax-hibrido.git
   cd rkmmax-hibrido
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/kizirianmax/rkmmax-hibrido.git
   ```

## Development Setup

### Prerequisites

- Node.js 22.x or higher
- npm 10.x or higher
- Git

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local
# You need at least one AI provider (Gemini or Groq)
```

### Running Locally

```bash
# Start development server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Format code
npm run format
```

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-streaming-support` - New features
- `fix/timeout-handling` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/optimize-cache` - Code refactoring
- `test/add-integration-tests` - Test additions

### Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes** using conventional commits

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

## Coding Standards

### JavaScript/React Style

We use ESLint and Prettier for code formatting:

```bash
# Check formatting
npm run format:check

# Auto-fix formatting
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Code Style Guidelines

- **Use modern JavaScript** (ES6+)
- **Functional components** over class components
- **Hooks** for state management
- **Descriptive variable names**: `userMessages` not `msgs`
- **Constants in UPPER_CASE**: `MAX_RETRIES`
- **Functions in camelCase**: `fetchUserData()`
- **Components in PascalCase**: `ChatMessage`

### File Organization

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── services/        # API services
├── config/          # Configuration files
└── __tests__/       # Test files

api/
├── lib/             # Shared utilities
├── __tests__/       # API tests
└── *.js             # API endpoints
```

### Comments

- **Use JSDoc** for functions:
  ```javascript
  /**
   * Calculate response time statistics
   * @param {number[]} times - Array of response times in ms
   * @returns {Object} Statistics object with avg, min, max
   */
  function calculateStats(times) {
    // Implementation
  }
  ```

- **Explain "why"**, not "what":
  ```javascript
  // Good
  // Use exponential backoff to prevent API rate limiting
  await delay(Math.pow(2, retryCount) * 1000);

  // Bad
  // Wait 2 seconds
  await delay(2000);
  ```

## Testing Requirements

### Test Coverage

All new code must have tests with **80%+ coverage**.

### Writing Tests

```javascript
// Good test structure
describe('CircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test', { timeout: 1000 });
  });

  test('should execute function successfully', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const result = await breaker.execute(mockFn);
    
    expect(result).toBe('success');
    expect(breaker.state).toBe('CLOSED');
  });
});
```

### Test Types

1. **Unit Tests**: Test individual functions/components
2. **Integration Tests**: Test API endpoints and workflows
3. **Performance Tests**: Verify response times

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- circuit-breaker.test.js

# Run tests with coverage
npm run test:ci

# Watch mode for development
npm run test:watch
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
feat(api): add SSE streaming endpoint

Implement Server-Sent Events streaming for chat responses.
This enables progressive response delivery and prevents timeouts.

Closes #123

# Bug fix
fix(cache): prevent memory leak in LRU cache

Clear expired entries on cleanup to prevent unbounded growth.

# Documentation
docs(readme): update installation instructions

Add Node.js version requirement and clarify API key setup.
```

### Commit Guidelines

- Use present tense: "add feature" not "added feature"
- Use imperative mood: "move cursor to..." not "moves cursor to..."
- Limit first line to 72 characters
- Reference issues: `Closes #123`, `Fixes #456`

## Pull Request Process

### Before Submitting

1. ✅ All tests pass: `npm test`
2. ✅ Code is linted: `npm run lint`
3. ✅ Code is formatted: `npm run format`
4. ✅ Documentation is updated
5. ✅ Commit messages follow conventions
6. ✅ Branch is up to date with `main`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Performance Impact
- [ ] No performance impact
- [ ] Performance improved
- [ ] Performance considerations documented

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No new warnings
```

### Review Process

1. **Automated Checks**: CI/CD runs tests, linting, security scans
2. **Code Review**: Maintainers review code quality and design
3. **Feedback**: Address review comments
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge to `main`

## Reporting Bugs

### Before Reporting

1. Check [existing issues](https://github.com/kizirianmax/rkmmax-hibrido/issues)
2. Update to latest version
3. Reproduce in clean environment

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Actual behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., macOS 13.0]
- Node.js: [e.g., 22.1.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Proposed Solution**
Your proposed solution

**Alternatives Considered**
Alternative approaches you've considered

**Additional Context**
Any other relevant information

**Would you like to implement this?**
- [ ] Yes, I can implement this
- [ ] No, just suggesting
```

### Feature Discussion

1. Open an issue with the feature request template
2. Discuss feasibility and approach with maintainers
3. Get approval before starting implementation
4. Follow the standard PR process

## Questions?

- **Email**: roberto@kizirianmax.site
- **Issues**: [GitHub Issues](https://github.com/kizirianmax/rkmmax-hibrido/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kizirianmax/rkmmax-hibrido/discussions)

---

Thank you for contributing to Betinho! 🙏

Every contribution, no matter how small, helps make this project better.
