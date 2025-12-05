# SPARC Workflow Best Practices

## Overview

This document outlines best practices for implementing SPARC methodology in Next.js development, focusing on team collaboration, quality assurance, and efficient delivery.

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Team Collaboration](#team-collaboration)
3. [Quality Assurance](#quality-assurance)
4. [Performance Optimization](#performance-optimization)
5. [Deployment Strategy](#deployment-strategy)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Development Workflow

### SPARC Phase Gates

Each SPARC phase must pass quality gates before proceeding:

#### Phase 1: Specification Gate
**Criteria for completion:**
- [ ] Requirements documented with acceptance criteria
- [ ] User stories created with clear definitions of done
- [ ] API contracts defined and agreed upon
- [ ] Performance benchmarks established
- [ ] Security requirements documented
- [ ] Accessibility requirements specified

**Deliverables:**
```
docs/specs/
├── [feature-name]-requirements.md
├── [feature-name]-user-stories.md
├── [feature-name]-api-contract.md
└── [feature-name]-acceptance-criteria.md
```

**Claude-Flow Command:**
```bash
npx claude-flow@alpha hooks pre-task --description "Specification phase for [feature-name]"
npx claude-flow@alpha sparc run spec "[feature-name] with detailed requirements analysis"
npx claude-flow@alpha hooks post-edit --file "docs/specs/[feature-name]-requirements.md" --memory-key "sparc/spec/[feature-name]"
```

#### Phase 2: Pseudocode Gate
**Criteria for completion:**
- [ ] Algorithms designed and documented
- [ ] Data flow diagrams created
- [ ] Error handling strategies defined
- [ ] Performance considerations documented
- [ ] Logic validated by peer review

**Deliverables:**
```
docs/pseudocode/
├── [feature-name]-algorithms.md
├── [feature-name]-data-flow.md
└── [feature-name]-logic-validation.md
```

**Claude-Flow Command:**
```bash
npx claude-flow@alpha sparc run pseudocode "[feature-name] algorithm design and logic planning"
npx claude-flow@alpha hooks post-edit --file "docs/pseudocode/[feature-name]-algorithms.md" --memory-key "sparc/pseudocode/[feature-name]"
```

#### Phase 3: Architecture Gate
**Criteria for completion:**
- [ ] Component architecture designed
- [ ] Database schema created (if applicable)
- [ ] Integration points defined
- [ ] Security architecture reviewed
- [ ] Performance architecture validated
- [ ] Scalability considerations documented

**Deliverables:**
```
docs/architecture/
├── [feature-name]-component-design.md
├── [feature-name]-integration-points.md
└── [feature-name]-architecture-review.md
```

**Claude-Flow Command:**
```bash
npx claude-flow@alpha sparc run architect "[feature-name] system architecture and component design"
npx claude-flow@alpha hooks post-edit --file "docs/architecture/[feature-name]-component-design.md" --memory-key "sparc/architecture/[feature-name]"
```

#### Phase 4: Refinement Gate
**Criteria for completion:**
- [ ] All tests pass (unit, integration, accessibility)
- [ ] Code coverage meets threshold (minimum 80%)
- [ ] Performance benchmarks met
- [ ] Security scan passes
- [ ] Code review approved
- [ ] Documentation updated

**Deliverables:**
```
src/components/[feature-name]/
tests/unit/[feature-name]/
tests/integration/[feature-name]/
docs/components/[feature-name].md
```

**Claude-Flow Command:**
```bash
npx claude-flow@alpha sparc tdd "[feature-name] implementation with comprehensive testing"
npx claude-flow@alpha hooks post-edit --file "src/components/[feature-name]/index.tsx" --memory-key "sparc/implementation/[feature-name]"
```

#### Phase 5: Completion Gate
**Criteria for completion:**
- [ ] End-to-end tests pass
- [ ] Performance monitoring implemented
- [ ] Documentation complete and published
- [ ] Deployment successful
- [ ] Post-deployment validation passed
- [ ] Team training completed (if needed)

**Claude-Flow Command:**
```bash
npx claude-flow@alpha sparc run integration "[feature-name] final integration and deployment"
npx claude-flow@alpha hooks post-task --task-id "[feature-name]-sparc-completion"
```

## Team Collaboration

### Agent Coordination Pattern

Use Claude-Flow's concurrent execution model for team coordination:

```bash
# Initialize team coordination
npx claude-flow@alpha swarm_init --topology hierarchical --maxAgents 8

# Spawn specialized agents for parallel work
npx claude-flow@alpha task_orchestrate --task "Complete hero component development" --strategy adaptive --priority high
```

### Concurrent Development Strategy

**Pattern: All operations in single messages**

```javascript
// ✅ CORRECT: Parallel agent execution in one message
[Single Message - Complete Feature Development]:
  Task("Requirements Analyst", "Analyze user needs for hero component. Store findings in memory under 'hero/requirements'", "researcher")
  Task("Algorithm Designer", "Design animation and responsive logic. Check memory for requirements.", "pseudocode")
  Task("System Architect", "Design component structure and integration points. Use memory for context.", "architect")
  Task("Frontend Developer", "Implement hero component with tests. Follow memory-stored architecture.", "coder")
  Task("QA Engineer", "Create comprehensive test suite. Validate against memory-stored requirements.", "tester")
  Task("Performance Analyst", "Optimize loading and animation performance. Document in memory.", "optimizer")
  
  // All documentation in parallel
  Write "docs/specs/hero-requirements.md"
  Write "docs/architecture/hero-design.md"
  Write "src/components/Hero/Hero.tsx"
  Write "tests/unit/Hero.test.tsx"
  
  // All todos in one batch
  TodoWrite { todos: [
    {id: "1", content: "Analyze hero requirements", status: "in_progress", priority: "high"},
    {id: "2", content: "Design component architecture", status: "pending", priority: "high"},
    {id: "3", content: "Implement responsive design", status: "pending", priority: "medium"},
    {id: "4", content: "Add animation logic", status: "pending", priority: "medium"},
    {id: "5", content: "Create test suite", status: "pending", priority: "medium"},
    {id: "6", content: "Performance optimization", status: "pending", priority: "low"},
    {id: "7", content: "Accessibility testing", status: "pending", priority: "low"},
    {id: "8", content: "Documentation updates", status: "pending", priority: "low"}
  ]}
```

### Memory-Driven Coordination

Each agent must use shared memory for coordination:

```bash
# Store decisions for team access
npx claude-flow@alpha memory_usage --action store --key "hero/design-decisions" --value "responsive-grid-layout-chosen" --namespace "project"

# Retrieve context for coordination
npx claude-flow@alpha memory_usage --action retrieve --key "hero/requirements" --namespace "project"

# Share knowledge between agents
npx claude-flow@alpha daa_knowledge_share --source-agent "architect-01" --target-agents "coder-01,tester-01" --knowledge-domain "component-architecture"
```

### Code Review Process

Implement systematic code reviews using SPARC principles:

```markdown
# Code Review Checklist

## Specification Compliance
- [ ] Meets all documented requirements
- [ ] Fulfills acceptance criteria
- [ ] Addresses all user stories
- [ ] Maintains API contracts

## Pseudocode Implementation
- [ ] Logic follows documented algorithms
- [ ] Error handling implemented as designed
- [ ] Performance considerations addressed
- [ ] Edge cases handled appropriately

## Architecture Adherence
- [ ] Follows component design patterns
- [ ] Integrates properly with existing systems
- [ ] Maintains security requirements
- [ ] Supports scalability needs

## Refinement Quality
- [ ] Tests comprehensive and passing
- [ ] Code coverage meets standards
- [ ] Performance benchmarks met
- [ ] Accessibility standards followed

## Completion Readiness
- [ ] Documentation updated
- [ ] Deployment requirements met
- [ ] Monitoring implemented
- [ ] Team knowledge transferred
```

## Quality Assurance

### Automated Quality Gates

Implement automated checks at each SPARC phase:

```yaml
# .github/workflows/sparc-quality-gates.yml
name: SPARC Quality Gates

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  specification-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Requirements Documentation
        run: |
          # Check for required specification files
          test -f docs/specs/${{ github.event.head_commit.message }}-requirements.md
          test -f docs/specs/${{ github.event.head_commit.message }}-user-stories.md

  architecture-gate:
    runs-on: ubuntu-latest
    needs: specification-gate
    steps:
      - uses: actions/checkout@v3
      - name: Validate Architecture Design
        run: |
          # Check for architecture documentation
          test -f docs/architecture/${{ github.event.head_commit.message }}-design.md

  refinement-gate:
    runs-on: ubuntu-latest
    needs: architecture-gate
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test -- --coverage
      - name: Check coverage threshold
        run: npx nyc check-coverage --lines 80 --functions 80 --branches 80
      - name: Run accessibility tests
        run: npm run test:a11y
      - name: Run performance tests
        run: npm run test:perf

  completion-gate:
    runs-on: ubuntu-latest
    needs: refinement-gate
    steps:
      - uses: actions/checkout@v3
      - name: E2E Tests
        run: npm run test:e2e
      - name: Security Scan
        run: npm audit --audit-level moderate
      - name: Build Validation
        run: npm run build
```

### Testing Strategy by SPARC Phase

#### Specification Phase Testing
```typescript
// Specification-driven test definitions
describe('Hero Component Specification', () => {
  describe('Requirements Compliance', () => {
    it('should display company name prominently', () => {
      // Test specification requirement
    });
    
    it('should include call-to-action buttons', () => {
      // Test user story requirement
    });
    
    it('should be responsive across all device sizes', () => {
      // Test acceptance criteria
    });
  });
  
  describe('Performance Requirements', () => {
    it('should load within 2 seconds', async () => {
      // Test performance specification
    });
    
    it('should achieve Core Web Vitals thresholds', () => {
      // Test LCP, FID, CLS requirements
    });
  });
});
```

#### Pseudocode Phase Testing
```typescript
// Algorithm validation tests
describe('Hero Animation Logic', () => {
  describe('Fade In Algorithm', () => {
    it('should follow documented animation sequence', () => {
      // Test pseudocode implementation
    });
    
    it('should handle animation errors gracefully', () => {
      // Test error handling pseudocode
    });
  });
  
  describe('Responsive Layout Logic', () => {
    it('should apply correct layout based on screen size', () => {
      // Test responsive pseudocode
    });
  });
});
```

#### Architecture Phase Testing
```typescript
// Component architecture tests
describe('Hero Architecture', () => {
  describe('Component Structure', () => {
    it('should follow compound component pattern', () => {
      // Test architectural pattern
    });
    
    it('should integrate with layout system', () => {
      // Test integration points
    });
  });
  
  describe('Props Interface', () => {
    it('should accept all documented props', () => {
      // Test API contract
    });
    
    it('should handle optional props correctly', () => {
      // Test optional interfaces
    });
  });
});
```

#### Refinement Phase Testing
```typescript
// Implementation validation tests
describe('Hero Implementation', () => {
  describe('Rendering', () => {
    it('should render all elements correctly', () => {
      // Test actual implementation
    });
    
    it('should apply correct CSS classes', () => {
      // Test styling implementation
    });
  });
  
  describe('Interaction', () => {
    it('should handle user interactions', () => {
      // Test event handling
    });
    
    it('should update state correctly', () => {
      // Test state management
    });
  });
});
```

#### Completion Phase Testing
```typescript
// Integration and system tests
describe('Hero Integration', () => {
  describe('Page Integration', () => {
    it('should integrate with homepage layout', () => {
      // Test page-level integration
    });
    
    it('should work with navigation system', () => {
      // Test system integration
    });
  });
  
  describe('Cross-browser Compatibility', () => {
    it('should work in all supported browsers', () => {
      // Test browser compatibility
    });
  });
});
```

## Performance Optimization

### Performance Monitoring by SPARC Phase

#### Specification Phase Metrics
- Define performance budgets
- Set Core Web Vitals targets
- Establish baseline measurements

```javascript
// Performance specifications
const PERFORMANCE_BUDGETS = {
  LCP: 2500, // Largest Contentful Paint < 2.5s
  FID: 100,  // First Input Delay < 100ms
  CLS: 0.1,  // Cumulative Layout Shift < 0.1
  TTI: 3500, // Time to Interactive < 3.5s
  BUNDLE_SIZE: '250kb', // JavaScript bundle < 250kb
};
```

#### Architecture Phase Optimization
- Plan code splitting strategies
- Design efficient component hierarchies
- Plan caching strategies

```tsx
// Optimized architecture patterns
const OptimizedHero = lazy(() => 
  import('./Hero').then(module => ({ default: module.Hero }))
);

const HeroWithFallback = () => (
  <Suspense fallback={<HeroSkeleton />}>
    <OptimizedHero />
  </Suspense>
);
```

#### Refinement Phase Implementation
- Implement performance optimizations
- Add monitoring hooks
- Optimize critical rendering path

```tsx
// Performance monitoring implementation
const Hero = ({ backgroundImage, ...props }) => {
  useEffect(() => {
    // Monitor LCP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
          // Send to analytics
        }
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    return () => observer.disconnect();
  }, []);

  // Preload critical images
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = backgroundImage;
    document.head.appendChild(link);

    return () => document.head.removeChild(link);
  }, [backgroundImage]);

  // ... component implementation
};
```

### Bundle Optimization Strategy

```javascript
// next.config.js optimizations
const nextConfig = {
  // Bundle analyzer
  analyzer: {
    enabled: process.env.ANALYZE === 'true',
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            minChunks: 2,
            chunks: 'all',
            name: 'common',
          },
        },
      };
    }
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Compression
  compress: true,
  poweredByHeader: false,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

## Deployment Strategy

### SPARC-Driven Deployment Pipeline

```yaml
# .github/workflows/sparc-deployment.yml
name: SPARC Deployment Pipeline

on:
  push:
    branches: [main]

jobs:
  specification-validation:
    runs-on: ubuntu-latest
    steps:
      - name: Validate Documentation Completeness
        run: |
          # Ensure all SPARC phases documented
          find docs/specs -name "*.md" | wc -l | grep -q "[1-9]"
          find docs/architecture -name "*.md" | wc -l | grep -q "[1-9]"

  pre-deployment-tests:
    runs-on: ubuntu-latest
    needs: specification-validation
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run all test suites
        run: |
          npm run test:unit
          npm run test:integration
          npm run test:e2e
          npm run test:performance
          npm run test:accessibility

  security-scan:
    runs-on: ubuntu-latest
    needs: pre-deployment-tests
    steps:
      - name: Security Audit
        run: npm audit --audit-level high
      - name: Dependency Check
        run: npx audit-ci --high

  performance-validation:
    runs-on: ubuntu-latest
    needs: security-scan
    steps:
      - name: Lighthouse CI
        run: |
          npm run build
          npx lhci autorun
      - name: Bundle Size Check
        run: npx bundlesize

  deploy-staging:
    runs-on: ubuntu-latest
    needs: performance-validation
    steps:
      - name: Deploy to Vercel Staging
        run: npx vercel --token=${{ secrets.VERCEL_TOKEN }}

  post-deployment-validation:
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - name: Health Check
        run: curl -f ${{ secrets.STAGING_URL }}/api/health
      - name: Smoke Tests
        run: npm run test:smoke -- --base-url=${{ secrets.STAGING_URL }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: post-deployment-validation
    steps:
      - name: Deploy to Production
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Update Memory Store
        run: |
          npx claude-flow@alpha memory_usage --action store \
            --key "deployment/latest" \
            --value "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            --namespace "production"
```

### Environment Configuration

```bash
# Environment variables per SPARC phase
# Specification requirements
NEXT_PUBLIC_APP_NAME=S&W Foundation Contractors
NEXT_PUBLIC_APP_VERSION=2.0.0

# Architecture configurations
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SUPABASE_URL=https://...

# Refinement settings
NODE_ENV=production
ENABLE_ANALYTICS=true
LOG_LEVEL=info

# Completion monitoring
VERCEL_ANALYTICS_ID=analytics_...
SENTRY_DSN=https://...
```

## Monitoring and Maintenance

### SPARC-Aligned Monitoring Strategy

#### Specification Monitoring
Monitor if the deployed features meet original specifications:

```javascript
// Specification compliance monitoring
const specificationMonitor = {
  // Track requirement fulfillment
  trackRequirement: (requirementId, status) => {
    analytics.track('Specification Fulfillment', {
      requirementId,
      status,
      timestamp: new Date().toISOString()
    });
  },

  // Monitor user story completion
  trackUserStory: (storyId, completed) => {
    analytics.track('User Story Completion', {
      storyId,
      completed,
      timestamp: new Date().toISOString()
    });
  }
};
```

#### Architecture Monitoring
Monitor system architecture health:

```javascript
// Architecture health monitoring
const architectureMonitor = {
  // Component performance
  trackComponentPerformance: (componentName, metrics) => {
    analytics.track('Component Performance', {
      component: componentName,
      renderTime: metrics.renderTime,
      memoryUsage: metrics.memoryUsage,
      timestamp: new Date().toISOString()
    });
  },

  // Integration point health
  trackIntegrationHealth: (endpoint, status, responseTime) => {
    analytics.track('Integration Health', {
      endpoint,
      status,
      responseTime,
      timestamp: new Date().toISOString()
    });
  }
};
```

#### Performance Monitoring
Continuous performance monitoring aligned with SPARC goals:

```javascript
// Real User Monitoring (RUM)
const performanceMonitor = {
  // Core Web Vitals
  trackCoreWebVitals: () => {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            analytics.track('LCP', { value: entry.startTime });
            break;
          case 'first-input':
            analytics.track('FID', { value: entry.processingStart - entry.startTime });
            break;
          case 'layout-shift':
            analytics.track('CLS', { value: entry.value });
            break;
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  },

  // Custom SPARC metrics
  trackSPARCMetrics: (phase, metrics) => {
    analytics.track('SPARC Phase Performance', {
      phase,
      metrics,
      timestamp: new Date().toISOString()
    });
  }
};
```

### Maintenance Workflow

#### Regular SPARC Reviews
Schedule periodic reviews of SPARC implementation:

```markdown
# Monthly SPARC Review Checklist

## Specification Review
- [ ] Are requirements still valid?
- [ ] Have user needs changed?
- [ ] Do acceptance criteria need updates?

## Architecture Review
- [ ] Is the architecture scaling properly?
- [ ] Are integration points performing well?
- [ ] Do we need architectural improvements?

## Code Quality Review
- [ ] Is test coverage maintaining standards?
- [ ] Are performance benchmarks still met?
- [ ] Is technical debt manageable?

## Process Improvement
- [ ] Can any SPARC phases be optimized?
- [ ] Are team collaboration patterns effective?
- [ ] What lessons learned can be documented?
```

#### Continuous Improvement Process

```bash
# Automated improvement tracking
npx claude-flow@alpha memory_usage --action store \
  --key "improvements/$(date +%Y%m)" \
  --value "performance-optimization-completed" \
  --namespace "maintenance"

# Track SPARC methodology effectiveness
npx claude-flow@alpha daa_performance_metrics \
  --category "all" \
  --timeRange "30d"
```

### Documentation Maintenance

Keep SPARC documentation current:

```bash
# Regular documentation updates
npx claude-flow@alpha hooks pre-task --description "Monthly documentation review"

# Update architecture documentation
npx claude-flow@alpha hooks post-edit \
  --file "docs/architecture/SYSTEM_ARCHITECTURE.md" \
  --memory-key "maintenance/architecture-updates"

# Complete maintenance cycle
npx claude-flow@alpha hooks post-task --task-id "monthly-maintenance"
```

## Conclusion

Following these SPARC workflow best practices ensures:

1. **Quality**: Systematic approach to each development phase
2. **Efficiency**: Concurrent execution and proper coordination
3. **Maintainability**: Clear documentation and monitoring
4. **Scalability**: Architecture-driven development
5. **Team Alignment**: Shared memory and coordination patterns

Regular review and adaptation of these practices keeps the development process optimized and aligned with project goals.