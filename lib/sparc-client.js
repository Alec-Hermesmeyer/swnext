// SPARC Backend Client Library
class SparcClient {
  constructor(baseUrl = '/api/sparc') {
    this.baseUrl = baseUrl;
  }

  // Workflow Management
  async createWorkflow(workflowData) {
    return this.request('/workflow', 'POST', workflowData);
  }

  async getWorkflow(workflowId) {
    return this.request(`/workflow?id=${workflowId}`);
  }

  async updateWorkflow(workflowId, updates) {
    return this.request(`/workflow?id=${workflowId}`, 'PUT', updates);
  }

  async deleteWorkflow(workflowId) {
    return this.request(`/workflow?id=${workflowId}`, 'DELETE');
  }

  async listWorkflows() {
    return this.request('/workflow');
  }

  // Task Management
  async createTask(taskData) {
    return this.request('/tasks', 'POST', taskData);
  }

  async getTask(taskId) {
    return this.request(`/tasks?id=${taskId}`);
  }

  async updateTask(taskId, updates) {
    return this.request(`/tasks?id=${taskId}`, 'PUT', updates);
  }

  async deleteTask(taskId) {
    return this.request(`/tasks?id=${taskId}`, 'DELETE');
  }

  async listTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tasks?${params}`);
  }

  async getTasksByWorkflow(workflowId) {
    return this.request(`/tasks?workflowId=${workflowId}`);
  }

  async getTasksByPhase(phase) {
    return this.request(`/tasks?phase=${phase}`);
  }

  // Coordination
  async registerAgent(agentData) {
    return this.request('/coordination', 'POST', {
      action: 'register_agent',
      agent: agentData
    });
  }

  async notifyAgents(message, workflowId = null, targetAgents = []) {
    return this.request('/coordination', 'POST', {
      action: 'notify',
      message,
      workflowId,
      targetAgents
    });
  }

  async requestTaskAssignment(agentId, workflowId = null, capabilities = []) {
    return this.request('/coordination', 'POST', {
      action: 'request_assignment',
      agentId,
      workflowId,
      capabilities
    });
  }

  async reportProgress(agentId, taskId = null, progress = {}, status = null, message = '') {
    return this.request('/coordination', 'POST', {
      action: 'report_progress',
      agentId,
      taskId,
      progress,
      status,
      message
    });
  }

  async getActiveAgents() {
    return this.request('/coordination?type=agents');
  }

  async getCoordinationMessages(workflowId = null, limit = 50) {
    const params = new URLSearchParams({ type: 'messages', limit });
    if (workflowId) params.set('workflowId', workflowId);
    return this.request(`/coordination?${params}`);
  }

  async getCoordinationStatus() {
    return this.request('/coordination');
  }

  // Memory Management
  async storeMemory(namespace = 'default', key, value, ttl = null, metadata = {}) {
    return this.request('/memory', 'POST', {
      action: 'store',
      namespace,
      key,
      value,
      ttl,
      metadata
    });
  }

  async getMemory(namespace = 'default', key) {
    return this.request(`/memory?namespace=${namespace}&key=${key}`);
  }

  async searchMemory(namespace = 'default', pattern, limit = 100) {
    return this.request(`/memory?namespace=${namespace}&pattern=${pattern}&limit=${limit}`);
  }

  async deleteMemory(namespace = 'default', key) {
    return this.request(`/memory?namespace=${namespace}&key=${key}`, 'DELETE');
  }

  async bulkStoreMemory(namespace = 'default', items = [], defaultTtl = null) {
    return this.request('/memory', 'POST', {
      action: 'bulk_store',
      namespace,
      items,
      defaultTtl
    });
  }

  async getNamespaceContents(namespace = 'default', limit = 100) {
    return this.request(`/memory?namespace=${namespace}&limit=${limit}`);
  }

  // Development Support
  async getProjectStructure(depth = 2, includeNodeModules = false) {
    return this.request(`/development?action=project_structure&depth=${depth}&includeNodeModules=${includeNodeModules}`);
  }

  async getFileContent(filePath, encoding = 'utf8') {
    return this.request(`/development?action=file_content&filePath=${encodeURIComponent(filePath)}&encoding=${encoding}`);
  }

  async createSnapshot(name, description = '', files = [], metadata = {}) {
    return this.request('/development', 'POST', {
      action: 'create_snapshot',
      name,
      description,
      files,
      metadata
    });
  }

  async getSnapshots(limit = 20, offset = 0) {
    return this.request(`/development?action=snapshots&limit=${limit}&offset=${offset}`);
  }

  async saveDevelopmentState(workflowId, phase, state, metadata = {}) {
    return this.request('/development', 'POST', {
      action: 'save_state',
      workflowId,
      phase,
      state,
      metadata
    });
  }

  async getDevelopmentState(workflowId, phase = null) {
    const params = new URLSearchParams({ action: 'development_state', workflowId });
    if (phase) params.set('phase', phase);
    return this.request(`/development?${params}`);
  }

  async analyzeCode(files = [], analysisType = 'basic', options = {}) {
    return this.request('/development', 'POST', {
      action: 'analyze_code',
      files,
      analysisType,
      options
    });
  }

  async validateImplementation(workflowId, phase, files = [], criteria = {}) {
    return this.request('/development', 'POST', {
      action: 'validate_implementation',
      workflowId,
      phase,
      files,
      criteria
    });
  }

  // Status and Monitoring
  async getSystemOverview() {
    return this.request('/status?type=overview');
  }

  async getHealthStatus() {
    return this.request('/status?type=health');
  }

  async getSystemMetrics() {
    return this.request('/status?type=metrics');
  }

  async getPerformanceMetrics() {
    return this.request('/status?type=performance');
  }

  async getAgentStatus() {
    return this.request('/status?type=agents');
  }

  async getWorkflowStatus() {
    return this.request('/status?type=workflows');
  }

  async getTaskStatus() {
    return this.request('/status?type=tasks');
  }

  // Utility method for making requests
  async request(endpoint, method = 'GET', body = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`SPARC API Error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
    }

    // Handle empty responses (like DELETE)
    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
  }

  // Convenience methods for common workflows
  async startSparcWorkflow(name, metadata = {}) {
    const workflow = await this.createWorkflow({
      name,
      type: 'sparc',
      phases: ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'],
      metadata
    });

    // Create initial tasks for each phase
    const phases = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
    const tasks = [];

    for (const phase of phases) {
      const task = await this.createTask({
        workflowId: workflow.id,
        name: `${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`,
        phase,
        type: 'development',
        priority: 'medium',
        description: `Complete the ${phase} phase of the SPARC workflow`
      });
      tasks.push(task);
    }

    return { workflow, tasks };
  }

  async completeTask(taskId, results = {}, nextStatus = 'completed') {
    return this.updateTask(taskId, {
      status: nextStatus,
      completedAt: new Date().toISOString(),
      metadata: { results }
    });
  }

  async advanceWorkflowPhase(workflowId) {
    const workflow = await this.getWorkflow(workflowId);
    const currentIndex = workflow.phases.indexOf(workflow.currentPhase);
    
    if (currentIndex < workflow.phases.length - 1) {
      const nextPhase = workflow.phases[currentIndex + 1];
      return this.updateWorkflow(workflowId, {
        currentPhase: nextPhase,
        status: 'in_progress'
      });
    } else {
      return this.updateWorkflow(workflowId, {
        status: 'completed'
      });
    }
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SparcClient;
}

// Also make it available globally in browsers
if (typeof window !== 'undefined') {
  window.SparcClient = SparcClient;
}

export default SparcClient;