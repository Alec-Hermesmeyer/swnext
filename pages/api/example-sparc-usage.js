// Example: Complete SPARC Workflow Backend Usage
import { sparcWorkflowMiddleware, sparcAuthMiddleware, composeSparMiddleware } from '../../lib/sparc-middleware.js';
import sparcServer from '../../lib/sparc-server.js';

// Example API route demonstrating full SPARC integration
async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        return await createExampleWorkflow(req, res);
      
      case 'GET':
        return await getWorkflowStatus(req, res);
      
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Example SPARC API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Create a complete SPARC workflow example
async function createExampleWorkflow(req, res) {
  const {
    projectName = 'Example Project',
    requirements = ['user authentication', 'data management', 'responsive UI'],
    agentId = 'example-agent'
  } = req.body;

  // Step 1: Initialize workflow
  const workflow = await sparcServer.initializeWorkflow(
    projectName,
    'sparc',
    { requirements, initiatedBy: agentId }
  );

  // Step 2: Register agent if provided
  if (agentId) {
    await req.sparc.client.registerAgent({
      id: agentId,
      type: 'backend-dev',
      capabilities: ['workflow_management', 'api_development', 'database_design'],
      workflowId: workflow.id,
      metadata: { example: true }
    });
  }

  // Step 3: Create tasks for each SPARC phase
  const tasks = [];
  const phases = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];

  for (const [index, phase] of phases.entries()) {
    const task = await req.sparc.client.createTask({
      workflowId: workflow.id,
      name: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`,
      phase,
      type: 'development',
      priority: index < 2 ? 'high' : 'medium',
      description: getPhaseDescription(phase, requirements),
      dependencies: index > 0 ? [tasks[index - 1].id] : [],
      metadata: { 
        automated: true,
        requirements: requirements.filter(req => isRelevantForPhase(req, phase))
      }
    });
    
    tasks.push(task);
  }

  // Step 4: Analyze project and generate initial specification
  const projectAnalysis = await sparcServer.analyzeProject(workflow.id);
  const specification = await sparcServer.generateSpecification(requirements, workflow.id);

  // Step 5: Store initial context in memory
  await req.sparc.storeMemory('project_context', {
    workflow,
    tasks: tasks.map(t => t.id),
    analysis: projectAnalysis,
    specification,
    createdAt: new Date().toISOString()
  });

  // Step 6: Report progress
  await res.sparc.reportProgress(
    { phase: 'initialization', completed: true },
    `Created SPARC workflow "${projectName}" with ${tasks.length} tasks`
  );

  // Step 7: Notify other agents
  await res.sparc.notifyAgents(
    `New SPARC workflow "${projectName}" created and ready for collaboration`
  );

  return res.status(201).json({
    success: true,
    workflow: {
      id: workflow.id,
      name: workflow.name,
      phases: workflow.phases,
      currentPhase: workflow.currentPhase,
      status: workflow.status
    },
    tasks: tasks.map(task => ({
      id: task.id,
      name: task.name,
      phase: task.phase,
      priority: task.priority,
      status: task.status
    })),
    analysis: {
      frameworks: projectAnalysis.frameworks,
      dependencies: projectAnalysis.dependencies,
      metrics: {
        totalFiles: projectAnalysis.codeMetrics?.totalFiles || 0,
        totalLines: projectAnalysis.codeMetrics?.totalLines || 0
      }
    },
    specification: {
      requirements: specification.requirements,
      recommendations: specification.recommendations
    },
    nextSteps: [
      'Begin specification phase development',
      'Coordinate with frontend agents',
      'Set up development environment',
      'Initialize testing framework'
    ]
  });
}

// Get workflow status with comprehensive information
async function getWorkflowStatus(req, res) {
  const { workflowId } = req.query;

  if (!workflowId) {
    return res.status(400).json({ error: 'workflowId is required' });
  }

  try {
    // Get workflow details
    const workflow = await req.sparc.client.getWorkflow(workflowId);
    
    // Get all tasks for workflow
    const tasks = await req.sparc.client.getTasksByWorkflow(workflowId);
    
    // Get project context from memory
    const projectContext = await req.sparc.getMemory('project_context');
    
    // Get coordination messages
    const messages = await req.sparc.client.getCoordinationMessages(workflowId, 20);
    
    // Get active agents for this workflow
    const allAgents = await req.sparc.client.getActiveAgents();
    const workflowAgents = allAgents.filter(agent => agent.workflowId === workflowId);

    // Calculate progress
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    const progressPercentage = Math.round((completedTasks.length / tasks.length) * 100);

    // Get phase-specific information
    const currentPhaseInfo = await getPhaseInfo(workflow.currentPhase, workflowId, req.sparc.client);

    return res.status(200).json({
      workflow: {
        ...workflow,
        progress: {
          percentage: progressPercentage,
          completed: completedTasks.length,
          inProgress: inProgressTasks.length,
          total: tasks.length
        }
      },
      tasks: tasks.map(task => ({
        ...task,
        duration: calculateTaskDuration(task),
        isOverdue: isTaskOverdue(task)
      })),
      agents: workflowAgents.map(agent => ({
        id: agent.id,
        type: agent.type,
        status: agent.status,
        lastActivity: agent.lastActivity,
        capabilities: agent.capabilities
      })),
      currentPhase: currentPhaseInfo,
      recentActivity: messages.slice(0, 10),
      projectContext: projectContext || {},
      recommendations: generateWorkflowRecommendations(workflow, tasks, workflowAgents),
      healthCheck: await sparcServer.healthCheck()
    });

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    throw error;
  }
}

// Helper functions
function getPhaseDescription(phase, requirements) {
  const descriptions = {
    specification: `Analyze requirements and create detailed specification: ${requirements.join(', ')}`,
    pseudocode: 'Design algorithms and data structures in pseudocode format',
    architecture: 'Design system architecture and component relationships',
    refinement: 'Implement Test-Driven Development and refine code quality',
    completion: 'Finalize integration, testing, and deployment preparation'
  };
  
  return descriptions[phase] || `Complete ${phase} phase of development`;
}

function isRelevantForPhase(requirement, phase) {
  const phaseRelevance = {
    specification: ['authentication', 'user', 'data', 'api'],
    pseudocode: ['algorithm', 'logic', 'calculation'],
    architecture: ['database', 'api', 'integration', 'security'],
    refinement: ['testing', 'performance', 'optimization'],
    completion: ['deployment', 'monitoring', 'documentation']
  };
  
  const relevantKeywords = phaseRelevance[phase] || [];
  return relevantKeywords.some(keyword => requirement.toLowerCase().includes(keyword));
}

async function getPhaseInfo(phase, workflowId, client) {
  try {
    const phaseTasks = await client.listTasks({ workflowId, phase });
    const completedPhaseTasks = phaseTasks.filter(task => task.status === 'completed');
    
    return {
      name: phase,
      tasks: phaseTasks.length,
      completed: completedPhaseTasks.length,
      progress: phaseTasks.length > 0 ? Math.round((completedPhaseTasks.length / phaseTasks.length) * 100) : 0,
      description: getPhaseDescription(phase, []),
      nextPhase: getNextPhase(phase)
    };
  } catch (error) {
    return {
      name: phase,
      error: 'Could not load phase information'
    };
  }
}

function getNextPhase(currentPhase) {
  const phases = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
  const currentIndex = phases.indexOf(currentPhase);
  
  if (currentIndex >= 0 && currentIndex < phases.length - 1) {
    return phases[currentIndex + 1];
  }
  
  return null;
}

function calculateTaskDuration(task) {
  if (!task.startedAt) return null;
  
  const startTime = new Date(task.startedAt);
  const endTime = task.completedAt ? new Date(task.completedAt) : new Date();
  
  return Math.round((endTime - startTime) / 1000 / 60); // minutes
}

function isTaskOverdue(task) {
  // Simple overdue logic - tasks should complete within 2 hours
  if (!task.startedAt || task.status === 'completed') return false;
  
  const startTime = new Date(task.startedAt);
  const now = new Date();
  const hoursElapsed = (now - startTime) / 1000 / 60 / 60;
  
  return hoursElapsed > 2;
}

function generateWorkflowRecommendations(workflow, tasks, agents) {
  const recommendations = [];
  
  // Progress recommendations
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const progressPercentage = (completedTasks.length / tasks.length) * 100;
  
  if (progressPercentage < 20) {
    recommendations.push({
      type: 'progress',
      priority: 'high',
      message: 'Workflow is in early stages. Consider assigning more agents to accelerate progress.'
    });
  }
  
  // Agent recommendations
  if (agents.length === 0) {
    recommendations.push({
      type: 'agents',
      priority: 'critical',
      message: 'No agents assigned to workflow. Register agents to begin task execution.'
    });
  } else if (agents.length < 3) {
    recommendations.push({
      type: 'agents',
      priority: 'medium',
      message: 'Consider adding specialized agents (tester, reviewer) for better coverage.'
    });
  }
  
  // Phase recommendations
  const currentPhase = workflow.currentPhase;
  if (currentPhase === 'specification') {
    recommendations.push({
      type: 'phase',
      priority: 'high',
      message: 'Focus on completing requirements analysis and stakeholder alignment.'
    });
  }
  
  // Task recommendations
  const overdueTasks = tasks.filter(isTaskOverdue);
  if (overdueTasks.length > 0) {
    recommendations.push({
      type: 'tasks',
      priority: 'high',
      message: `${overdueTasks.length} task(s) may be overdue. Consider reassignment or additional resources.`
    });
  }
  
  return recommendations;
}

// Apply middleware composition
export default composeSparMiddleware(
  sparcAuthMiddleware,
  sparcWorkflowMiddleware
)(handler);