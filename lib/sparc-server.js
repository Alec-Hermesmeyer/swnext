// SPARC Server-Side Utilities for Next.js
import fs from 'fs/promises';
import path from 'path';
import SparcClient from './sparc-client.js';

class SparcServer {
  constructor() {
    this.client = new SparcClient();
    this.projectRoot = process.cwd();
  }

  // Server-side workflow management
  async initializeWorkflow(name, type = 'sparc', metadata = {}) {
    const workflowData = {
      name,
      type,
      phases: ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'],
      metadata: {
        ...metadata,
        server: true,
        projectRoot: this.projectRoot,
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    const workflow = await this.client.createWorkflow(workflowData);
    
    // Store workflow context in server memory
    await this.client.storeMemory(
      'server',
      `workflow:${workflow.id}`,
      workflow,
      3600 // 1 hour TTL
    );

    return workflow;
  }

  // File system operations with SPARC tracking
  async trackFileOperation(operation, filePath, data = null, workflowId = null) {
    const absolutePath = path.resolve(this.projectRoot, filePath);
    const relativePath = path.relative(this.projectRoot, absolutePath);
    
    // Security check
    if (!absolutePath.startsWith(this.projectRoot)) {
      throw new Error('File operation outside project root not allowed');
    }

    const operationData = {
      operation,
      filePath: relativePath,
      absolutePath,
      timestamp: new Date().toISOString(),
      data: data ? JSON.stringify(data).slice(0, 1000) : null // Truncate large data
    };

    let result = null;
    
    try {
      switch (operation) {
        case 'read':
          result = await fs.readFile(absolutePath, 'utf8');
          operationData.size = result.length;
          break;
          
        case 'write':
          await fs.writeFile(absolutePath, data, 'utf8');
          operationData.size = data.length;
          result = { success: true, bytesWritten: data.length };
          break;
          
        case 'append':
          await fs.appendFile(absolutePath, data, 'utf8');
          operationData.size = data.length;
          result = { success: true, bytesAppended: data.length };
          break;
          
        case 'delete':
          await fs.unlink(absolutePath);
          result = { success: true, deleted: true };
          break;
          
        case 'stat':
          const stats = await fs.stat(absolutePath);
          result = {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            created: stats.birthtime.toISOString(),
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile()
          };
          operationData.size = stats.size;
          break;
          
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      operationData.success = true;
      operationData.result = result;
      
    } catch (error) {
      operationData.success = false;
      operationData.error = error.message;
      throw error;
    } finally {
      // Store operation in memory for tracking
      const memoryKey = `file_op:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await this.client.storeMemory(
        workflowId || 'server',
        memoryKey,
        operationData,
        300 // 5 minutes TTL for file operations
      ).catch(console.error);
    }

    return result;
  }

  // Project analysis utilities
  async analyzeProject(workflowId = null) {
    const analysis = {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      structure: await this.scanProjectStructure(),
      dependencies: await this.analyzeDependencies(),
      codeMetrics: await this.calculateCodeMetrics(),
      frameworks: await this.detectFrameworks()
    };

    // Store analysis results
    if (workflowId) {
      await this.client.storeMemory(
        workflowId,
        'project_analysis',
        analysis,
        1800 // 30 minutes TTL
      );
    }

    return analysis;
  }

  async scanProjectStructure(maxDepth = 3, currentPath = this.projectRoot, currentDepth = 0) {
    if (currentDepth >= maxDepth) return null;

    try {
      const items = await fs.readdir(currentPath);
      const structure = {};

      for (const item of items) {
        if (item.startsWith('.') && !['README.md', '.env', '.gitignore'].includes(item)) continue;
        if (item === 'node_modules') continue;

        const itemPath = path.join(currentPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          structure[item] = {
            type: 'directory',
            children: await this.scanProjectStructure(maxDepth, itemPath, currentDepth + 1)
          };
        } else {
          structure[item] = {
            type: 'file',
            size: stats.size,
            extension: path.extname(item),
            modified: stats.mtime.toISOString()
          };
        }
      }

      return structure;
    } catch (error) {
      console.warn(`Failed to scan directory ${currentPath}:`, error.message);
      return null;
    }
  }

  async analyzeDependencies() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      return {
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {}),
        scripts: Object.keys(packageJson.scripts || {}),
        engines: packageJson.engines || {},
        packageManager: packageJson.packageManager || 'npm'
      };
    } catch (error) {
      return { error: 'Could not analyze package.json' };
    }
  }

  async calculateCodeMetrics() {
    const metrics = {
      totalFiles: 0,
      totalLines: 0,
      fileTypes: {},
      largestFiles: []
    };

    const scanDir = async (dirPath) => {
      try {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
          if (item === 'node_modules' || item.startsWith('.')) continue;
          
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            await scanDir(itemPath);
          } else if (stats.isFile()) {
            const ext = path.extname(item);
            if (['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.json'].includes(ext)) {
              metrics.totalFiles++;
              
              const content = await fs.readFile(itemPath, 'utf8');
              const lines = content.split('\n').length;
              metrics.totalLines += lines;
              
              metrics.fileTypes[ext] = (metrics.fileTypes[ext] || 0) + 1;
              
              metrics.largestFiles.push({
                path: path.relative(this.projectRoot, itemPath),
                lines,
                size: stats.size,
                extension: ext
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${dirPath}:`, error.message);
      }
    };

    await scanDir(this.projectRoot);
    
    // Sort and limit largest files
    metrics.largestFiles.sort((a, b) => b.lines - a.lines);
    metrics.largestFiles = metrics.largestFiles.slice(0, 10);

    return metrics;
  }

  async detectFrameworks() {
    const frameworks = {
      nextjs: false,
      react: false,
      vue: false,
      angular: false,
      svelte: false,
      express: false,
      tailwind: false,
      typescript: false
    };

    try {
      // Check package.json
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if ('next' in allDeps) frameworks.nextjs = true;
      if ('react' in allDeps) frameworks.react = true;
      if ('vue' in allDeps) frameworks.vue = true;
      if ('@angular/core' in allDeps) frameworks.angular = true;
      if ('svelte' in allDeps) frameworks.svelte = true;
      if ('express' in allDeps) frameworks.express = true;
      if ('tailwindcss' in allDeps) frameworks.tailwind = true;
      if ('typescript' in allDeps) frameworks.typescript = true;

      // Check for config files
      const configFiles = [
        'next.config.js',
        'nuxt.config.js',
        'angular.json',
        'svelte.config.js',
        'tailwind.config.js',
        'tsconfig.json'
      ];

      for (const configFile of configFiles) {
        try {
          await fs.access(path.join(this.projectRoot, configFile));
          if (configFile === 'next.config.js') frameworks.nextjs = true;
          if (configFile === 'nuxt.config.js') frameworks.vue = true;
          if (configFile === 'angular.json') frameworks.angular = true;
          if (configFile === 'svelte.config.js') frameworks.svelte = true;
          if (configFile === 'tailwind.config.js') frameworks.tailwind = true;
          if (configFile === 'tsconfig.json') frameworks.typescript = true;
        } catch (error) {
          // File doesn't exist, skip
        }
      }

    } catch (error) {
      console.warn('Failed to detect frameworks:', error.message);
    }

    return frameworks;
  }

  // SPARC phase-specific utilities
  async generateSpecification(requirements, workflowId = null) {
    const spec = {
      phase: 'specification',
      timestamp: new Date().toISOString(),
      requirements: requirements,
      analysis: await this.analyzeProject(workflowId),
      recommendations: this.generateRecommendations(requirements)
    };

    if (workflowId) {
      await this.client.storeMemory(workflowId, 'specification', spec, 7200);
    }

    return spec;
  }

  async generateArchitecture(specification, workflowId = null) {
    const architecture = {
      phase: 'architecture',
      timestamp: new Date().toISOString(),
      specification,
      components: this.identifyComponents(specification),
      dataFlow: this.designDataFlow(specification),
      technologies: this.recommendTechnologies(specification),
      structure: this.designProjectStructure(specification)
    };

    if (workflowId) {
      await this.client.storeMemory(workflowId, 'architecture', architecture, 7200);
    }

    return architecture;
  }

  // Helper methods
  generateRecommendations(requirements) {
    const recommendations = [];
    
    if (requirements.includes('api') || requirements.includes('backend')) {
      recommendations.push('Consider using Next.js API routes for server-side functionality');
    }
    
    if (requirements.includes('database')) {
      recommendations.push('Evaluate database options: PostgreSQL for relational data, MongoDB for document storage');
    }
    
    if (requirements.includes('auth')) {
      recommendations.push('Implement authentication with NextAuth.js or Auth0');
    }
    
    if (requirements.includes('real-time')) {
      recommendations.push('Consider WebSocket implementation or server-sent events');
    }

    return recommendations;
  }

  identifyComponents(specification) {
    const components = [];
    const requirements = specification.requirements || [];
    
    requirements.forEach(req => {
      if (req.includes('user')) {
        components.push({ name: 'UserComponent', type: 'UI', responsibility: 'User interface and interactions' });
      }
      if (req.includes('data') || req.includes('api')) {
        components.push({ name: 'DataLayer', type: 'Service', responsibility: 'Data management and API integration' });
      }
      if (req.includes('auth')) {
        components.push({ name: 'AuthService', type: 'Service', responsibility: 'Authentication and authorization' });
      }
    });

    return components;
  }

  designDataFlow(specification) {
    return {
      frontend: 'User interactions -> Component state -> API calls',
      backend: 'API routes -> Business logic -> Data layer -> Database',
      integration: 'Frontend <-> API <-> Database'
    };
  }

  recommendTechnologies(specification) {
    const tech = {
      frontend: ['Next.js', 'React', 'Tailwind CSS'],
      backend: ['Next.js API routes', 'Node.js'],
      database: [],
      deployment: ['Vercel', 'Netlify']
    };

    const requirements = specification.requirements || [];
    
    if (requirements.includes('database')) {
      tech.database.push('PostgreSQL', 'MongoDB');
    }
    
    if (requirements.includes('real-time')) {
      tech.backend.push('WebSocket', 'Socket.io');
    }

    return tech;
  }

  designProjectStructure(specification) {
    return {
      pages: 'Next.js pages and API routes',
      components: 'Reusable React components',
      lib: 'Utility functions and configurations',
      styles: 'Global styles and Tailwind CSS',
      public: 'Static assets and files',
      utils: 'Helper functions and utilities'
    };
  }

  // Development server utilities
  async getServerInfo() {
    return {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      workingDirectory: process.cwd(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }

  async healthCheck() {
    try {
      // Test file system access
      await fs.access(this.projectRoot);
      
      // Test SPARC client connectivity
      await this.client.getSystemOverview();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          filesystem: true,
          sparcClient: true,
          memory: process.memoryUsage().heapUsed < process.memoryUsage().heapTotal * 0.9
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        checks: {
          filesystem: false,
          sparcClient: false,
          memory: process.memoryUsage().heapUsed < process.memoryUsage().heapTotal * 0.9
        }
      };
    }
  }
}

// Export singleton instance
const sparcServer = new SparcServer();
export default sparcServer;

// Also export class for custom instances
export { SparcServer };