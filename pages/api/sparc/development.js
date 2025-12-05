// SPARC Development Support API
import fs from 'fs';
import path from 'path';

const developmentState = new Map();
const codeSnapshots = new Map();

export default async function handler(req, res) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { action } = query;
        
        switch (action) {
          case 'project_structure':
            return getProjectStructure(req, res);
          
          case 'file_content':
            return getFileContent(req, res);
          
          case 'snapshots':
            return getSnapshots(req, res);
          
          case 'development_state':
            return getDevelopmentState(req, res);
          
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

      case 'POST':
        const { action: postAction } = req.body;
        
        switch (postAction) {
          case 'create_snapshot':
            return createSnapshot(req, res);
          
          case 'save_state':
            return saveDevelopmentState(req, res);
          
          case 'analyze_code':
            return analyzeCode(req, res);
          
          case 'validate_implementation':
            return validateImplementation(req, res);
          
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Development API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get project structure
async function getProjectStructure(req, res) {
  const { depth = 2, includeNodeModules = false } = req.query;
  
  try {
    const projectRoot = process.cwd();
    const structure = await scanDirectory(projectRoot, parseInt(depth), includeNodeModules === 'true');
    
    return res.status(200).json({
      root: projectRoot,
      structure,
      scannedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to scan project structure' });
  }
}

// Get file content with metadata
async function getFileContent(req, res) {
  const { filePath, encoding = 'utf8' } = req.query;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const absolutePath = path.resolve(process.cwd(), filePath);
    
    // Security check - ensure path is within project
    if (!absolutePath.startsWith(process.cwd())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await fs.promises.stat(absolutePath);
    const content = await fs.promises.readFile(absolutePath, encoding);
    
    return res.status(200).json({
      filePath,
      content,
      metadata: {
        size: stats.size,
        modified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString(),
        encoding
      }
    });
  } catch (error) {
    return res.status(404).json({ error: 'File not found or not readable' });
  }
}

// Create code snapshot
async function createSnapshot(req, res) {
  const {
    name,
    description = '',
    files = [],
    metadata = {}
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Snapshot name is required' });
  }

  try {
    const snapshotId = `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const snapshot = {
      id: snapshotId,
      name,
      description,
      createdAt: new Date().toISOString(),
      metadata,
      files: []
    };

    // Capture file contents
    for (const filePath of files) {
      try {
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (absolutePath.startsWith(process.cwd())) {
          const content = await fs.promises.readFile(absolutePath, 'utf8');
          const stats = await fs.promises.stat(absolutePath);
          
          snapshot.files.push({
            path: filePath,
            content,
            size: stats.size,
            modified: stats.mtime.toISOString()
          });
        }
      } catch (error) {
        console.warn(`Failed to capture file: ${filePath}`, error.message);
      }
    }

    codeSnapshots.set(snapshotId, snapshot);
    
    return res.status(201).json({
      snapshotId,
      name,
      filesCaptured: snapshot.files.length,
      createdAt: snapshot.createdAt
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create snapshot' });
  }
}

// Get snapshots
async function getSnapshots(req, res) {
  const { limit = 20, offset = 0 } = req.query;
  
  const allSnapshots = Array.from(codeSnapshots.values());
  const sortedSnapshots = allSnapshots
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  return res.status(200).json({
    snapshots: sortedSnapshots.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      createdAt: s.createdAt,
      fileCount: s.files.length,
      metadata: s.metadata
    })),
    total: allSnapshots.length
  });
}

// Save development state
async function saveDevelopmentState(req, res) {
  const {
    workflowId,
    phase,
    state,
    metadata = {}
  } = req.body;

  if (!workflowId || !phase) {
    return res.status(400).json({ error: 'workflowId and phase are required' });
  }

  const stateKey = `${workflowId}-${phase}`;
  const stateData = {
    workflowId,
    phase,
    state,
    metadata,
    savedAt: new Date().toISOString()
  };

  developmentState.set(stateKey, stateData);
  
  return res.status(200).json({ 
    success: true,
    stateKey,
    savedAt: stateData.savedAt
  });
}

// Get development state
async function getDevelopmentState(req, res) {
  const { workflowId, phase } = req.query;
  
  if (workflowId && phase) {
    const stateKey = `${workflowId}-${phase}`;
    const state = developmentState.get(stateKey);
    
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }
    
    return res.status(200).json(state);
  }

  // Return all states for workflow
  if (workflowId) {
    const workflowStates = Array.from(developmentState.values())
      .filter(s => s.workflowId === workflowId);
    
    return res.status(200).json(workflowStates);
  }

  // Return all states
  return res.status(200).json(Array.from(developmentState.values()));
}

// Analyze code quality and patterns
async function analyzeCode(req, res) {
  const {
    files = [],
    analysisType = 'basic',
    options = {}
  } = req.body;

  if (!files.length) {
    return res.status(400).json({ error: 'Files are required for analysis' });
  }

  try {
    const analysis = {
      analysisType,
      startedAt: new Date().toISOString(),
      files: [],
      summary: {
        totalFiles: files.length,
        totalLines: 0,
        issues: [],
        patterns: []
      }
    };

    // Basic file analysis
    for (const filePath of files) {
      try {
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (!absolutePath.startsWith(process.cwd())) continue;

        const content = await fs.promises.readFile(absolutePath, 'utf8');
        const lines = content.split('\n');
        const stats = await fs.promises.stat(absolutePath);
        
        const fileAnalysis = {
          path: filePath,
          lines: lines.length,
          size: stats.size,
          extension: path.extname(filePath),
          issues: analyzeFileContent(content, filePath),
          patterns: detectPatterns(content, filePath)
        };

        analysis.files.push(fileAnalysis);
        analysis.summary.totalLines += lines.length;
        analysis.summary.issues.push(...fileAnalysis.issues);
        analysis.summary.patterns.push(...fileAnalysis.patterns);
      } catch (error) {
        console.warn(`Failed to analyze file: ${filePath}`, error.message);
      }
    }

    analysis.completedAt = new Date().toISOString();
    
    return res.status(200).json(analysis);
  } catch (error) {
    return res.status(500).json({ error: 'Code analysis failed' });
  }
}

// Validate implementation against SPARC phases
async function validateImplementation(req, res) {
  const {
    workflowId,
    phase,
    files = [],
    criteria = {}
  } = req.body;

  if (!workflowId || !phase) {
    return res.status(400).json({ error: 'workflowId and phase are required' });
  }

  const validation = {
    workflowId,
    phase,
    validatedAt: new Date().toISOString(),
    passed: true,
    score: 0,
    results: [],
    recommendations: []
  };

  // Phase-specific validation
  switch (phase) {
    case 'specification':
      validation.results.push(...validateSpecification(files));
      break;
    case 'architecture':
      validation.results.push(...validateArchitecture(files));
      break;
    case 'implementation':
      validation.results.push(...validateImplementationPhase(files));
      break;
    case 'testing':
      validation.results.push(...validateTesting(files));
      break;
    default:
      validation.results.push(...validateGeneral(files));
  }

  // Calculate overall score
  const passedCount = validation.results.filter(r => r.passed).length;
  validation.score = validation.results.length > 0 
    ? (passedCount / validation.results.length) * 100 
    : 0;
  
  validation.passed = validation.score >= 70; // 70% threshold

  return res.status(200).json(validation);
}

// Helper functions
async function scanDirectory(dirPath, maxDepth, includeNodeModules, currentDepth = 0) {
  if (currentDepth >= maxDepth) return null;

  try {
    const items = await fs.promises.readdir(dirPath);
    const structure = {};

    for (const item of items) {
      if (!includeNodeModules && item === 'node_modules') continue;
      if (item.startsWith('.') && item !== '.env' && item !== '.gitignore') continue;

      const itemPath = path.join(dirPath, item);
      const stats = await fs.promises.stat(itemPath);

      if (stats.isDirectory()) {
        structure[item] = await scanDirectory(itemPath, maxDepth, includeNodeModules, currentDepth + 1);
      } else {
        structure[item] = {
          type: 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          extension: path.extname(item)
        };
      }
    }

    return structure;
  } catch (error) {
    return null;
  }
}

function analyzeFileContent(content, filePath) {
  const issues = [];
  const lines = content.split('\n');

  // Basic code quality checks
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    // Check for TODO/FIXME comments
    if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
      issues.push({
        type: 'todo',
        line: lineNumber,
        message: 'TODO/FIXME found',
        severity: 'info'
      });
    }

    // Check for console.log in non-development files
    if (trimmedLine.includes('console.log') && !filePath.includes('dev')) {
      issues.push({
        type: 'debug',
        line: lineNumber,
        message: 'Console.log found in production code',
        severity: 'warning'
      });
    }

    // Check for very long lines
    if (line.length > 120) {
      issues.push({
        type: 'formatting',
        line: lineNumber,
        message: 'Line too long (>120 characters)',
        severity: 'info'
      });
    }
  });

  return issues;
}

function detectPatterns(content, filePath) {
  const patterns = [];
  const ext = path.extname(filePath);

  // React component pattern
  if (ext === '.jsx' || ext === '.tsx') {
    if (content.includes('export default function') || content.includes('export default const')) {
      patterns.push({ type: 'react-functional-component', confidence: 0.9 });
    }
    if (content.includes('useState') || content.includes('useEffect')) {
      patterns.push({ type: 'react-hooks', confidence: 0.95 });
    }
  }

  // API route pattern
  if (filePath.includes('/api/')) {
    if (content.includes('export default') && content.includes('req, res')) {
      patterns.push({ type: 'nextjs-api-route', confidence: 0.9 });
    }
  }

  return patterns;
}

function validateSpecification(files) {
  return [
    { name: 'Has specification files', passed: files.some(f => f.includes('spec') || f.includes('requirement')), message: 'Specification documentation found' }
  ];
}

function validateArchitecture(files) {
  return [
    { name: 'Has architecture files', passed: files.some(f => f.includes('architecture') || f.includes('design')), message: 'Architecture documentation found' }
  ];
}

function validateImplementationPhase(files) {
  return [
    { name: 'Has implementation files', passed: files.some(f => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx')), message: 'Implementation files found' }
  ];
}

function validateTesting(files) {
  return [
    { name: 'Has test files', passed: files.some(f => f.includes('test') || f.includes('spec')), message: 'Test files found' }
  ];
}

function validateGeneral(files) {
  return [
    { name: 'Has source files', passed: files.length > 0, message: 'Source files present' }
  ];
}