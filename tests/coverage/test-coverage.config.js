/**
 * Test Coverage Configuration and Quality Gates
 * Defines coverage thresholds and quality metrics
 */

module.exports = {
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for critical files
    './components/NavTailwind.jsx': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './pages/api/*.js': {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    './pages/index.jsx': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'pages/**/*.{js,jsx}',
    'utils/**/*.{js,jsx}',
    'lib/**/*.{js,jsx}',
    '!pages/_app.js',
    '!pages/_document.js',
    '!pages/api/hello.js', // Example API route
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/tests/**',
    '!coverage/**',
    '!.next/**',
  ],

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'json',
    'lcov',
    'cobertura', // For CI/CD integration
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Quality gates configuration
  qualityGates: {
    // Minimum coverage required to pass
    minimumCoverage: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },

    // Maximum allowed coverage decrease
    coverageDecreaseThreshold: 2, // 2%

    // Files that must have 100% coverage
    criticalFiles: [
      'pages/api/job-postings.js',
      'components/withAuth.js',
    ],

    // Files that can have lower coverage temporarily
    exemptFiles: [
      'pages/api/hello.js',
      'components/scratch.jsx',
    ],

    // Test quality requirements
    testQuality: {
      minimumTestFiles: 10,
      minimumAssertsPerTest: 1,
      maximumSkippedTests: 5,
      maximumTodoTests: 3,
    },
  },

  // Performance thresholds for tests
  performanceThresholds: {
    maxTestDuration: 30000, // 30 seconds
    maxSlowTests: 5,
    slowTestThreshold: 5000, // 5 seconds
  },

  // Security testing requirements
  securityRequirements: {
    inputSanitizationTests: true,
    authenticationTests: true,
    authorizationTests: true,
    sqlInjectionTests: true,
    xssProtectionTests: true,
    csrfProtectionTests: true,
  },

  // Integration testing requirements
  integrationTestRequirements: {
    apiEndpointCoverage: 90, // % of API endpoints tested
    databaseIntegrationTests: true,
    externalServiceMocking: true,
    errorHandlingTests: true,
  },

  // E2E testing requirements
  e2eTestRequirements: {
    criticalUserJourneys: [
      'Homepage Navigation',
      'Contact Form Submission',
      'Job Application Process',
      'Admin Authentication',
    ],
    crossBrowserTesting: ['Chrome', 'Firefox', 'Safari'],
    mobileResponsiveTests: true,
    accessibilityTests: true,
    performanceTests: true,
  },

  // Code quality metrics
  codeQualityMetrics: {
    maxCyclomaticComplexity: 10,
    maxFunctionLength: 50,
    maxFileLength: 500,
    duplicateCodeThreshold: 5, // %
    maintainabilityIndex: 60,
  },

  // Test organization requirements
  testOrganization: {
    testFileNaming: /\.test\.(js|jsx|ts|tsx)$/,
    testDirectory: 'tests',
    mockFileNaming: /__mocks__/,
    fixtureFileNaming: /fixtures/,
    testCategoryStructure: [
      'unit',
      'integration',
      'e2e',
      'performance',
      'security',
      'visual',
    ],
  },

  // CI/CD integration settings
  cicdIntegration: {
    failOnCoverageDecrease: true,
    generateCoverageBadge: true,
    publishCoverageReports: true,
    notifyOnFailure: true,
    blockMergeOnFailure: true,
  },

  // Custom matchers and utilities
  customMatchers: {
    toBeAccessible: 'Custom accessibility matcher',
    toHavePerformantRender: 'Custom performance matcher',
    toBeSecure: 'Custom security matcher',
    toFollowSPARCPattern: 'Custom SPARC methodology matcher',
  },

  // Test data management
  testDataManagement: {
    fixtureDirectory: 'tests/fixtures',
    mockDataDirectory: 'tests/__mocks__',
    testDatabaseSeeds: 'tests/seeds',
    cleanupAfterTests: true,
    isolateTestData: true,
  },

  // Reporting configuration
  reporting: {
    generateTrendReports: true,
    historicalCoverageTracking: true,
    testExecutionReports: true,
    performanceReports: true,
    securityReports: true,
    qualityReports: true,
  },

  // Environment-specific settings
  environments: {
    development: {
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
      verbose: true,
      collectCoverage: true,
    },
    ci: {
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
      verbose: false,
      collectCoverage: true,
      coverageReporters: ['text', 'cobertura', 'json'],
    },
    production: {
      // No tests run in production, but config available for analysis
      collectCoverage: false,
      coverageThreshold: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
}

// Export coverage validation functions
const validateCoverage = (coverageResults) => {
  const { global } = coverageResults
  const thresholds = module.exports.coverageThreshold.global

  const failures = []

  if (global.statements < thresholds.statements) {
    failures.push(`Statement coverage ${global.statements}% below threshold ${thresholds.statements}%`)
  }
  if (global.branches < thresholds.branches) {
    failures.push(`Branch coverage ${global.branches}% below threshold ${thresholds.branches}%`)
  }
  if (global.functions < thresholds.functions) {
    failures.push(`Function coverage ${global.functions}% below threshold ${thresholds.functions}%`)
  }
  if (global.lines < thresholds.lines) {
    failures.push(`Line coverage ${global.lines}% below threshold ${thresholds.lines}%`)
  }

  return {
    passed: failures.length === 0,
    failures,
    coverageResults: global,
  }
}

const generateCoverageReport = (coverageResults) => {
  const validation = validateCoverage(coverageResults)
  
  return {
    timestamp: new Date().toISOString(),
    status: validation.passed ? 'PASSED' : 'FAILED',
    summary: {
      statements: coverageResults.global.statements,
      branches: coverageResults.global.branches,
      functions: coverageResults.global.functions,
      lines: coverageResults.global.lines,
    },
    thresholds: module.exports.coverageThreshold.global,
    failures: validation.failures,
    recommendations: generateRecommendations(coverageResults),
  }
}

const generateRecommendations = (coverageResults) => {
  const recommendations = []
  const { global } = coverageResults

  if (global.branches < 80) {
    recommendations.push('Focus on testing different code paths and conditional logic')
  }
  if (global.functions < 85) {
    recommendations.push('Ensure all functions have corresponding tests')
  }
  if (global.statements < 85) {
    recommendations.push('Add tests for untested code statements')
  }
  if (global.lines < 85) {
    recommendations.push('Improve test coverage for uncovered lines')
  }

  return recommendations
}

module.exports.validateCoverage = validateCoverage
module.exports.generateCoverageReport = generateCoverageReport