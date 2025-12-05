// SPARC Workflow Coordination API
import { NextResponse } from 'next/server';

const workflows = new Map();
const tasks = new Map();

export default async function handler(req, res) {
  const { method, query } = req;
  const workflowId = query.id;

  try {
    switch (method) {
      case 'GET':
        if (workflowId) {
          const workflow = workflows.get(workflowId);
          if (!workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
          }
          return res.status(200).json(workflow);
        }
        // Return all workflows
        return res.status(200).json(Array.from(workflows.values()));

      case 'POST':
        const { 
          name, 
          type = 'sparc', 
          phases = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'],
          metadata = {}
        } = req.body;

        if (!name) {
          return res.status(400).json({ error: 'Workflow name is required' });
        }

        const newWorkflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const workflow = {
          id: newWorkflowId,
          name,
          type,
          phases,
          status: 'initialized',
          currentPhase: phases[0] || 'specification',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata,
          tasks: []
        };

        workflows.set(newWorkflowId, workflow);
        return res.status(201).json(workflow);

      case 'PUT':
        if (!workflowId) {
          return res.status(400).json({ error: 'Workflow ID is required' });
        }

        const existingWorkflow = workflows.get(workflowId);
        if (!existingWorkflow) {
          return res.status(404).json({ error: 'Workflow not found' });
        }

        const updates = req.body;
        const updatedWorkflow = {
          ...existingWorkflow,
          ...updates,
          updatedAt: new Date().toISOString()
        };

        workflows.set(workflowId, updatedWorkflow);
        return res.status(200).json(updatedWorkflow);

      case 'DELETE':
        if (!workflowId) {
          return res.status(400).json({ error: 'Workflow ID is required' });
        }

        const deleted = workflows.delete(workflowId);
        if (!deleted) {
          return res.status(404).json({ error: 'Workflow not found' });
        }

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Workflow API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Helper function to advance workflow phase
export function advanceWorkflowPhase(workflowId) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return null;

  const currentIndex = workflow.phases.indexOf(workflow.currentPhase);
  if (currentIndex < workflow.phases.length - 1) {
    workflow.currentPhase = workflow.phases[currentIndex + 1];
    workflow.updatedAt = new Date().toISOString();
    workflows.set(workflowId, workflow);
  }

  return workflow;
}

// Export for use in other API routes
export { workflows };