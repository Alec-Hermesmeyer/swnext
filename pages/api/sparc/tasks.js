// SPARC Task Management API
import { workflows } from './workflow.js';

const tasks = new Map();
const taskResults = new Map();

export default async function handler(req, res) {
  const { method, query } = req;
  const taskId = query.id;

  try {
    switch (method) {
      case 'GET':
        if (taskId) {
          const task = tasks.get(taskId);
          if (!task) {
            return res.status(404).json({ error: 'Task not found' });
          }
          
          // Include results if available
          const results = taskResults.get(taskId);
          return res.status(200).json({ ...task, results });
        }
        
        // Filter tasks by workflow if provided
        const { workflowId, phase, status } = query;
        let allTasks = Array.from(tasks.values());
        
        if (workflowId) {
          allTasks = allTasks.filter(t => t.workflowId === workflowId);
        }
        if (phase) {
          allTasks = allTasks.filter(t => t.phase === phase);
        }
        if (status) {
          allTasks = allTasks.filter(t => t.status === status);
        }
        
        return res.status(200).json(allTasks);

      case 'POST':
        const {
          workflowId: postWorkflowId,
          name,
          phase: postPhase,
          type = 'development',
          priority = 'medium',
          assignee = null,
          description = '',
          dependencies = [],
          metadata = {}
        } = req.body;

        if (!postWorkflowId || !name || !postPhase) {
          return res.status(400).json({ 
            error: 'workflowId, name, and phase are required' 
          });
        }

        // Verify workflow exists
        const workflow = workflows.get(postWorkflowId);
        if (!workflow) {
          return res.status(404).json({ error: 'Workflow not found' });
        }

        const newTaskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const task = {
          id: newTaskId,
          workflowId: postWorkflowId,
          name,
          phase: postPhase,
          type,
          priority,
          assignee,
          description,
          dependencies,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: null,
          completedAt: null,
          metadata
        };

        tasks.set(newTaskId, task);

        // Add task to workflow
        workflow.tasks.push(newTaskId);
        workflow.updatedAt = new Date().toISOString();
        workflows.set(workflowId, workflow);

        return res.status(201).json(task);

      case 'PUT':
        if (!taskId) {
          return res.status(400).json({ error: 'Task ID is required' });
        }

        const existingTask = tasks.get(taskId);
        if (!existingTask) {
          return res.status(404).json({ error: 'Task not found' });
        }

        const updates = req.body;
        const now = new Date().toISOString();
        
        // Handle status transitions
        if (updates.status && updates.status !== existingTask.status) {
          if (updates.status === 'in_progress' && !existingTask.startedAt) {
            updates.startedAt = now;
          } else if (updates.status === 'completed' && !existingTask.completedAt) {
            updates.completedAt = now;
          }
        }

        const updatedTask = {
          ...existingTask,
          ...updates,
          updatedAt: now
        };

        tasks.set(taskId, updatedTask);
        return res.status(200).json(updatedTask);

      case 'DELETE':
        if (!taskId) {
          return res.status(400).json({ error: 'Task ID is required' });
        }

        const taskToDelete = tasks.get(taskId);
        if (!taskToDelete) {
          return res.status(404).json({ error: 'Task not found' });
        }

        // Remove from workflow
        const parentWorkflow = workflows.get(taskToDelete.workflowId);
        if (parentWorkflow) {
          parentWorkflow.tasks = parentWorkflow.tasks.filter(id => id !== taskId);
          workflows.set(taskToDelete.workflowId, parentWorkflow);
        }

        tasks.delete(taskId);
        taskResults.delete(taskId);
        
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Task API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Store task results
export async function storeTaskResult(taskId, result) {
  taskResults.set(taskId, {
    taskId,
    result,
    timestamp: new Date().toISOString()
  });
}

// Export for other modules
export { tasks, taskResults };