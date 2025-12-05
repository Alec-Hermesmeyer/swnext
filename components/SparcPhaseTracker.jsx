import React, { useState } from 'react';
import { 
  FileText, 
  Code, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  Clock,
  AlertTriangle,
  Users,
  Play,
  Pause
} from 'lucide-react';

const SparcPhaseTracker = ({ 
  currentPhase = 1, 
  phases = [], 
  onPhaseSelect,
  showDetails = true 
}) => {
  const [expandedPhase, setExpandedPhase] = useState(currentPhase);

  const defaultPhases = [
    {
      id: 1,
      name: 'Specification',
      shortName: 'SPEC',
      icon: FileText,
      description: 'Requirements analysis and project specification',
      status: 'completed',
      progress: 100,
      duration: '45 min',
      agent: 'researcher',
      tasks: [
        { name: 'Analyze user requirements', completed: true },
        { name: 'Define acceptance criteria', completed: true },
        { name: 'Create technical specifications', completed: true }
      ],
      deliverables: ['Requirements Document', 'User Stories', 'Acceptance Criteria']
    },
    {
      id: 2,
      name: 'Pseudocode',
      shortName: 'PSEUDO',
      icon: Code,
      description: 'Algorithm design and pseudocode development',
      status: 'active',
      progress: 65,
      duration: '60 min',
      agent: 'coder',
      tasks: [
        { name: 'Design core algorithms', completed: true },
        { name: 'Create data flow diagrams', completed: true },
        { name: 'Write pseudocode for key functions', completed: false },
        { name: 'Review logic flow', completed: false }
      ],
      deliverables: ['Algorithm Design', 'Pseudocode Files', 'Flow Diagrams']
    },
    {
      id: 3,
      name: 'Architecture',
      shortName: 'ARCH',
      icon: Layers,
      description: 'System architecture and design patterns',
      status: 'pending',
      progress: 0,
      duration: '90 min',
      agent: 'system-architect',
      tasks: [
        { name: 'Design system architecture', completed: false },
        { name: 'Define data models', completed: false },
        { name: 'Plan component structure', completed: false },
        { name: 'Set up development environment', completed: false }
      ],
      deliverables: ['Architecture Diagram', 'Data Models', 'Component Structure']
    },
    {
      id: 4,
      name: 'Refinement',
      shortName: 'REFINE',
      icon: RefreshCw,
      description: 'TDD implementation and iterative refinement',
      status: 'pending',
      progress: 0,
      duration: '120 min',
      agent: 'tester',
      tasks: [
        { name: 'Write unit tests', completed: false },
        { name: 'Implement core features', completed: false },
        { name: 'Code review and optimization', completed: false },
        { name: 'Integration testing', completed: false }
      ],
      deliverables: ['Test Suite', 'Core Implementation', 'Code Review Reports']
    },
    {
      id: 5,
      name: 'Completion',
      shortName: 'DONE',
      icon: CheckCircle2,
      description: 'Final integration, testing, and deployment',
      status: 'pending',
      progress: 0,
      duration: '75 min',
      agent: 'reviewer',
      tasks: [
        { name: 'Final integration testing', completed: false },
        { name: 'Performance optimization', completed: false },
        { name: 'Documentation completion', completed: false },
        { name: 'Deployment preparation', completed: false }
      ],
      deliverables: ['Final Build', 'Documentation', 'Deployment Package']
    }
  ];

  const workingPhases = phases.length > 0 ? phases : defaultPhases;

  const getStatusStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          icon: 'text-green-600',
          text: 'text-green-700'
        };
      case 'active':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          icon: 'text-blue-600',
          text: 'text-blue-700'
        };
      case 'pending':
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          icon: 'text-gray-400',
          text: 'text-gray-500'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          icon: 'text-gray-400',
          text: 'text-gray-500'
        };
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Phase Progress Timeline */}
      <div className="relative mb-8">
        <div className="flex items-center justify-between">
          {workingPhases.map((phase, index) => {
            const Icon = phase.icon;
            const styles = getStatusStyles(phase.status);
            const isLast = index === workingPhases.length - 1;
            
            return (
              <div key={phase.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center relative">
                  {/* Phase Circle */}
                  <button
                    onClick={() => {
                      setExpandedPhase(phase.id);
                      onPhaseSelect?.(phase.id);
                    }}
                    className={`
                      w-16 h-16 rounded-full border-2 ${styles.border} ${styles.bg} 
                      flex items-center justify-center transition-all duration-200
                      hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    `}
                  >
                    <Icon size={24} className={styles.icon} />
                  </button>
                  
                  {/* Phase Name */}
                  <div className="mt-2 text-center">
                    <p className={`font-semibold text-sm ${styles.text}`}>
                      {phase.shortName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {phase.duration}
                    </p>
                  </div>
                  
                  {/* Progress Bar Under Circle */}
                  {phase.status === 'active' && (
                    <div className="absolute -bottom-2 w-16">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Connection Line */}
                {!isLast && (
                  <div className="flex-1 h-px bg-gray-300 mx-4 mt-8">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        phase.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      style={{ 
                        width: phase.status === 'completed' ? '100%' : '0%' 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Phase View */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow-sm border">
          {workingPhases
            .filter(phase => phase.id === expandedPhase)
            .map(phase => {
              const Icon = phase.icon;
              const styles = getStatusStyles(phase.status);
              
              return (
                <div key={phase.id}>
                  {/* Phase Header */}
                  <div className={`p-6 border-b ${styles.bg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${styles.border} bg-white`}>
                          <Icon size={24} className={styles.icon} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {phase.name}
                          </h3>
                          <p className="text-gray-600">{phase.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {phase.progress}%
                          </p>
                        </div>
                        {phase.status === 'active' && (
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <Pause size={16} />
                            Pause
                          </button>
                        )}
                        {phase.status === 'pending' && (
                          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                            <Play size={16} />
                            Start Phase
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-white rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            phase.status === 'completed' ? 'bg-green-500' : 
                            phase.status === 'active' ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Tasks */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Circle size={16} />
                          Tasks ({phase.tasks.filter(t => t.completed).length}/{phase.tasks.length})
                        </h4>
                        <div className="space-y-3">
                          {phase.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                task.completed 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300'
                              }`}>
                                {task.completed && (
                                  <CheckCircle2 size={12} className="text-white" />
                                )}
                              </div>
                              <span className={`text-sm ${
                                task.completed ? 'text-gray-900 line-through' : 'text-gray-700'
                              }`}>
                                {task.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Phase Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Assigned Agent</span>
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {phase.agent}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Estimated Duration</span>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {phase.duration}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status</span>
                            <span className={`text-sm font-medium ${styles.text}`}>
                              {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h5 className="font-medium text-gray-900 mb-2">Deliverables</h5>
                          <div className="space-y-1">
                            {phase.deliverables.map((deliverable, index) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <ArrowRight size={12} className="text-gray-400" />
                                {deliverable}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default SparcPhaseTracker;