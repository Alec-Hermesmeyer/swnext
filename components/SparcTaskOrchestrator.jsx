import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square,
  Settings,
  Users,
  GitBranch,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Filter,
  Search,
  Plus,
  ArrowRight,
  Cpu,
  Activity,
  BarChart3
} from 'lucide-react';

const SparcTaskOrchestrator = () => {
  const [selectedStrategy, setSelectedStrategy] = useState('adaptive');
  const [activeTasks, setActiveTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [workflowState, setWorkflowState] = useState('ready');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data
  const orchestrationStrategies = [
    { id: 'parallel', name: 'Parallel', description: 'Execute tasks simultaneously', icon: GitBranch },
    { id: 'sequential', name: 'Sequential', description: 'Execute tasks one after another', icon: ArrowRight },
    { id: 'adaptive', name: 'Adaptive', description: 'AI-optimized task execution', icon: Zap },
    { id: 'balanced', name: 'Balanced', description: 'Optimize for resources and speed', icon: BarChart3 }
  ];

  const mockTasks = [
    {
      id: 'task-1',
      name: 'Analyze API Requirements',
      description: 'Research and document API specifications for the user authentication system',
      status: 'running',
      progress: 75,
      assignedAgent: 'researcher',
      priority: 'high',
      estimatedTime: '15 min',
      dependencies: [],
      phase: 'specification'
    },
    {
      id: 'task-2', 
      name: 'Design Authentication Flow',
      description: 'Create pseudocode for user authentication and session management',
      status: 'pending',
      progress: 0,
      assignedAgent: 'coder',
      priority: 'high',
      estimatedTime: '20 min',
      dependencies: ['task-1'],
      phase: 'pseudocode'
    },
    {
      id: 'task-3',
      name: 'Setup Database Schema',
      description: 'Design and implement database tables for user management',
      status: 'pending',
      progress: 0,
      assignedAgent: 'system-architect',
      priority: 'medium',
      estimatedTime: '30 min',
      dependencies: ['task-2'],
      phase: 'architecture'
    },
    {
      id: 'task-4',
      name: 'Write Unit Tests',
      description: 'Create comprehensive test suite for authentication functions',
      status: 'pending',
      progress: 0,
      assignedAgent: 'tester',
      priority: 'medium',
      estimatedTime: '25 min',
      dependencies: ['task-3'],
      phase: 'refinement'
    }
  ];

  const mockAgents = [
    {
      id: 'researcher',
      name: 'Research Agent',
      type: 'researcher',
      status: 'active',
      currentTask: 'task-1',
      capabilities: ['requirements-analysis', 'documentation', 'research'],
      performance: 92,
      tasksCompleted: 3
    },
    {
      id: 'coder',
      name: 'Coding Agent',
      type: 'coder',
      status: 'idle',
      currentTask: null,
      capabilities: ['pseudocode', 'implementation', 'algorithms'],
      performance: 88,
      tasksCompleted: 7
    },
    {
      id: 'system-architect',
      name: 'Architecture Agent',
      type: 'system-architect',
      status: 'idle',
      currentTask: null,
      capabilities: ['system-design', 'database-design', 'integration'],
      performance: 95,
      tasksCompleted: 4
    },
    {
      id: 'tester',
      name: 'Testing Agent',
      type: 'tester',
      status: 'idle',
      currentTask: null,
      capabilities: ['unit-testing', 'integration-testing', 'quality-assurance'],
      performance: 90,
      tasksCompleted: 5
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const startOrchestration = () => {
    setWorkflowState('running');
    // Mock workflow start logic
  };

  const pauseOrchestration = () => {
    setWorkflowState('paused');
  };

  const stopOrchestration = () => {
    setWorkflowState('stopped');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Cpu className="text-blue-600" />
              SPARC Task Orchestrator
            </h1>
            <p className="text-gray-600 mt-1">
              Coordinate and manage AI agent tasks across SPARC workflow phases
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Status: <span className={`font-semibold ${
                workflowState === 'running' ? 'text-green-600' :
                workflowState === 'paused' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {workflowState.charAt(0).toUpperCase() + workflowState.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={startOrchestration}
                disabled={workflowState === 'running'}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Play size={16} />
                Start
              </button>
              <button
                onClick={pauseOrchestration}
                disabled={workflowState !== 'running'}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Pause size={16} />
                Pause
              </button>
              <button
                onClick={stopOrchestration}
                disabled={workflowState === 'ready'}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Square size={16} />
                Stop
              </button>
            </div>
          </div>
        </div>

        {/* Orchestration Strategy */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orchestration Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {orchestrationStrategies.map((strategy) => {
              const Icon = strategy.icon;
              return (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedStrategy === strategy.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon size={20} className={selectedStrategy === strategy.id ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="font-medium text-gray-900">{strategy.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{strategy.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Queue */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Task Queue</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus size={16} />
                Add Task
              </button>
            </div>
            
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {mockTasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{task.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{task.assignedAgent}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{task.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity size={14} />
                          <span>{task.phase}</span>
                        </div>
                      </div>
                      
                      {task.dependencies.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span>Dependencies: {task.dependencies.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {task.status === 'running' && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{task.progress}%</div>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Status Panel */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Active Agents</h2>
            <p className="text-gray-600 text-sm mt-1">
              {mockAgents.filter(a => a.status === 'active').length} of {mockAgents.length} agents active
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {mockAgents.map((agent) => (
                <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-600">{agent.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {agent.status}
                      </span>
                    </div>
                  </div>
                  
                  {agent.currentTask && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        Working on: <span className="font-medium">{agent.currentTask}</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Performance</span>
                      <span className="font-medium text-gray-900">{agent.performance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${agent.performance}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tasks Completed</span>
                      <span className="font-medium text-gray-900">{agent.tasksCompleted}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((capability, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Orchestration Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-sm text-gray-600">Active Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">2.8x</div>
            <div className="text-sm text-gray-600">Speed Improvement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">85%</div>
            <div className="text-sm text-gray-600">Resource Efficiency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">32.3%</div>
            <div className="text-sm text-gray-600">Token Reduction</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SparcTaskOrchestrator;