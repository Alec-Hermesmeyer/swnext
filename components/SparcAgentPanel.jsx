import React, { useState, useEffect } from 'react';
import {
  Users,
  Cpu,
  Brain,
  Zap,
  Settings,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  GitBranch,
  Target,
  BarChart3,
  Layers,
  Plus,
  MoreHorizontal,
  Eye,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

const SparcAgentPanel = () => {
  const [selectedTopology, setSelectedTopology] = useState('mesh');
  const [agentFilter, setAgentFilter] = useState('all');
  const [showMetrics, setShowMetrics] = useState(true);
  const [swarmStatus, setSwarmStatus] = useState('active');

  const topologies = [
    {
      id: 'mesh',
      name: 'Mesh Network',
      description: 'All agents can communicate directly',
      icon: GitBranch,
      efficiency: 95,
      coordination: 'Excellent'
    },
    {
      id: 'hierarchical',
      name: 'Hierarchical',
      description: 'Tree-like command structure',
      icon: Layers,
      efficiency: 88,
      coordination: 'Good'
    },
    {
      id: 'star',
      name: 'Star Network',
      description: 'Central coordinator hub',
      icon: Target,
      efficiency: 82,
      coordination: 'Moderate'
    },
    {
      id: 'ring',
      name: 'Ring Network',
      description: 'Sequential communication chain',
      icon: RotateCcw,
      efficiency: 75,
      coordination: 'Fair'
    }
  ];

  const agents = [
    {
      id: 'coord-001',
      name: 'Master Coordinator',
      type: 'coordinator',
      status: 'active',
      currentTask: 'Orchestrating SPARC workflow',
      performance: 98,
      memoryUsage: 45,
      tasksCompleted: 12,
      connections: ['researcher-001', 'coder-001', 'architect-001'],
      capabilities: ['task-orchestration', 'agent-coordination', 'workflow-management'],
      cognitivePattern: 'systems-thinking',
      learningRate: 0.85
    },
    {
      id: 'researcher-001',
      name: 'Research Specialist',
      type: 'researcher',
      status: 'active',
      currentTask: 'Analyzing API requirements',
      performance: 92,
      memoryUsage: 32,
      tasksCompleted: 8,
      connections: ['coord-001', 'coder-001'],
      capabilities: ['requirements-analysis', 'documentation', 'research-synthesis'],
      cognitivePattern: 'convergent-thinking',
      learningRate: 0.78
    },
    {
      id: 'coder-001',
      name: 'Code Generator',
      type: 'coder',
      status: 'active',
      currentTask: 'Generating pseudocode',
      performance: 89,
      memoryUsage: 58,
      tasksCompleted: 15,
      connections: ['coord-001', 'researcher-001', 'tester-001'],
      capabilities: ['code-generation', 'algorithm-design', 'pseudocode-creation'],
      cognitivePattern: 'lateral-thinking',
      learningRate: 0.82
    },
    {
      id: 'architect-001',
      name: 'System Architect',
      type: 'system-architect',
      status: 'idle',
      currentTask: null,
      performance: 95,
      memoryUsage: 28,
      tasksCompleted: 6,
      connections: ['coord-001', 'coder-001'],
      capabilities: ['system-design', 'architecture-planning', 'integration-design'],
      cognitivePattern: 'systems-thinking',
      learningRate: 0.91
    },
    {
      id: 'tester-001',
      name: 'Quality Assurance',
      type: 'tester',
      status: 'idle',
      currentTask: null,
      performance: 87,
      memoryUsage: 35,
      tasksCompleted: 9,
      connections: ['coord-001', 'coder-001'],
      capabilities: ['test-generation', 'quality-assurance', 'bug-detection'],
      cognitivePattern: 'critical-thinking',
      learningRate: 0.79
    },
    {
      id: 'reviewer-001',
      name: 'Code Reviewer',
      type: 'reviewer',
      status: 'standby',
      currentTask: null,
      performance: 90,
      memoryUsage: 22,
      tasksCompleted: 4,
      connections: ['coord-001'],
      capabilities: ['code-review', 'best-practices', 'security-analysis'],
      cognitivePattern: 'critical-thinking',
      learningRate: 0.86
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'idle': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'standby': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAgentTypeIcon = (type) => {
    switch (type) {
      case 'coordinator': return Target;
      case 'researcher': return Brain;
      case 'coder': return Cpu;
      case 'system-architect': return Layers;
      case 'tester': return CheckCircle2;
      case 'reviewer': return Eye;
      default: return Users;
    }
  };

  const filteredAgents = agents.filter(agent => 
    agentFilter === 'all' || agent.status === agentFilter
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="text-blue-600" />
              Agent Coordination Panel
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and coordinate AI agents across the SPARC workflow
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Swarm Status: <span className={`font-semibold ${
                swarmStatus === 'active' ? 'text-green-600' :
                swarmStatus === 'paused' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {swarmStatus.charAt(0).toUpperCase() + swarmStatus.slice(1)}
              </span>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus size={16} />
              Spawn Agent
            </button>
          </div>
        </div>

        {/* Topology Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Topology</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {topologies.map((topology) => {
              const Icon = topology.icon;
              return (
                <button
                  key={topology.id}
                  onClick={() => setSelectedTopology(topology.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTopology === topology.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon size={20} className={selectedTopology === topology.id ? 'text-blue-600' : 'text-gray-400'} />
                    <span className="font-medium text-gray-900">{topology.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{topology.description}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Efficiency: {topology.efficiency}%</span>
                    <span className="text-gray-500">{topology.coordination}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Agents</p>
                <p className="text-2xl font-bold text-blue-900">{agents.length}</p>
              </div>
              <Users className="text-blue-500" size={24} />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {agents.filter(a => a.status === 'active').length}
                </p>
              </div>
              <Activity className="text-green-500" size={24} />
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Idle</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {agents.filter(a => a.status === 'idle').length}
                </p>
              </div>
              <Pause className="text-yellow-500" size={24} />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Avg Performance</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(agents.reduce((sum, a) => sum + a.performance, 0) / agents.length)}%
                </p>
              </div>
              <BarChart3 className="text-purple-500" size={24} />
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Tasks Complete</p>
                <p className="text-2xl font-bold text-orange-900">
                  {agents.reduce((sum, a) => sum + a.tasksCompleted, 0)}
                </p>
              </div>
              <CheckCircle2 className="text-orange-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Agent Status</h2>
            <div className="flex items-center gap-4">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Agents</option>
                <option value="active">Active Only</option>
                <option value="idle">Idle Only</option>
                <option value="standby">Standby Only</option>
              </select>
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showMetrics ? 'Hide' : 'Show'} Metrics
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAgents.map((agent) => {
              const Icon = getAgentTypeIcon(agent.type);
              return (
                <div key={agent.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                  {/* Agent Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <p className="text-sm text-gray-600">{agent.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Current Task */}
                  {agent.currentTask ? (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={14} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Current Task</span>
                      </div>
                      <p className="text-sm text-blue-800">{agent.currentTask}</p>
                    </div>
                  ) : (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Pause size={14} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">No Active Task</span>
                      </div>
                      <p className="text-sm text-gray-600">Agent is available for assignment</p>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  {showMetrics && (
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Performance</span>
                        <span className="text-sm font-medium text-gray-900">{agent.performance}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${agent.performance}%` }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Memory</span>
                          <span className="font-medium">{agent.memoryUsage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tasks</span>
                          <span className="font-medium">{agent.tasksCompleted}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Learning Rate</span>
                        <span className="font-medium">{agent.learningRate}</span>
                      </div>
                    </div>
                  )}

                  {/* Capabilities */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((capability, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Connections */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Connected Agents ({agent.connections.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {agent.connections.map((connection, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {connection}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cognitive Pattern */}
                  <div className="flex items-center gap-2 text-sm">
                    <Brain size={14} className="text-purple-600" />
                    <span className="text-gray-600">Cognitive Pattern:</span>
                    <span className="font-medium text-purple-700">{agent.cognitivePattern}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                      <Settings size={14} />
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Communication Log */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Inter-Agent Communication</h2>
          <p className="text-gray-600 text-sm mt-1">Recent coordination messages between agents</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">coordinator</span> → <span className="font-medium">researcher</span>
                </p>
                <p className="text-sm text-gray-600">Task assignment: Begin API requirements analysis</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">researcher</span> → <span className="font-medium">coder</span>
                </p>
                <p className="text-sm text-gray-600">Knowledge sharing: User authentication requirements completed</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">coder</span> → <span className="font-medium">coordinator</span>
                </p>
                <p className="text-sm text-gray-600">Status update: Pseudocode generation 75% complete</p>
                <p className="text-xs text-gray-500">8 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SparcAgentPanel;