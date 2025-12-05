# SPARC Development Patterns for Next.js/Tailwind

## Overview

This document outlines specific SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) development patterns tailored for the S&W Foundation Contractors Next.js/Tailwind CSS project.

## SPARC Phase Implementation

### 1. Specification Phase

#### Requirements Analysis Pattern
```markdown
## User Story Template
**As a** [user type]
**I want to** [perform action]
**So that** [achieve goal]

**Acceptance Criteria:**
- [ ] Given [context], when [action], then [expected outcome]
- [ ] Given [context], when [action], then [expected outcome]

**Technical Requirements:**
- [ ] Performance: [specific metrics]
- [ ] Accessibility: [WCAG compliance level]
- [ ] Responsive: [breakpoint requirements]
- [ ] SEO: [specific requirements]
```

#### Component Specification Template
```markdown
## Component: [ComponentName]

**Purpose:** [What this component does]

**Props Interface:**
- prop1 (required): string - Description
- prop2 (optional): boolean - Description
- children: ReactNode - Description

**Visual Requirements:**
- Mobile: [design specifications]
- Desktop: [design specifications]
- Interactive states: [hover, focus, active states]

**Accessibility Requirements:**
- ARIA labels: [requirements]
- Keyboard navigation: [tab order, shortcuts]
- Screen reader: [announcements]
```

### 2. Pseudocode Phase

#### Algorithm Design Pattern
```javascript
// Pseudocode Template for Complex Components
/*
FUNCTION ComponentName(props):
  INITIALIZE state variables
  INITIALIZE derived state
  
  DEFINE handleUserInteraction():
    VALIDATE input
    IF validation passes:
      UPDATE state
      TRIGGER side effects
      EMIT events
    ELSE:
      SHOW error state
  
  DEFINE cleanup():
    REMOVE event listeners
    CANCEL pending operations
    CLEAR timers
  
  RENDER:
    IF loading:
      SHOW loading state
    ELSE IF error:
      SHOW error state
    ELSE:
      SHOW main content with:
        - Conditional elements based on state
        - Event handlers attached
        - Accessibility attributes
        - Animation triggers
*/
```

#### Data Flow Pseudocode
```javascript
/*
DATA FLOW for [FeatureName]:

1. USER ACTION:
   - User clicks/types/selects
   - Validate input at UI level
   - Trigger state update

2. STATE MANAGEMENT:
   - Update local component state
   - OR dispatch to global state (if needed)
   - Calculate derived values

3. SIDE EFFECTS:
   - API calls (if needed)
   - Local storage updates
   - Route navigation
   - External service calls

4. UI UPDATE:
   - Re-render affected components
   - Update loading states
   - Show success/error feedback
   - Animate transitions

5. ERROR HANDLING:
   - Catch and display errors
   - Provide recovery options
   - Log for debugging
   - Maintain app stability
*/
```

### 3. Architecture Phase

#### Component Architecture Template
```jsx
// Architecture Blueprint for [ComponentName]
/*
COMPONENT ARCHITECTURE:

├── [ComponentName]/
│   ├── [ComponentName].jsx          # Main component
│   ├── [ComponentName].test.jsx     # Unit tests
│   ├── hooks/
│   │   ├── use[ComponentName].js    # Component logic
│   │   └── use[Feature].js          # Feature-specific hooks
│   ├── utils/
│   │   ├── [component]Helpers.js    # Utility functions
│   │   └── constants.js             # Component constants
│   └── index.js                     # Barrel export

DEPENDENCIES:
- Internal: [@/components, @/hooks, @/utils]
- External: [react, next, tailwind]
- Optional: [framer-motion, etc.]

PERFORMANCE CONSIDERATIONS:
- Code splitting: [when to lazy load]
- Memoization: [what to memoize]
- Bundle size: [size constraints]

TESTING STRATEGY:
- Unit tests: [specific test cases]
- Integration tests: [user workflows]
- Accessibility tests: [a11y scenarios]
*/
```

#### System Integration Pattern
```jsx
/*
INTEGRATION POINTS:

1. LAYOUT SYSTEM:
   - How component fits in layout hierarchy
   - Responsive behavior
   - Full-width section handling

2. STATE MANAGEMENT:
   - Local state requirements
   - Global state dependencies
   - Context usage

3. ROUTING:
   - Navigation integration
   - Deep linking support
   - Route protection

4. API INTEGRATION:
   - Data fetching patterns
   - Error handling
   - Loading states

5. EXTERNAL SERVICES:
   - Third-party integrations
   - Analytics tracking
   - Performance monitoring
*/
```

### 4. Refinement Phase (TDD)

#### Test-Driven Development Pattern
```javascript
// TDD Cycle for SPARC
/*
RED-GREEN-REFACTOR CYCLE:

1. RED (Write Failing Test):
   - Write test for smallest unit of functionality
   - Ensure test fails for right reason
   - Focus on behavior, not implementation

2. GREEN (Make Test Pass):
   - Write minimal code to pass test
   - Don't worry about perfection
   - Focus on functionality first

3. REFACTOR (Improve Code):
   - Clean up implementation
   - Extract common patterns
   - Optimize performance
   - Maintain passing tests
*/
```

#### Testing Pattern Templates
```jsx
// Unit Test Template
describe('[ComponentName]', () => {
  // Setup
  const defaultProps = {
    // minimal props needed
  };

  // Rendering tests
  describe('Rendering', () => {
    it('renders with required props', () => {
      render(<ComponentName {...defaultProps} />);
      expect(screen.getByRole('...')).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('User Interactions', () => {
    it('handles [specific interaction]', async () => {
      const user = userEvent.setup();
      const mockHandler = jest.fn();
      
      render(<ComponentName {...defaultProps} onAction={mockHandler} />);
      
      await user.click(screen.getByRole('button'));
      expect(mockHandler).toHaveBeenCalledWith(expectedArgs);
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles empty state', () => {
      render(<ComponentName {...defaultProps} data={[]} />);
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });
});
```

#### Integration Test Pattern
```jsx
// Integration Test Template
describe('[FeatureName] Integration', () => {
  it('completes full user workflow', async () => {
    const user = userEvent.setup();
    
    // Setup
    render(<App />);
    
    // User journey
    await user.click(screen.getByText('Start'));
    await user.type(screen.getByLabelText('Input'), 'test data');
    await user.click(screen.getByText('Submit'));
    
    // Assertions
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(mockApiCall).toHaveBeenCalledWith(expectedData);
  });
});
```

### 5. Completion Phase

#### Integration Checklist
```markdown
## Completion Checklist for [FeatureName]

### Code Quality
- [ ] All tests passing (unit + integration)
- [ ] Code review completed
- [ ] No console errors or warnings
- [ ] Performance benchmarks met
- [ ] Accessibility requirements satisfied

### Documentation
- [ ] Component documentation updated
- [ ] API documentation updated
- [ ] Usage examples provided
- [ ] Migration guide (if applicable)

### Deployment
- [ ] Feature flags configured (if applicable)
- [ ] Environment variables set
- [ ] Build process validated
- [ ] Staging deployment tested

### Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Analytics tracking verified
- [ ] User feedback collection ready
```

## SPARC Command Usage

### Development Workflow Commands
```bash
# Complete TDD workflow for new feature
npx claude-flow sparc tdd "Contact form with validation"

# Individual phase execution
npx claude-flow sparc run spec-pseudocode "User authentication"
npx claude-flow sparc run architect "Component library structure"
npx claude-flow sparc run refinement "Form validation logic"

# Batch execution for complex features
npx claude-flow sparc batch "spec-pseudocode,architect" "E-commerce checkout flow"

# Full pipeline for major features
npx claude-flow sparc pipeline "Multi-step form with payment processing"
```

### Agent Coordination with Claude Code
```javascript
// Use Claude Code's Task tool for SPARC agent execution
[Single Message - SPARC Development]:
  // Specification agent
  Task("Requirements analyst", "Analyze user stories for checkout process. Document specs in /docs/patterns/", "specification")
  
  // Pseudocode agent  
  Task("Algorithm designer", "Create pseudocode for payment flow. Use SPARC patterns.", "pseudocode")
  
  // Architecture agent
  Task("System architect", "Design component architecture. Follow ADR patterns.", "architecture")
  
  // Refinement agents (TDD)
  Task("Test engineer", "Write failing tests first. Follow TDD cycle.", "tester")
  Task("Developer", "Implement to pass tests. Follow component patterns.", "coder")
  
  // Completion agent
  Task("Integration specialist", "Verify completion checklist. Deploy to staging.", "integration")

  // Batch all todos
  TodoWrite { todos: [
    // 8-10 specific todos for SPARC phases
  ]}
```

## Best Practices

### SPARC Phase Transitions
1. **Complete each phase** before moving to next
2. **Document decisions** at each phase
3. **Review with team** before implementation
4. **Update tests** as requirements change
5. **Maintain artifacts** for future reference

### Quality Gates
- **Specification**: All requirements clear and testable
- **Pseudocode**: Logic validated by domain experts
- **Architecture**: Design reviewed and approved
- **Refinement**: All tests passing and code reviewed
- **Completion**: Production-ready and monitored

### Continuous Improvement
- **Retrospectives**: After each SPARC cycle
- **Pattern Updates**: Refine patterns based on learnings
- **Tool Enhancement**: Improve development tools
- **Knowledge Sharing**: Document lessons learned