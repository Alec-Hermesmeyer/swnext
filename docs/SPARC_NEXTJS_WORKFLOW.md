# SPARC Methodology for Next.js Development

## Overview

This document provides comprehensive guidance for implementing the SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology in Next.js projects, specifically tailored for the S&W Foundation Contractors application.

## Table of Contents

1. [SPARC Phase Overview](#sparc-phase-overview)
2. [Next.js Integration](#nextjs-integration)
3. [Claude-Flow Integration](#claude-flow-integration)
4. [Workflow Commands](#workflow-commands)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

## SPARC Phase Overview

### Phase 1: Specification
**Purpose**: Define requirements, user stories, and acceptance criteria
**Duration**: 15-20% of total development time
**Output**: Requirements documentation, user stories, API contracts

#### Activities
- Analyze business requirements
- Create user stories with acceptance criteria
- Define API endpoints and data structures
- Establish performance and security requirements
- Document component specifications

#### Next.js Specific Considerations
- Define page routes and navigation structure
- Specify dynamic routing patterns
- Document SSG vs SSR requirements
- Define API routes and their purposes
- Establish SEO requirements and meta data structure

### Phase 2: Pseudocode
**Purpose**: Design algorithms and logic flow without implementation details
**Duration**: 10-15% of total development time
**Output**: Algorithm designs, data flow diagrams, logic structures

#### Activities
- Design component logic flow
- Plan state management patterns
- Define data transformation logic
- Create algorithm pseudocode for complex operations
- Plan error handling strategies

#### Next.js Specific Considerations
- Plan getServerSideProps/getStaticProps logic
- Design component lifecycle and state transitions
- Define routing logic and navigation flows
- Plan API route handlers and middleware
- Design image optimization and loading strategies

### Phase 3: Architecture
**Purpose**: Design system structure, components, and relationships
**Duration**: 20-25% of total development time
**Output**: Architecture diagrams, component hierarchy, database schema

#### Activities
- Design component architecture
- Plan directory structure
- Define component interfaces and props
- Create database schema
- Plan integration points

#### Next.js Specific Considerations
- Design page layout patterns using getLayout
- Plan component hierarchy and composition
- Define Tailwind CSS architecture and utility patterns
- Design API route structure and middleware chain
- Plan static asset optimization strategy

### Phase 4: Refinement
**Purpose**: Implement features using test-driven development
**Duration**: 40-45% of total development time
**Output**: Implemented components, tests, working features

#### Activities
- Write failing tests first
- Implement minimum viable functionality
- Refactor for quality and performance
- Add comprehensive error handling
- Optimize for performance

#### Next.js Specific Considerations
- Implement page components with proper SSG/SSR
- Create reusable UI components with Tailwind CSS
- Implement API routes with proper validation
- Add image optimization and lazy loading
- Implement responsive design patterns

### Phase 5: Completion
**Purpose**: Integrate, test, and deploy complete features
**Duration**: 10-15% of total development time
**Output**: Deployed features, documentation, monitoring

#### Activities
- Integration testing across components
- End-to-end testing
- Performance optimization
- Security testing
- Deployment and monitoring setup

#### Next.js Specific Considerations
- Test dynamic routing and SSG/SSR behavior
- Verify image optimization and loading performance
- Test API route security and validation
- Verify SEO meta tags and structured data
- Test responsive design across devices

## Next.js Integration

### Project Structure (CLAUDE.md Compliant)

```
swnext/
├── docs/                  # Documentation (CLAUDE.md compliant)
│   ├── sparc/            # SPARC methodology documentation
│   ├── api/              # API documentation
│   ├── components/       # Component documentation
│   └── workflows/        # Development workflows
├── src/                  # Source code (CLAUDE.md compliant)
│   ├── components/       # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── lib/             # Third-party integrations
│   └── types/           # TypeScript definitions
├── tests/               # Test files (CLAUDE.md compliant)
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── config/              # Configuration (CLAUDE.md compliant)
│   ├── tailwind/       # Tailwind configurations
│   └── next/           # Next.js configurations
├── pages/               # Next.js pages (existing structure)
├── components/          # Legacy components (to be migrated)
└── public/             # Static assets
```

### SPARC-Driven Component Development

#### Example: Hero Component Development

**Phase 1: Specification**
```markdown
## Hero Component Specification

### Requirements
- Display company name and tagline
- Include background image with overlay
- Responsive design for mobile/desktop
- Call-to-action buttons
- Contact information card
- Animation on page load

### User Stories
- As a visitor, I want to immediately understand the company's services
- As a visitor, I want easy access to contact information
- As a visitor, I want clear navigation to key pages

### Acceptance Criteria
- Hero loads within 2 seconds
- Images are optimized and responsive
- CTA buttons are clearly visible
- Contact info is easily readable
- Animations enhance user experience without distraction
```

**Phase 2: Pseudocode**
```
HERO COMPONENT ALGORITHM:
1. INITIALIZE component with props
2. LOAD background image with optimization
3. RENDER overlay with opacity animation
4. DISPLAY company branding with fade-in animation
5. RENDER contact information card
6. ADD call-to-action buttons with hover effects
7. IMPLEMENT responsive layout adjustments
8. HANDLE loading states and error conditions
```

**Phase 3: Architecture**
```jsx
// Component Architecture Design
const Hero = ({ 
  backgroundImage, 
  title, 
  subtitle, 
  contactInfo, 
  ctaButtons 
}) => {
  // State management
  // Animation logic
  // Responsive layout
  // Error handling
};

// Props interface
interface HeroProps {
  backgroundImage: string;
  title: string;
  subtitle: string;
  contactInfo: ContactInfo;
  ctaButtons: CTAButton[];
}
```

**Phase 4: Refinement**
```jsx
// Implementation with TDD
import { render, screen } from '@testing-library/react';
import Hero from '../Hero';

describe('Hero Component', () => {
  it('renders company title correctly', () => {
    render(<Hero title="S&W Foundation" />);
    expect(screen.getByRole('heading')).toHaveTextContent('S&W Foundation');
  });
  
  // More tests...
});
```

**Phase 5: Completion**
- Integration with layout components
- Performance optimization
- Accessibility testing
- Cross-browser compatibility
- Documentation updates

## Claude-Flow Integration

### Swarm Initialization for SPARC Workflow

```bash
# Initialize SPARC development swarm
npx claude-flow@alpha mcp__claude-flow__swarm_init --topology hierarchical --maxAgents 8

# Spawn specialized agents for each SPARC phase
npx claude-flow@alpha mcp__claude-flow__agent_spawn --type specification
npx claude-flow@alpha mcp__claude-flow__agent_spawn --type pseudocode
npx claude-flow@alpha mcp__claude-flow__agent_spawn --type architect
npx claude-flow@alpha mcp__claude-flow__agent_spawn --type coder
npx claude-flow@alpha mcp__claude-flow__agent_spawn --type tester
```

### Agent Coordination Hooks

Every agent must implement coordination hooks:

```bash
# Pre-task initialization
npx claude-flow@alpha hooks pre-task --description "Hero component development"

# During development
npx claude-flow@alpha hooks post-edit --file "components/Hero.jsx" --memory-key "sparc/hero/implementation"

# Phase completion notification
npx claude-flow@alpha hooks notify --message "Specification phase completed for Hero component"

# Task completion
npx claude-flow@alpha hooks post-task --task-id "hero-component-sparc"
```

## Workflow Commands

### Complete SPARC Workflow
```bash
# Full SPARC TDD workflow for a new feature
npx claude-flow@alpha sparc tdd "Hero component with responsive design and animations"
```

### Individual Phase Commands
```bash
# Specification phase
npx claude-flow@alpha sparc run spec-pseudocode "Contact form component"

# Architecture phase
npx claude-flow@alpha sparc run architect "Navigation system with mobile responsiveness"

# Refinement phase (TDD implementation)
npx claude-flow@alpha sparc run refine "Image gallery with lazy loading"

# Integration phase
npx claude-flow@alpha sparc run integration "Complete landing page assembly"
```

### Batch Processing
```bash
# Process multiple components in parallel
npx claude-flow@alpha sparc batch "spec,architect,refine" "Footer component with SEO links"

# Pipeline processing for complex features
npx claude-flow@alpha sparc pipeline "E-commerce product catalog with filtering"
```

## Best Practices

### 1. File Organization
- **Always** organize files according to CLAUDE.md guidelines
- **Never** save working files to root directory
- Use proper directory structure for each SPARC phase output

### 2. Concurrent Development
- Batch all related operations in single messages
- Use TodoWrite for tracking multiple tasks simultaneously
- Coordinate agent activities through memory system

### 3. Next.js Specific Practices

#### Component Development
```jsx
// ✅ Good: Follows SPARC architecture principles
const ServiceCard = ({ title, description, image, href }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Clear specification-driven implementation
  // Proper error handling
  // Performance optimization
  // Accessibility considerations
};

// ❌ Avoid: Ad-hoc implementation without SPARC phases
const ServiceCard = ({ data }) => {
  // Unclear requirements and architecture
  // No error handling
  // Performance concerns
};
```

#### API Route Development
```javascript
// ✅ Good: SPARC-driven API design
export default async function handler(req, res) {
  // Specification: Clear input/output contract
  // Pseudocode: Logical flow documented
  // Architecture: Proper middleware chain
  // Refinement: TDD implementation
  // Completion: Error handling and monitoring
}
```

### 4. Testing Strategy
- Write tests during Specification phase (acceptance criteria)
- Implement failing tests during Refinement phase
- Integration tests during Completion phase

### 5. Documentation
- Each SPARC phase produces documentation
- Update docs immediately after phase completion
- Use hooks to track documentation updates

## Examples

### Example 1: Contact Form Development

**Command to start SPARC workflow:**
```bash
npx claude-flow@alpha sparc tdd "Contact form with validation and email integration"
```

**Expected phases:**
1. **Specification**: Form fields, validation rules, email service integration
2. **Pseudocode**: Form submission logic, validation algorithms, error handling
3. **Architecture**: Component structure, API routes, database integration
4. **Refinement**: TDD implementation with React Hook Form and validation
5. **Completion**: Email service integration, error handling, testing

### Example 2: Image Gallery Component

**Command to start architecture-focused development:**
```bash
npx claude-flow@alpha sparc run architect "Responsive image gallery with lazy loading"
```

**Architecture considerations:**
- Next.js Image component optimization
- Tailwind CSS responsive grid patterns
- Lazy loading implementation
- Modal overlay for full-size images
- Performance optimization strategies

### Example 3: Blog System Implementation

**Command for complete system development:**
```bash
npx claude-flow@alpha sparc pipeline "Blog system with markdown rendering and SEO optimization"
```

**Pipeline includes:**
- Requirements analysis and content strategy
- Markdown processing and rendering logic
- Component architecture with layouts
- API routes for blog post management
- SEO optimization and meta tag management
- Performance optimization and caching

## Integration with Existing Codebase

### Migration Strategy
1. **Assessment**: Audit existing components for SPARC compliance
2. **Documentation**: Create specification docs for existing components
3. **Refactoring**: Apply SPARC principles to legacy components
4. **Testing**: Add comprehensive test coverage
5. **Optimization**: Performance and accessibility improvements

### Legacy Component Handling
```jsx
// Before: Legacy component without SPARC
const OldComponent = () => {
  // Unclear requirements
  // No error handling
  // Performance issues
};

// After: SPARC-compliant refactoring
const NewComponent = (props) => {
  // Clear specification-driven design
  // Proper architecture and error handling
  // Performance optimized
  // Comprehensive testing
};
```

## Monitoring and Metrics

### SPARC Phase Metrics
- Time spent in each phase
- Code quality metrics per phase
- Test coverage by phase
- Performance benchmarks

### Success Indicators
- Reduced debugging time
- Improved code maintainability
- Better test coverage
- Faster feature delivery
- Reduced technical debt

## Conclusion

The SPARC methodology provides a systematic approach to Next.js development that ensures quality, maintainability, and performance. By following these guidelines and integrating with Claude-Flow, teams can achieve consistent, high-quality results while maintaining development velocity.

For questions or improvements to this workflow, please refer to the project's ADR documentation and contribute to the continuous improvement process.