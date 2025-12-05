/**
 * SPARC Test Utilities
 * Helper functions and utilities for testing SPARC methodology implementation
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { performance } from 'perf_hooks'

const execAsync = promisify(exec)

/**
 * SPARC Command Executor for Testing
 */
export class SPARCTestExecutor {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000
    this.verbose = options.verbose || false
    this.retryCount = options.retryCount || 3
  }

  /**
   * Execute SPARC specification phase
   */
  async executeSpecification(task, options = {}) {
    const command = `npx claude-flow sparc run spec-pseudocode "${task}"`
    return this.executeCommand(command, 'specification', options)
  }

  /**
   * Execute SPARC architecture phase
   */
  async executeArchitecture(task, options = {}) {
    const command = `npx claude-flow sparc run architect "${task}"`
    return this.executeCommand(command, 'architecture', options)
  }

  /**
   * Execute SPARC TDD phase
   */
  async executeTDD(task, options = {}) {
    const command = `npx claude-flow sparc tdd "${task}"`
    return this.executeCommand(command, 'tdd', options)
  }

  /**
   * Execute complete SPARC pipeline
   */
  async executeFullPipeline(task, options = {}) {
    const command = `npx claude-flow sparc pipeline "${task}"`
    return this.executeCommand(command, 'pipeline', options)
  }

  /**
   * Execute SPARC batch processing
   */
  async executeBatch(modes, task, options = {}) {
    const modesStr = Array.isArray(modes) ? modes.join(' ') : modes
    const command = `npx claude-flow sparc batch ${modesStr} "${task}"`
    return this.executeCommand(command, 'batch', options)
  }

  /**
   * Internal command executor with retry logic
   */
  async executeCommand(command, phase, options = {}) {
    const startTime = performance.now()
    let lastError = null

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        if (this.verbose) {
          console.log(`[SPARC-${phase}] Attempt ${attempt}: ${command}`)
        }

        const result = await this.runCommand(command, options)
        const executionTime = performance.now() - startTime

        return {
          success: true,
          phase,
          command,
          result: result.stdout,
          error: result.stderr,
          executionTime,
          attempt,
        }
      } catch (error) {
        lastError = error
        if (this.verbose) {
          console.log(`[SPARC-${phase}] Attempt ${attempt} failed:`, error.message)
        }

        if (attempt < this.retryCount) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    const executionTime = performance.now() - startTime
    return {
      success: false,
      phase,
      command,
      error: lastError?.message || 'Unknown error',
      executionTime,
      attempts: this.retryCount,
    }
  }

  /**
   * Run command with timeout
   */
  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || this.timeout
      const timer = setTimeout(() => {
        reject(new Error(`Command timed out after ${timeout}ms`))
      }, timeout)

      exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        clearTimeout(timer)
        
        if (error) {
          reject(error)
        } else {
          resolve({ stdout, stderr })
        }
      })
    })
  }

  /**
   * Parse SPARC output for testing
   */
  parseSPARCOutput(output) {
    try {
      // Try to parse as JSON first
      return JSON.parse(output)
    } catch {
      // If not JSON, parse as text sections
      const sections = {}
      const lines = output.split('\n')
      let currentSection = null
      let currentContent = []

      for (const line of lines) {
        if (line.startsWith('## ') || line.startsWith('# ')) {
          if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n')
          }
          currentSection = line.replace(/^#+\s*/, '').toLowerCase()
          currentContent = []
        } else if (currentSection) {
          currentContent.push(line)
        }
      }

      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n')
      }

      return sections
    }
  }
}

/**
 * Agent Coordination Test Helper
 */
export class AgentCoordinationTester {
  constructor() {
    this.activeAgents = new Map()
    this.coordination = new Map()
  }

  /**
   * Spawn test agents
   */
  async spawnTestAgents(agentTypes, task) {
    const results = []

    for (const agentType of agentTypes) {
      try {
        const agentId = `${agentType}-${Date.now()}`
        const result = await this.spawnAgent(agentId, agentType, task)
        results.push(result)
        this.activeAgents.set(agentId, { type: agentType, status: 'active', task })
      } catch (error) {
        results.push({
          success: false,
          agentType,
          error: error.message,
        })
      }
    }

    return results
  }

  /**
   * Spawn individual agent
   */
  async spawnAgent(agentId, agentType, task) {
    return new Promise((resolve, reject) => {
      const command = `npx claude-flow agent spawn ${agentType} --task "${task}"`
      const child = spawn('npx', ['claude-flow', 'agent', 'spawn', agentType, '--task', task])

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            agentId,
            agentType,
            output: stdout,
            error: stderr,
          })
        } else {
          reject(new Error(`Agent spawn failed with code ${code}: ${stderr}`))
        }
      })

      child.on('error', (error) => {
        reject(error)
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        child.kill()
        reject(new Error('Agent spawn timeout'))
      }, 30000)
    })
  }

  /**
   * Test agent coordination patterns
   */
  async testCoordination(pattern = 'mesh') {
    const coordinationResult = {
      pattern,
      startTime: performance.now(),
      agents: Array.from(this.activeAgents.values()),
      messages: [],
      success: false,
    }

    try {
      // Initialize coordination pattern
      await this.initializeCoordination(pattern)

      // Test message passing
      const messageResults = await this.testMessagePassing()
      coordinationResult.messages = messageResults

      // Test synchronization
      const syncResult = await this.testSynchronization()
      coordinationResult.synchronization = syncResult

      coordinationResult.success = true
    } catch (error) {
      coordinationResult.error = error.message
    }

    coordinationResult.executionTime = performance.now() - coordinationResult.startTime
    return coordinationResult
  }

  async initializeCoordination(pattern) {
    const command = `npx claude-flow swarm init ${pattern}`
    return execAsync(command)
  }

  async testMessagePassing() {
    // Mock message passing between agents
    const messages = []
    const agents = Array.from(this.activeAgents.keys())

    for (let i = 0; i < agents.length - 1; i++) {
      const from = agents[i]
      const to = agents[i + 1]
      const message = {
        from,
        to,
        content: `Test message from ${from} to ${to}`,
        timestamp: Date.now(),
      }

      try {
        await this.sendMessage(message)
        messages.push({ ...message, status: 'sent' })
      } catch (error) {
        messages.push({ ...message, status: 'failed', error: error.message })
      }
    }

    return messages
  }

  async sendMessage(message) {
    // Simulate message sending
    return new Promise((resolve) => {
      setTimeout(() => {
        this.coordination.set(message.from + '->' + message.to, message)
        resolve(message)
      }, 100)
    })
  }

  async testSynchronization() {
    const agents = Array.from(this.activeAgents.keys())
    const syncPoints = []

    for (const agentId of agents) {
      try {
        const syncTime = await this.synchronizeAgent(agentId)
        syncPoints.push({ agentId, syncTime, status: 'synchronized' })
      } catch (error) {
        syncPoints.push({ agentId, error: error.message, status: 'failed' })
      }
    }

    return syncPoints
  }

  async synchronizeAgent(agentId) {
    // Mock agent synchronization
    return new Promise((resolve) => {
      const syncTime = performance.now()
      setTimeout(() => resolve(syncTime), Math.random() * 100)
    })
  }

  /**
   * Clean up test agents
   */
  cleanup() {
    this.activeAgents.clear()
    this.coordination.clear()
  }
}

/**
 * SPARC Quality Metrics Analyzer
 */
export class SPARCQualityAnalyzer {
  /**
   * Analyze SPARC output quality
   */
  analyzeOutput(sparcOutput, phase) {
    const metrics = {
      phase,
      timestamp: Date.now(),
      scores: {},
      issues: [],
      suggestions: [],
    }

    switch (phase) {
      case 'specification':
        return this.analyzeSpecification(sparcOutput, metrics)
      case 'architecture':
        return this.analyzeArchitecture(sparcOutput, metrics)
      case 'implementation':
        return this.analyzeImplementation(sparcOutput, metrics)
      case 'testing':
        return this.analyzeTesting(sparcOutput, metrics)
      default:
        return this.analyzeGeneral(sparcOutput, metrics)
    }
  }

  analyzeSpecification(output, metrics) {
    // Check for required specification elements
    const requiredElements = [
      'requirements',
      'acceptance criteria',
      'user stories',
      'constraints',
    ]

    const foundElements = requiredElements.filter(element =>
      output.toLowerCase().includes(element)
    )

    metrics.scores.completeness = (foundElements.length / requiredElements.length) * 100
    metrics.scores.clarity = this.calculateClarityScore(output)
    metrics.scores.detail = this.calculateDetailScore(output)

    if (foundElements.length < requiredElements.length) {
      metrics.issues.push('Missing required specification elements')
      metrics.suggestions.push('Include all required specification sections')
    }

    return metrics
  }

  analyzeArchitecture(output, metrics) {
    const architecturalConcerns = [
      'components',
      'interfaces',
      'data flow',
      'dependencies',
      'patterns',
    ]

    const foundConcerns = architecturalConcerns.filter(concern =>
      output.toLowerCase().includes(concern)
    )

    metrics.scores.completeness = (foundConcerns.length / architecturalConcerns.length) * 100
    metrics.scores.technical_depth = this.calculateTechnicalDepth(output)
    metrics.scores.feasibility = this.calculateFeasibilityScore(output)

    return metrics
  }

  analyzeImplementation(output, metrics) {
    // Code quality metrics
    const codeMetrics = this.analyzeCodeQuality(output)
    metrics.scores = { ...metrics.scores, ...codeMetrics }

    // Check for best practices
    const bestPractices = this.checkBestPractices(output)
    metrics.bestPractices = bestPractices

    return metrics
  }

  analyzeTesting(output, metrics) {
    const testingElements = [
      'unit tests',
      'integration tests',
      'test cases',
      'coverage',
      'assertions',
    ]

    const foundElements = testingElements.filter(element =>
      output.toLowerCase().includes(element)
    )

    metrics.scores.test_coverage = (foundElements.length / testingElements.length) * 100
    metrics.scores.test_quality = this.calculateTestQuality(output)

    return metrics
  }

  analyzeGeneral(output, metrics) {
    metrics.scores.overall = this.calculateOverallScore(output)
    metrics.scores.readability = this.calculateReadabilityScore(output)
    
    return metrics
  }

  calculateClarityScore(text) {
    // Simple clarity score based on sentence length and complexity
    const sentences = text.split(/[.!?]+/)
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length
    
    return Math.max(0, 100 - (avgLength / 20) * 10) // Shorter sentences = higher clarity
  }

  calculateDetailScore(text) {
    // Detail score based on text length and information density
    const wordCount = text.split(/\s+/).length
    const informationWords = text.match(/\b(implement|require|should|must|will|create|build|design|develop)\b/gi)?.length || 0
    
    const density = informationWords / wordCount
    return Math.min(100, density * 1000) // Cap at 100
  }

  calculateTechnicalDepth(text) {
    const technicalTerms = text.match(/\b(API|database|server|client|framework|library|component|service|module|interface|class|function|method|algorithm|architecture|pattern|protocol|schema|model|controller|view|middleware|authentication|authorization|encryption|validation|optimization|scalability|performance|security|testing|deployment|CI\/CD|Docker|Kubernetes|microservices|REST|GraphQL|JSON|XML|HTTP|HTTPS|SQL|NoSQL|async|await|promise|callback|event|stream|buffer|cache|session|cookie|token|JWT|OAuth|CORS|CSRF|XSS|SQL injection)\b/gi)?.length || 0
    
    const wordCount = text.split(/\s+/).length
    const technicalDensity = technicalTerms / wordCount
    
    return Math.min(100, technicalDensity * 500)
  }

  calculateFeasibilityScore(text) {
    // Check for feasibility indicators
    const feasibilityIndicators = {
      positive: /\b(feasible|achievable|practical|realistic|simple|straightforward|proven|standard|available|existing|mature|stable|scalable|maintainable)\b/gi,
      negative: /\b(impossible|unfeasible|complex|difficult|experimental|untested|unstable|deprecated|risky|challenging)\b/gi,
    }
    
    const positiveCount = text.match(feasibilityIndicators.positive)?.length || 0
    const negativeCount = text.match(feasibilityIndicators.negative)?.length || 0
    
    const score = 50 + (positiveCount * 10) - (negativeCount * 15)
    return Math.max(0, Math.min(100, score))
  }

  analyzeCodeQuality(code) {
    const metrics = {}
    
    // Lines of code
    const lines = code.split('\n').filter(line => line.trim())
    metrics.loc = lines.length
    
    // Cyclomatic complexity (simplified)
    const complexityKeywords = code.match(/\b(if|else|while|for|switch|case|catch|&&|\|\|)\b/g)?.length || 0
    metrics.complexity = complexityKeywords + 1
    
    // Comment ratio
    const comments = code.match(/\/\/|\/\*|\*\/|#|<!--/g)?.length || 0
    metrics.comment_ratio = (comments / lines.length) * 100
    
    // Function count
    const functions = code.match(/function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{|\w+\s*:\s*function/g)?.length || 0
    metrics.function_count = functions
    
    return metrics
  }

  checkBestPractices(code) {
    const practices = []
    
    // Check for ES6+ features
    if (code.includes('const ') || code.includes('let ')) {
      practices.push({ practice: 'Modern variable declarations', status: 'good' })
    }
    
    // Check for arrow functions
    if (code.includes('=>')) {
      practices.push({ practice: 'Arrow functions', status: 'good' })
    }
    
    // Check for proper error handling
    if (code.includes('try') && code.includes('catch')) {
      practices.push({ practice: 'Error handling', status: 'good' })
    }
    
    // Check for async/await
    if (code.includes('async') || code.includes('await')) {
      practices.push({ practice: 'Modern async patterns', status: 'good' })
    }
    
    return practices
  }

  calculateTestQuality(testCode) {
    // Check for test patterns
    const testPatterns = testCode.match(/\b(describe|it|test|expect|should|assert|mock|spy|stub)\b/gi)?.length || 0
    const lines = testCode.split('\n').filter(line => line.trim()).length
    
    if (lines === 0) return 0
    
    const testDensity = testPatterns / lines
    return Math.min(100, testDensity * 200)
  }

  calculateOverallScore(text) {
    const wordCount = text.split(/\s+/).length
    const qualityIndicators = text.match(/\b(excellent|good|quality|robust|reliable|efficient|optimized|clean|maintainable|scalable|secure|tested)\b/gi)?.length || 0
    
    const score = Math.min(100, (qualityIndicators / wordCount) * 1000 + 50)
    return score
  }

  calculateReadabilityScore(text) {
    // Simple readability score based on sentence and word complexity
    const sentences = text.split(/[.!?]+/)
    const words = text.split(/\s+/)
    
    const avgWordsPerSentence = words.length / sentences.length
    const avgCharsPerWord = text.length / words.length
    
    // Flesch-like formula (simplified)
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgCharsPerWord)
    return Math.max(0, Math.min(100, score))
  }
}

/**
 * Test Data Generator for SPARC Testing
 */
export class SPARCTestDataGenerator {
  generateTestTask(complexity = 'medium') {
    const tasks = {
      simple: [
        'Create a basic contact form component',
        'Build a simple user profile page',
        'Implement basic navigation menu',
      ],
      medium: [
        'Build a job posting system with CRUD operations',
        'Create a blog with markdown support',
        'Implement user authentication with roles',
      ],
      complex: [
        'Build a real-time collaboration platform',
        'Create a microservices architecture',
        'Implement advanced analytics dashboard',
      ],
    }
    
    const taskList = tasks[complexity] || tasks.medium
    return taskList[Math.floor(Math.random() * taskList.length)]
  }

  generateMockSPARCOutput(phase) {
    const outputs = {
      specification: `
# Specification: User Authentication System

## Requirements
- User registration and login
- Password reset functionality
- Role-based access control
- Session management

## Acceptance Criteria
- Users can register with email and password
- Passwords must meet security requirements
- Users can reset passwords via email
- Different user roles have different permissions

## Constraints
- Must integrate with existing database
- Must be GDPR compliant
- Must support 1000+ concurrent users
      `,
      
      architecture: `
# Architecture: User Authentication System

## Components
- Authentication Service
- User Management API
- Password Reset Service
- Session Store

## Data Flow
1. User submits credentials
2. Authentication service validates
3. Session created in store
4. JWT token returned

## Dependencies
- Database: PostgreSQL
- Cache: Redis
- Email: SendGrid
      `,
      
      implementation: `
// User Authentication Implementation
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class AuthService {
  async authenticate(email, password) {
    const user = await User.findByEmail(email);
    if (!user) throw new Error('User not found');
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Invalid password');
    
    return this.generateToken(user);
  }
  
  generateToken(user) {
    return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET);
  }
}
      `,
    }
    
    return outputs[phase] || outputs.specification
  }
}

// Export all utilities
export default {
  SPARCTestExecutor,
  AgentCoordinationTester,
  SPARCQualityAnalyzer,
  SPARCTestDataGenerator,
}