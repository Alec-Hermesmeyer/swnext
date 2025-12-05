# ADR-002: File Organization Structure

## Status
Accepted

## Context
The project needs a clear file organization strategy that follows CLAUDE.md guidelines while supporting Next.js conventions and maintainability. Current structure has files scattered across root directory, which violates CLAUDE.md principles.

## Decision
Implement a structured directory organization that separates concerns and follows CLAUDE.md guidelines with no files in root folder except essential configuration.

## Architecture

### Directory Structure
```
swnext/
├── src/                    # All source code (CLAUDE.md compliant)
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Basic UI elements (Button, Input, etc.)
│   │   ├── layout/        # Layout components (Header, Footer, etc.)
│   │   ├── forms/         # Form-specific components
│   │   └── animations/    # Animation components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions and helpers
│   ├── lib/               # Third-party service integrations
│   ├── types/             # TypeScript type definitions
│   └── constants/         # Application constants
├── docs/                  # Documentation (CLAUDE.md compliant)
│   ├── architecture/      # System architecture docs
│   ├── adr/              # Architecture Decision Records
│   ├── patterns/         # Design patterns and best practices
│   └── api/              # API documentation
├── config/               # Configuration files (CLAUDE.md compliant)
│   ├── eslint/           # ESLint configurations
│   ├── tailwind/         # Tailwind configurations
│   └── next/             # Next.js specific configurations
├── tests/                # All test files (CLAUDE.md compliant)
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # End-to-end tests
│   └── __mocks__/        # Mock files
├── scripts/              # Build and utility scripts
├── pages/                # Next.js pages (existing, maintain for compatibility)
├── components/           # Legacy components (to be migrated to src/)
├── public/               # Static assets
└── styles/               # Global styles
```

## Implementation Guidelines

### Component Organization
```
src/components/
├── ui/
│   ├── Button/
│   │   ├── Button.jsx
│   │   ├── Button.test.jsx
│   │   └── index.js
│   └── Card/
│       ├── Card.jsx
│       ├── Card.test.jsx
│       └── index.js
├── layout/
│   ├── Header/
│   ├── Footer/
│   └── Navigation/
└── forms/
    ├── ContactForm/
    └── NewsletterForm/
```

### File Naming Conventions
- Components: PascalCase (e.g., `Button.jsx`, `ContactForm.jsx`)
- Utilities: camelCase (e.g., `formatDate.js`, `apiClient.js`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`)
- Tests: `*.test.jsx` or `*.spec.jsx`
- Types: PascalCase with `.types.js` suffix

### Import Patterns
```jsx
// Absolute imports from src
import { Button } from '@/components/ui/Button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatDate } from '@/utils/formatDate';
```

## Migration Strategy

### Phase 1: New Development
- All new components go in `src/components/`
- All new utilities go in `src/utils/`
- All new tests go in `tests/`

### Phase 2: Legacy Migration
- Gradually move existing components from `components/` to `src/components/`
- Update import statements throughout codebase
- Maintain backward compatibility during transition

### Phase 3: Configuration Cleanup
- Move configuration files to appropriate directories
- Update build scripts and configurations
- Remove deprecated files from root

## Rationale

### Benefits
1. **CLAUDE.md Compliance**: Follows mandatory file organization rules
2. **Scalability**: Clear separation of concerns supports growth
3. **Maintainability**: Easier to locate and modify code
4. **Team Productivity**: Consistent structure reduces cognitive load
5. **Testing**: Clear test organization improves coverage

### Trade-offs
- **Migration Effort**: Requires time to move existing files
- **Import Updates**: Need to update existing import statements
- **Team Training**: Team needs to learn new structure

## Consequences

### Positive
- Cleaner, more organized codebase
- Better separation of concerns
- Easier onboarding for new developers
- Improved tooling support (IDE navigation, etc.)
- Compliance with project guidelines

### Negative
- Initial migration overhead
- Potential temporary confusion during transition
- Need to update build configurations

## Related Decisions
- ADR-001: SPARC Methodology Implementation
- ADR-003: Component Architecture Patterns
- ADR-005: TypeScript Integration Strategy

## References
- CLAUDE.md File Organization Guidelines
- Next.js Documentation
- React Component Organization Best Practices