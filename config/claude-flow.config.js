/**
 * Claude Flow Configuration
 * Central configuration for agent coordination, workflows, and execution patterns
 */

export const claudeFlowConfig = {
  // Core System Configuration
  system: {
    topology: 'mesh',
    maxAgents: 54,
    coordination: 'adaptive',
    memoryEnabled: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    autoScale: true,
    selfHealing: true
  },

  // Agent Configuration
  agents: {
    // Core Development Agents
    core: [
      { type: 'coder', maxInstances: 8, priority: 'high' },
      { type: 'reviewer', maxInstances: 4, priority: 'medium' },
      { type: 'tester', maxInstances: 6, priority: 'high' },
      { type: 'planner', maxInstances: 2, priority: 'medium' },
      { type: 'researcher', maxInstances: 3, priority: 'low' }
    ],

    // Coordination Agents
    coordination: [
      { type: 'task-orchestrator', maxInstances: 1, priority: 'critical' },
      { type: 'hierarchical-coordinator', maxInstances: 1, priority: 'high' },
      { type: 'mesh-coordinator', maxInstances: 1, priority: 'high' },
      { type: 'adaptive-coordinator', maxInstances: 1, priority: 'medium' },
      { type: 'swarm-memory-manager', maxInstances: 1, priority: 'critical' }
    ],

    // Specialized Development Agents
    specialized: [
      { type: 'backend-dev', maxInstances: 4, priority: 'high' },
      { type: 'mobile-dev', maxInstances: 2, priority: 'medium' },
      { type: 'ml-developer', maxInstances: 1, priority: 'low' },
      { type: 'system-architect', maxInstances: 2, priority: 'medium' },
      { type: 'api-docs', maxInstances: 2, priority: 'low' }
    ],

    // Performance & Monitoring
    performance: [
      { type: 'perf-analyzer', maxInstances: 2, priority: 'medium' },
      { type: 'performance-benchmarker', maxInstances: 1, priority: 'medium' },
      { type: 'memory-coordinator', maxInstances: 1, priority: 'high' }
    ],

    // GitHub Integration
    github: [
      { type: 'pr-manager', maxInstances: 2, priority: 'medium' },
      { type: 'code-review-swarm', maxInstances: 1, priority: 'medium' },
      { type: 'issue-tracker', maxInstances: 1, priority: 'low' },
      { type: 'release-manager', maxInstances: 1, priority: 'low' }
    ],

    // SPARC Methodology
    sparc: [
      { type: 'specification', maxInstances: 2, priority: 'high' },
      { type: 'pseudocode', maxInstances: 2, priority: 'high' },
      { type: 'architecture', maxInstances: 2, priority: 'high' },
      { type: 'refinement', maxInstances: 2, priority: 'medium' }
    ]
  },

  // Execution Patterns
  execution: {
    // Batch Processing
    batch: {
      defaultSize: 5,
      maxConcurrency: 10,
      timeoutMs: 300000, // 5 minutes
      retryAttempts: 3,
      retryDelayMs: 1000
    },

    // Parallel Execution
    parallel: {
      maxConcurrentTasks: 20,
      resourceThrottling: true,
      loadBalancing: true,
      failureTolerance: 0.1 // 10% failure tolerance
    },

    // Sequential Execution
    sequential: {
      dependencyResolution: true,
      circularDependencyCheck: true,
      progressTracking: true
    },

    // Adaptive Execution
    adaptive: {
      complexityThreshold: 0.7,
      systemLoadThreshold: 0.8,
      dynamicResourceAllocation: true,
      performanceFeedback: true
    }
  },

  // Memory Management
  memory: {
    enabled: true,
    persistToDisk: true,
    compressionEnabled: true,
    ttlDefault: 24 * 60 * 60 * 1000, // 24 hours
    maxEntriesPerNamespace: 10000,
    namespaces: [
      'tasks',
      'agents',
      'sessions',
      'hooks',
      'metrics',
      'neural',
      'github',
      'sparc'
    ],
    backup: {
      enabled: true,
      intervalMs: 60 * 60 * 1000, // 1 hour
      maxBackups: 24
    }
  },

  // Hook System Configuration
  hooks: {
    enabled: true,
    globalHooks: true,
    agentHooks: true,
    performanceTracking: true,
    errorHandling: true,
    
    // Pre/Post Task Hooks
    preTask: {
      enabled: true,
      timeout: 30000, // 30 seconds
      autoAssignment: true,
      resourceValidation: true
    },

    postTask: {
      enabled: true,
      timeout: 30000, // 30 seconds
      resultValidation: true,
      metricsCollection: true,
      neuralTraining: true
    },

    // File Operation Hooks
    preEdit: {
      enabled: true,
      backupCreation: true,
      permissionCheck: true
    },

    postEdit: {
      enabled: true,
      autoFormatting: true,
      syntaxValidation: true,
      memoryStorage: true
    }
  },

  // Neural & ML Features
  neural: {
    enabled: true,
    patternRecognition: true,
    learningAdaptation: true,
    modelPersistence: true,
    trainingData: {
      collectAutomatically: true,
      anonymize: true,
      maxSamplesPerPattern: 1000
    },
    inference: {
      realTimeOptimization: true,
      taskPrediction: true,
      resourceAllocation: true
    }
  },

  // Performance Monitoring
  monitoring: {
    enabled: true,
    realTimeMetrics: true,
    bottleneckDetection: true,
    alerting: true,
    
    metrics: {
      taskDuration: true,
      memoryUsage: true,
      cpuUsage: true,
      errorRate: true,
      throughput: true
    },

    alerts: {
      highErrorRate: { threshold: 0.1, action: 'scale_down' },
      highLatency: { threshold: 10000, action: 'optimize' }, // 10 seconds
      memoryExhaustion: { threshold: 0.9, action: 'cleanup' },
      agentFailure: { threshold: 3, action: 'respawn' }
    }
  },

  // GitHub Integration
  github: {
    enabled: true,
    autoSync: true,
    prAutomation: true,
    issueTracking: true,
    releaseManagement: true,
    
    webhooks: {
      enabled: true,
      events: ['push', 'pull_request', 'issues', 'release']
    },

    automation: {
      codeReview: true,
      testingPipeline: true,
      deploymentChecks: true,
      documentationUpdates: true
    }
  },

  // Workflow Templates
  workflows: {
    defaultTemplates: [
      'nextjs-feature',
      'bug-fix',
      'performance-optimization',
      'api-development',
      'component-library',
      'database-migration'
    ],

    customTemplates: {
      enabled: true,
      versioning: true,
      sharing: true
    },

    execution: {
      parallelPhases: true,
      dependencyTracking: true,
      rollbackSupport: true,
      progressReporting: true
    }
  },

  // Security Configuration
  security: {
    enabled: true,
    sandboxing: true,
    permissionValidation: true,
    
    agentIsolation: {
      enabled: true,
      resourceLimits: true,
      networkAccess: 'restricted'
    },

    dataProtection: {
      encryption: true,
      anonymization: true,
      auditLogging: true
    }
  },

  // Development Environment
  development: {
    debugMode: process.env.NODE_ENV === 'development',
    verboseLogging: process.env.CLAUDE_FLOW_VERBOSE === 'true',
    performanceProfiling: true,
    testMode: process.env.NODE_ENV === 'test',
    
    hotReload: {
      enabled: process.env.NODE_ENV === 'development',
      watchPaths: ['src/claude-flow/**/*'],
      debounceMs: 1000
    }
  },

  // Integration Settings
  integration: {
    claudeCode: {
      enabled: true,
      taskTool: true,
      batchExecution: true,
      hookIntegration: true
    },

    nextjs: {
      enabled: true,
      autoDetection: true,
      optimizedPatterns: true,
      buildIntegration: true
    },

    testing: {
      jest: true,
      cypress: true,
      playwright: true,
      autoDiscovery: true
    }
  }
};

// Environment-specific overrides
const environmentOverrides = {
  development: {
    system: {
      maxAgents: 20 // Reduced for development
    },
    development: {
      debugMode: true,
      verboseLogging: true
    }
  },

  production: {
    system: {
      maxAgents: 54,
      autoScale: true,
      selfHealing: true
    },
    monitoring: {
      alerting: true,
      realTimeMetrics: true
    }
  },

  test: {
    system: {
      maxAgents: 10 // Minimal for testing
    },
    memory: {
      persistToDisk: false // Use in-memory for tests
    },
    development: {
      testMode: true
    }
  }
};

// Apply environment overrides
const environment = process.env.NODE_ENV || 'development';
const overrides = environmentOverrides[environment] || {};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export const config = deepMerge({ ...claudeFlowConfig }, overrides);

export default config;