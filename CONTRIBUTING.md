# Contributing to Study Planner

Thank you for your interest in contributing to Study Planner! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git
- Appwrite account (for testing)

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/study-planner.git
   cd study-planner
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Appwrite**
   - Follow [QUICKSTART.md](./QUICKSTART.md)
   - Create development project
   - Configure `src/lib/appwrite.ts`

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Project Structure

```
src/
├── app/
│   ├── components/ui/      # Reusable UI components
│   └── App.tsx             # Main application
├── components/             # Feature components
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── TasksManager.tsx
│   ├── SubjectsManager.tsx
│   ├── ExamsManager.tsx
│   └── PomodoroTimer.tsx
├── contexts/               # React contexts
│   └── AuthContext.tsx
├── services/              # API services
│   ├── authService.ts
│   └── databaseService.ts
├── lib/                   # Configuration
│   └── appwrite.ts
└── utils/                 # Utility functions
    ├── notifications.ts
    └── dateHelpers.ts
```

## Development Guidelines

### Code Style

#### TypeScript
- Use TypeScript for all new files
- Define interfaces for all data structures
- Avoid `any` types - use proper typing
- Use meaningful variable names

```typescript
// Good
interface Task {
  $id?: string;
  userId: string;
  title: string;
  status: 'pending' | 'completed';
}

// Avoid
const data: any = ...;
```

#### React Components
- Use functional components
- Use hooks for state management
- Keep components focused and small
- Extract reusable logic to custom hooks

```typescript
// Good - Focused component
const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const handleComplete = () => {
    // Logic here
  };
  
  return (
    <div>
      {task.title}
    </div>
  );
};
```

#### Styling
- Use Tailwind CSS classes
- Follow existing patterns
- Use design system colors
- Maintain responsive design

```typescript
// Good
<div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent">
  {content}
</div>

// Avoid inline styles
<div style={{ padding: '16px' }}>
  {content}
</div>
```

### File Organization

- **Components**: `src/components/`
- **UI Components**: `src/app/components/ui/`
- **Services**: `src/services/`
- **Utils**: `src/utils/`
- **Types**: Define in same file or `src/types/`

### Naming Conventions

- **Files**: PascalCase for components (`TasksManager.tsx`)
- **Components**: PascalCase (`TasksManager`)
- **Functions**: camelCase (`handleCreateTask`)
- **Constants**: UPPER_SNAKE_CASE (`FOCUS_TIME`)
- **Types/Interfaces**: PascalCase (`Task`, `PomodoroSession`)

## Types of Contributions

### 🐛 Bug Fixes

1. Check existing issues first
2. Create issue if not exists
3. Reference issue in PR
4. Include steps to reproduce
5. Add fix with tests if possible

**Example PR title**: `fix: Task completion toggle not working on mobile`

### ✨ New Features

1. Discuss in issue first
2. Get approval from maintainers
3. Follow existing patterns
4. Update documentation
5. Add tests if applicable

**Example PR title**: `feat: Add study goal setting feature`

### 📝 Documentation

1. Fix typos and errors
2. Improve clarity
3. Add examples
4. Update outdated info

**Example PR title**: `docs: Update Appwrite setup guide with screenshots`

### 🎨 UI/UX Improvements

1. Maintain consistency
2. Follow design system
3. Ensure accessibility
4. Test on multiple devices

**Example PR title**: `ui: Improve dashboard card layout on mobile`

## Pull Request Process

### Before Submitting

1. **Test your changes**
   ```bash
   pnpm dev
   # Test in browser
   ```

2. **Check for errors**
   ```bash
   # Build to check for TypeScript errors
   pnpm build
   ```

3. **Format code** (if formatter is set up)
   ```bash
   pnpm format
   ```

4. **Update documentation** if needed

### Submitting PR

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add new feature description"
   ```

   Use conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `style:` Formatting
   - `refactor:` Code restructuring
   - `test:` Tests
   - `chore:` Maintenance

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill out template
   - Link related issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] UI/UX improvement

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] No console errors
```

### Review Process

1. Maintainer reviews PR
2. Address feedback
3. Push updates
4. Get approval
5. PR merged!

## Feature Development Guidelines

### Adding a New Component

1. Create component file in `src/components/`
2. Import necessary dependencies
3. Define TypeScript interfaces
4. Implement component
5. Add to navigation if needed

**Example**:
```typescript
// src/components/StudyGoals.tsx
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../app/components/ui/card';

interface StudyGoal {
  $id?: string;
  userId: string;
  title: string;
  targetDate: string;
}

export const StudyGoals: React.FC = () => {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Study Goals</h1>
      {/* Component content */}
    </div>
  );
};
```

### Adding Database Service Methods

1. Define interface in `src/services/databaseService.ts`
2. Add CRUD methods
3. Use proper error handling
4. Follow existing patterns

**Example**:
```typescript
// Add to databaseService.ts
async createGoal(goal: Omit<StudyGoal, '$id'>): Promise<StudyGoal> {
  try {
    return await databases.createDocument(
      databaseId,
      'goals', // Collection ID
      ID.unique(),
      goal
    );
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
}
```

### Adding Appwrite Collection

1. Go to Appwrite Console
2. Create collection
3. Add attributes
4. Set permissions
5. Create indexes
6. Update `appwriteConfig` in `src/lib/appwrite.ts`
7. Document in `APPWRITE_SETUP.md`

## Testing

### Manual Testing

1. **Functionality**
   - Test all user flows
   - Check edge cases
   - Verify error handling

2. **UI/UX**
   - Test on different screen sizes
   - Check mobile responsiveness
   - Verify dark mode

3. **Performance**
   - Check load times
   - Monitor console for errors
   - Test with large datasets

### Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing

Test on:
- iOS Safari
- Android Chrome
- Different screen sizes

## Common Tasks

### Adding a New Page

1. Create component in `src/components/`
2. Add to navigation in `App.tsx`
3. Update `Page` type
4. Add navigation item

```typescript
// In App.tsx
type Page = 'dashboard' | 'tasks' | 'subjects' | 'exams' | 'pomodoro' | 'goals';

const navItems = [
  // ... existing items
  { id: 'goals' as Page, label: 'Goals', icon: Target },
];

{currentPage === 'goals' && <StudyGoals />}
```

### Adding a UI Component

1. Check if shadcn/ui has it
2. If yes, install via CLI
3. If no, create in `src/app/components/ui/`
4. Follow existing patterns

### Updating Appwrite Config

```typescript
// src/lib/appwrite.ts
export const appwriteConfig = {
  // ... existing config
  newCollectionId: 'collection-name',
};
```

## Documentation

### Code Comments

- Add comments for complex logic
- Explain "why", not "what"
- Keep comments up to date

```typescript
// Good
// Calculate streak by checking consecutive days with completed tasks
const calculateStreak = () => { ... };

// Unnecessary
// This function adds two numbers
const add = (a, b) => a + b;
```

### README Updates

When adding features:
1. Update feature list
2. Add usage examples
3. Update screenshots if needed

### API Documentation

Document service methods:
```typescript
/**
 * Creates a new study goal
 * @param goal - Goal data without ID
 * @returns Promise<StudyGoal> - Created goal with ID
 * @throws Error if creation fails
 */
async createGoal(goal: Omit<StudyGoal, '$id'>): Promise<StudyGoal>
```

## Debugging

### Common Issues

**"Collection not found"**
- Check collection ID spelling
- Verify collection exists in Appwrite
- Check database ID is correct

**"Permission denied"**
- Check Appwrite permissions
- Verify user is authenticated
- Check collection permissions

**"Network error"**
- Check Appwrite endpoint
- Verify internet connection
- Check CORS settings

### Debug Tools

- Browser DevTools (F12)
- React DevTools extension
- Appwrite Console logs
- Network tab for API calls

## Performance Guidelines

### Optimize Queries

```typescript
// Good - Use filters and limits
const tasks = await databases.listDocuments(
  databaseId,
  'tasks',
  [
    Query.equal('userId', userId),
    Query.limit(100)
  ]
);

// Avoid - Fetching all data
const tasks = await databases.listDocuments(databaseId, 'tasks');
```

### Minimize Re-renders

```typescript
// Good - Memoize callbacks
const handleClick = useCallback(() => {
  // Logic
}, [dependencies]);

// Good - Memoize components
const MemoizedComponent = React.memo(Component);
```

### Lazy Loading

```typescript
// Load heavy components lazily
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## Security Checklist

- [ ] No API keys in frontend code
- [ ] User input is validated
- [ ] Queries use proper filters
- [ ] Permissions set correctly
- [ ] HTTPS in production
- [ ] No sensitive data in logs

## Getting Help

- **Documentation**: Read all `.md` files
- **Issues**: Search existing issues
- **Discussion**: Start a GitHub discussion
- **Discord**: Join Appwrite Discord

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

## Questions?

Feel free to:
- Open an issue
- Start a discussion
- Ask in PR comments

Thank you for contributing! 🎉
