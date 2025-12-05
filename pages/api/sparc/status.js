// SPARC System Status API
import { workflows } from './workflow.js';
import { tasks } from './tasks.js';
import { agents } from './coordination.js';

export default async function handler(req, res) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { type = 'overview' } = query;
        
        switch (type) {
          case 'overview':
            return getSystemOverview(res);
          
          case 'health':
            return getHealthStatus(res);
          
          case 'metrics':
            return getSystemMetrics(res);
          
          case 'performance':
            return getPerformanceMetrics(res);
          
          case 'agents':
            return getAgentStatus(res);
          
          case 'workflows':
            return getWorkflowStatus(res);
          
          case 'tasks':
            return getTaskStatus(res);
          
          default:
            return res.status(400).json({ error: 'Invalid status type' });
        }

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Status API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get system overview
async function getSystemOverview(res) {
  const now = new Date();
  const uptime = process.uptime();
  
  const overview = {
    timestamp: now.toISOString(),
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime)
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid
    },
    sparc: {
      activeWorkflows: workflows.size,
      totalTasks: tasks.size,
      activeAgents: agents.size,
      activeTasks: Array.from(tasks.values()).filter(t => 
        ['in_progress', 'assigned'].includes(t.status)
      ).length
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss
    }
  };

  return res.status(200).json(overview);
}

// Get health status
async function getHealthStatus(res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: []
  };

  // Memory check
  const memUsage = process.memoryUsage();
  const memoryHealthy = memUsage.heapUsed < memUsage.heapTotal * 0.9;
  health.checks.push({
    name: 'memory',
    status: memoryHealthy ? 'pass' : 'fail',
    details: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)
    }
  });

  // Workflow system check
  const workflowHealthy = workflows.size < 100; // Arbitrary limit
  health.checks.push({
    name: 'workflow_system',
    status: workflowHealthy ? 'pass' : 'warn',
    details: {
      activeWorkflows: workflows.size,
      limit: 100
    }
  });

  // Agent system check
  const agentHealthy = agents.size >= 0; // Always healthy if no errors
  health.checks.push({
    name: 'agent_system',
    status: agentHealthy ? 'pass' : 'fail',
    details: {
      activeAgents: agents.size
    }
  });

  // Task system check
  const taskHealthy = tasks.size < 1000; // Arbitrary limit
  health.checks.push({
    name: 'task_system',
    status: taskHealthy ? 'pass' : 'warn',
    details: {
      totalTasks: tasks.size,
      limit: 1000
    }
  });

  // Overall health status
  const hasFailures = health.checks.some(c => c.status === 'fail');
  const hasWarnings = health.checks.some(c => c.status === 'warn');
  
  if (hasFailures) {
    health.status = 'unhealthy';
  } else if (hasWarnings) {
    health.status = 'degraded';
  }

  return res.status(200).json(health);
}

// Get system metrics
async function getSystemMetrics(res) {
  const metrics = {
    timestamp: new Date().toISOString(),
    workflows: {
      total: workflows.size,
      byStatus: getWorkflowsByStatus(),
      byType: getWorkflowsByType()
    },
    tasks: {
      total: tasks.size,
      byStatus: getTasksByStatus(),
      byPhase: getTasksByPhase(),
      byPriority: getTasksByPriority()
    },
    agents: {
      total: agents.size,
      byType: getAgentsByType(),
      byStatus: getAgentsByStatus()
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: process.cpuUsage()
    }
  };

  return res.status(200).json(metrics);
}

// Get performance metrics
async function getPerformanceMetrics(res) {
  const now = Date.now();
  const performance = {
    timestamp: new Date().toISOString(),
    response_times: {
      // This would typically be tracked over time
      average: 50, // ms
      p95: 100,
      p99: 200
    },
    throughput: {
      // Requests per second - would be calculated from historical data
      current: 10,
      peak: 50,
      average: 25
    },
    error_rates: {
      // Would be calculated from error logs
      current: 0.1, // percentage
      target: 1.0
    },
    resource_utilization: {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(2)
      },
      cpu: process.cpuUsage()
    },
    workflow_performance: {
      average_completion_time: calculateAverageCompletionTime(),
      success_rate: calculateSuccessRate(),
      task_throughput: calculateTaskThroughput()
    }
  };

  return res.status(200).json(performance);
}

// Get agent status
async function getAgentStatus(res) {
  const agentList = Array.from(agents.values());
  
  const status = {
    timestamp: new Date().toISOString(),
    total: agentList.length,
    active: agentList.filter(a => a.status === 'active').length,
    idle: agentList.filter(a => a.status === 'idle').length,
    busy: agentList.filter(a => a.status === 'busy').length,
    agents: agentList.map(agent => ({
      id: agent.id,
      type: agent.type,
      status: agent.status,
      workflowId: agent.workflowId,
      registeredAt: agent.registeredAt,
      lastActivity: agent.lastActivity,
      capabilities: agent.capabilities
    }))
  };

  return res.status(200).json(status);
}

// Get workflow status
async function getWorkflowStatus(res) {
  const workflowList = Array.from(workflows.values());
  
  const status = {
    timestamp: new Date().toISOString(),
    total: workflowList.length,
    by_status: getWorkflowsByStatus(),
    workflows: workflowList.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      type: workflow.type,
      status: workflow.status,
      currentPhase: workflow.currentPhase,
      totalPhases: workflow.phases.length,
      tasksCount: workflow.tasks.length,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt
    }))
  };

  return res.status(200).json(status);
}

// Get task status
async function getTaskStatus(res) {
  const taskList = Array.from(tasks.values());
  
  const status = {
    timestamp: new Date().toISOString(),
    total: taskList.length,
    by_status: getTasksByStatus(),
    by_phase: getTasksByPhase(),
    by_priority: getTasksByPriority(),
    tasks: taskList.map(task => ({
      id: task.id,
      name: task.name,
      workflowId: task.workflowId,
      phase: task.phase,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt
    }))
  };

  return res.status(200).json(status);
}

// Helper functions
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function getWorkflowsByStatus() {
  const statusCounts = {};
  Array.from(workflows.values()).forEach(workflow => {
    statusCounts[workflow.status] = (statusCounts[workflow.status] || 0) + 1;
  });
  return statusCounts;
}

function getWorkflowsByType() {
  const typeCounts = {};
  Array.from(workflows.values()).forEach(workflow => {
    typeCounts[workflow.type] = (typeCounts[workflow.type] || 0) + 1;
  });
  return typeCounts;
}

function getTasksByStatus() {
  const statusCounts = {};
  Array.from(tasks.values()).forEach(task => {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
  });
  return statusCounts;
}

function getTasksByPhase() {
  const phaseCounts = {};
  Array.from(tasks.values()).forEach(task => {
    phaseCounts[task.phase] = (phaseCounts[task.phase] || 0) + 1;
  });
  return phaseCounts;
}

function getTasksByPriority() {
  const priorityCounts = {};
  Array.from(tasks.values()).forEach(task => {
    priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
  });
  return priorityCounts;
}

function getAgentsByType() {
  const typeCounts = {};
  Array.from(agents.values()).forEach(agent => {
    typeCounts[agent.type] = (typeCounts[agent.type] || 0) + 1;
  });
  return typeCounts;
}

function getAgentsByStatus() {
  const statusCounts = {};
  Array.from(agents.values()).forEach(agent => {
    statusCounts[agent.status] = (statusCounts[agent.status] || 0) + 1;
  });
  return statusCounts;
}

function calculateAverageCompletionTime() {
  const completedWorkflows = Array.from(workflows.values())
    .filter(w => w.status === 'completed');
  
  if (completedWorkflows.length === 0) return 0;
  
  const totalTime = completedWorkflows.reduce((sum, workflow) => {
    const created = new Date(workflow.createdAt);
    const updated = new Date(workflow.updatedAt);
    return sum + (updated - created);
  }, 0);
  
  return Math.round(totalTime / completedWorkflows.length / 1000 / 60); // minutes
}

function calculateSuccessRate() {
  const allWorkflows = Array.from(workflows.values());
  if (allWorkflows.length === 0) return 100;
  
  const completed = allWorkflows.filter(w => w.status === 'completed').length;
  const failed = allWorkflows.filter(w => w.status === 'failed').length;
  const total = completed + failed;
  
  if (total === 0) return 100;
  
  return Math.round((completed / total) * 100);
}

function calculateTaskThroughput() {
  const completedTasks = Array.from(tasks.values())
    .filter(t => t.status === 'completed');
  
  // Tasks completed in the last hour
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const recentlyCompleted = completedTasks.filter(t => 
    new Date(t.completedAt) > new Date(oneHourAgo)
  );
  
  return recentlyCompleted.length; // tasks per hour
}