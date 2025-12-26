# 🤝 Contributing to EduSync

Thank you for your interest in contributing to EduSync! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on collaboration
- Help others learn and grow

## 🚀 Getting Started

1. **Fork the repository**

   ```bash
   gh repo fork yourusername/edusync
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/yourusername/edusync.git
   cd edusync
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development Workflow

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Project Structure

```
app/          - Next.js pages and API routes
components/   - React components
lib/          - Utilities and services
public/       - Static assets
docs/         - Documentation
types/        - TypeScript type definitions
```

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types/interfaces
- Avoid `any` type when possible
- Use strict mode

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Follow the component structure:

  ```tsx
  // Imports
  import { useState } from "react";

  // Types
  interface Props {
    title: string;
  }

  // Component
  export default function Component({ title }: Props) {
    // Hooks
    const [state, setState] = useState();

    // Functions
    const handleClick = () => {};

    // Render
    return <div>{title}</div>;
  }
  ```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Use existing UI components from `/components/ui`
- Maintain consistent spacing and colors

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Pages: `page.tsx` (Next.js App Router)
- API routes: `route.ts`

## 📌 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
feat(auth): add password reset functionality

fix(roomsync): resolve allocation conflict detection

docs(readme): update installation instructions

refactor(issuehub): optimize question fetching logic
```

## 🔄 Pull Request Process

1. **Update your branch**

   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature
   git rebase main
   ```

2. **Test your changes**

   - Ensure the app builds: `npm run build`
   - Test functionality manually
   - Check for console errors

3. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat(scope): your message"
   ```

4. **Push to your fork**

   ```bash
   git push origin feature/your-feature
   ```

5. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Request review

### PR Checklist

- [ ] Code follows project conventions
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] No console errors or warnings
- [ ] PR description clearly explains changes
- [ ] Linked to relevant issue (if applicable)

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try the latest version
3. Gather relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce:

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**

- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check if it's already requested
2. Clearly describe the feature
3. Explain the use case
4. Provide examples if possible

## 📞 Questions?

- Open an issue with the `question` label
- Check the [documentation](docs/)
- Review existing discussions

## 🙏 Thank You!

Your contributions make EduSync better for everyone. We appreciate your time and effort!

---

**Happy Coding!** 🚀
