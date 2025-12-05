// SPARC Agent Coordination API
import { tasks } from './tasks.js';
import { workflows } from './workflow.js';

const agents = new Map();
const coordinationMessages = [];

export default async function handler(req, res) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { type } = query;
        
        if (type === 'agents') {
          return res.status(200).json(Array.from(agents.values()));
        }
        
        if (type === 'messages') {
          const { limit = 50, workflowId } = query;
          let messages = coordinationMessages;
          
          if (workflowId) {
            messages = messages.filter(m => m.workflowId === workflowId);
          }
          
          return res.status(200).json(
            messages.slice(-parseInt(limit))
          );
        }
        
        // Return coordination status
        return res.status(200).json({
          activeAgents: agents.size,
          totalMessages: coordinationMessages.length,
          activeWorkflows: workflows.size,
          activeTasks: Array.from(tasks.values()).filter(t => 
            t.status === 'in_progress'
          ).length
        });

      case 'POST':
        const { action, data } = req.body;
        
        switch (action) {
          case 'register_agent':
            return registerAgent(req.body.agent, res);
          
          case 'notify':
            return broadcastNotification(req.body, res);
          
          case 'request_assignment':
            return requestTaskAssignment(req.body, res);
          
          case 'report_progress':
            return reportProgress(req.body, res);
          
          case 'sync_memory':
            return syncMemory(req.body, res);
          
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Coordination API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Register a new agent
async function registerAgent(agentData, res) {
  const {
    id,
    type,
    capabilities = [],
    workflowId,
    metadata = {}
  } = agentData;

  if (!id || !type) {
    return res.status(400).json({ error: 'Agent id and type are required' });
  }

  const agent = {
    id,
    type,
    capabilities,
    workflowId,
    status: 'active',
    registeredAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    metadata
  };

  agents.set(id, agent);

  // Broadcast registration
  addCoordinationMessage({
    type: 'agent_registered',
    agentId: id,
    workflowId,
    message: `Agent ${id} of type ${type} registered`,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json(agent);
}

// Broadcast notification to all agents
async function broadcastNotification(notificationData, res) {
  const {
    message,
    workflowId,
    targetAgents = [],
    priority = 'medium',
    metadata = {}
  } = notificationData;

  const notification = {
    id: `notify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'notification',
    message,
    workflowId,
    targetAgents,
    priority,
    timestamp: new Date().toISOString(),
    metadata
  };

  addCoordinationMessage(notification);
  
  return res.status(200).json({ 
    success: true, 
    notificationId: notification.id 
  });
}

// Request task assignment for an agent
async function requestTaskAssignment(requestData, res) {
  const {
    agentId,
    workflowId,
    capabilities = [],
    preferences = {}
  } = requestData;

  if (!agentId) {
    return res.status(400).json({ error: 'Agent ID is required' });
  }

  // Find available tasks
  const availableTasks = Array.from(tasks.values()).filter(task => {
    return task.status === 'pending' && 
           (!workflowId || task.workflowId === workflowId) &&
           (!task.assignee || task.assignee === agentId);
  });

  // Simple assignment logic - prioritize by priority and creation time
  const sortedTasks = availableTasks.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const assignedTask = sortedTasks[0];
  
  if (assignedTask) {
    // Update task assignment
    assignedTask.assignee = agentId;
    assignedTask.status = 'assigned';
    assignedTask.updatedAt = new Date().toISOString();
    tasks.set(assignedTask.id, assignedTask);

    addCoordinationMessage({
      type: 'task_assigned',
      agentId,
      taskId: assignedTask.id,
      workflowId: assignedTask.workflowId,
      message: `Task ${assignedTask.name} assigned to agent ${agentId}`,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json({
    assignedTask,
    availableCount: availableTasks.length
  });
}

// Report progress from an agent
async function reportProgress(progressData, res) {
  const {
    agentId,
    taskId,
    progress = {},
    status,
    message = '',
    metadata = {}
  } = progressData;

  if (!agentId) {
    return res.status(400).json({ error: 'Agent ID is required' });
  }

  // Update agent activity
  const agent = agents.get(agentId);
  if (agent) {
    agent.lastActivity = new Date().toISOString();
    agents.set(agentId, agent);
  }

  // Update task if provided
  if (taskId) {
    const task = tasks.get(taskId);
    if (task) {
      if (status) task.status = status;
      if (progress) task.metadata.progress = { ...task.metadata.progress, ...progress };
      task.updatedAt = new Date().toISOString();
      tasks.set(taskId, task);
    }
  }

  addCoordinationMessage({
    type: 'progress_report',
    agentId,
    taskId,
    progress,
    status,
    message,
    timestamp: new Date().toISOString(),
    metadata
  });

  return res.status(200).json({ success: true });
}

// Sync memory between agents
async function syncMemory(syncData, res) {
  const {
    agentId,
    memoryKey,
    memoryValue,
    operation = 'store', // store, retrieve, delete
    namespace = 'default'
  } = syncData;

  // This would integrate with the actual memory system
  // For now, just log the operation
  addCoordinationMessage({
    type: 'memory_sync',
    agentId,
    operation,
    memoryKey,
    namespace,
    message: `Agent ${agentId} ${operation} memory: ${memoryKey}`,
    timestamp: new Date().toISOString()
  });

  return res.status(200).json({ 
    success: true,
    operation,
    memoryKey 
  });
}

// Helper to add coordination messages
function addCoordinationMessage(message) {
  coordinationMessages.push(message);
  
  // Keep only last 1000 messages
  if (coordinationMessages.length > 1000) {
    coordinationMessages.shift();
  }
}

// Export for other modules
export { agents, coordinationMessages };