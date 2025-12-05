import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Code, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Users, 
  BarChart3,
  PlayCircle,
  PauseCircle,
  Activity,
  Layers,
  GitBranch,
  Target,
  Zap
} from 'lucide-react';

const SparcWorkflowDashboard = () => {
  const [activePhase, setActivePhase] = useState(0);
  const [workflowStatus, setWorkflowStatus] = useState('ready');
  const [agentsActive, setAgentsActive] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  const sparcPhases = [
    {
      name: 'Specification',
      icon: FileText,
      description: 'Requirements analysis and project specification',
      status: 'completed',
      progress: 100,
      tasks: ['Analyze requirements', 'Define user stories', 'Create specifications'],
      agent: 'researcher'
    },
    {
      name: 'Pseudocode',
      icon: Code,
      description: 'Algorithm design and pseudocode development',
      status: 'in-progress', 
      progress: 75,
      tasks: ['Design algorithms', 'Create pseudocode', 'Review logic flow'],
      agent: 'coder'
    },
    {
      name: 'Architecture',
      icon: Layers,
      description: 'System architecture and design patterns',
      status: 'pending',
      progress: 0,
      tasks: ['Design system architecture', 'Define data models', 'Plan integrations'],
      agent: 'system-architect'
    },
    {
      name: 'Refinement',
      icon: RefreshCw,
      description: 'TDD implementation and code refinement',
      status: 'pending',
      progress: 0,
      tasks: ['Write tests', 'Implement features', 'Code review'],
      agent: 'tester'
    },
    {
      name: 'Completion',
      icon: CheckCircle2,
      description: 'Integration and deployment',
      status: 'pending',
      progress: 0,
      tasks: ['Integration testing', 'Performance optimization', 'Deployment'],
      agent: 'reviewer'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-700';
      case 'in-progress': return 'text-blue-700';
      case 'pending': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="text-blue-600" />
                SPARC Workflow Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Specification • Pseudocode • Architecture • Refinement • Completion
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={16} />
                <span>{agentsActive} Active Agents</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Activity size={16} />
                <span>Status: {workflowStatus}</span>
              </div>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                onClick={() => setWorkflowStatus(workflowStatus === 'running' ? 'paused' : 'running')}
              >
                {workflowStatus === 'running' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                {workflowStatus === 'running' ? 'Pause' : 'Start'} Workflow
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">35%</p>
              </div>
              <BarChart3 className="text-blue-500" size={24} />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Phase</p>
                <p className="text-2xl font-bold text-gray-900">Pseudocode</p>
              </div>
              <Target className="text-green-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasks Completed</p>
                <p className="text-2xl font-bold text-gray-900">{tasksCompleted}/{totalTasks}</p>
              </div>
              <CheckCircle2 className="text-purple-500" size={24} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estimated Time</p>
                <p className="text-2xl font-bold text-gray-900">2.5h</p>
              </div>
              <Clock className="text-orange-500" size={24} />
            </div>
          </div>
        </div>

        {/* SPARC Phases */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">SPARC Methodology Phases</h2>
            <p className="text-gray-600 mt-1">Track progress through each phase of development</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {sparcPhases.map((phase, index) => {
                const Icon = phase.icon;
                return (
                  <div key={index} className="flex items-center gap-6">
                    {/* Phase Icon and Status */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`p-3 rounded-lg ${getStatusColor(phase.status)} ${getStatusColor(phase.status) === 'bg-gray-300' ? 'text-gray-600' : 'text-white'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                          <span className={`text-sm font-medium ${getStatusTextColor(phase.status)}`}>
                            {phase.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{phase.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Users size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-500">{phase.agent}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-32">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{phase.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStatusColor(phase.status)}`}
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="w-64">
                      <div className="space-y-1">
                        {phase.tasks.slice(0, 2).map((task, taskIndex) => (
                          <div key={taskIndex} className="text-sm text-gray-600 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                            {task}
                          </div>
                        ))}
                        {phase.tasks.length > 2 && (
                          <div className="text-sm text-gray-400">+{phase.tasks.length - 2} more</div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details
                      </button>
                      {phase.status === 'pending' && (
                        <button className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 transition-colors">
                          Start Phase
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Specification phase completed</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Pseudocode agent started algorithm design</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Research agent completed requirements analysis</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Agents</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Code size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Coder Agent</p>
                      <p className="text-xs text-gray-500">Pseudocode Phase</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <FileText size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Research Agent</p>
                      <p className="text-xs text-gray-500">Standby</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-500">Idle</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SparcWorkflowDashboard;