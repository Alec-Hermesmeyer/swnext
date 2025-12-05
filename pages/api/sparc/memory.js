// SPARC Memory Management API
const memoryStore = new Map();
const memoryNamespaces = new Map();
const memoryHistory = [];

export default async function handler(req, res) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { namespace = 'default', key, pattern, limit = 100 } = query;
        
        if (key) {
          return getMemoryValue(namespace, key, res);
        }
        
        if (pattern) {
          return searchMemory(namespace, pattern, parseInt(limit), res);
        }
        
        return getNamespaceContents(namespace, parseInt(limit), res);

      case 'POST':
        const { action } = req.body;
        
        switch (action) {
          case 'store':
            return storeMemory(req.body, res);
          
          case 'bulk_store':
            return bulkStoreMemory(req.body, res);
          
          case 'create_namespace':
            return createNamespace(req.body, res);
          
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

      case 'DELETE':
        const { namespace: delNamespace = 'default', key: delKey, pattern: delPattern } = query;
        
        if (delKey) {
          return deleteMemoryValue(delNamespace, delKey, res);
        }
        
        if (delPattern) {
          return deleteByPattern(delNamespace, delPattern, res);
        }
        
        return deleteNamespace(delNamespace, res);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Memory API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Store memory value
async function storeMemory(data, res) {
  const {
    namespace = 'default',
    key,
    value,
    ttl = null,
    metadata = {}
  } = data;

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Key and value are required' });
  }

  const namespaceStore = getOrCreateNamespace(namespace);
  const now = Date.now();
  
  const memoryItem = {
    key,
    value,
    namespace,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: ttl ? new Date(now + ttl * 1000).toISOString() : null,
    metadata
  };

  namespaceStore.set(key, memoryItem);
  
  // Add to history
  memoryHistory.push({
    operation: 'store',
    namespace,
    key,
    timestamp: new Date().toISOString(),
    metadata: { ttl, ...metadata }
  });

  // Keep history limited
  if (memoryHistory.length > 1000) {
    memoryHistory.shift();
  }

  return res.status(200).json({
    success: true,
    key,
    namespace,
    expiresAt: memoryItem.expiresAt,
    createdAt: memoryItem.createdAt
  });
}

// Bulk store multiple values
async function bulkStoreMemory(data, res) {
  const {
    namespace = 'default',
    items = [],
    defaultTtl = null
  } = data;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  const namespaceStore = getOrCreateNamespace(namespace);
  const results = [];
  const now = Date.now();

  for (const item of items) {
    const { key, value, ttl = defaultTtl, metadata = {} } = item;
    
    if (!key || value === undefined) {
      results.push({ key, success: false, error: 'Key and value required' });
      continue;
    }

    const memoryItem = {
      key,
      value,
      namespace,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: ttl ? new Date(now + ttl * 1000).toISOString() : null,
      metadata
    };

    namespaceStore.set(key, memoryItem);
    results.push({ 
      key, 
      success: true, 
      expiresAt: memoryItem.expiresAt 
    });

    // Add to history
    memoryHistory.push({
      operation: 'bulk_store',
      namespace,
      key,
      timestamp: new Date().toISOString()
    });
  }

  return res.status(200).json({
    success: true,
    processed: results.length,
    results
  });
}

// Get memory value
async function getMemoryValue(namespace, key, res) {
  const namespaceStore = memoryNamespaces.get(namespace);
  
  if (!namespaceStore) {
    return res.status(404).json({ error: 'Namespace not found' });
  }

  const item = namespaceStore.get(key);
  
  if (!item) {
    return res.status(404).json({ error: 'Key not found' });
  }

  // Check expiration
  if (item.expiresAt && new Date() > new Date(item.expiresAt)) {
    namespaceStore.delete(key);
    return res.status(404).json({ error: 'Key expired' });
  }

  return res.status(200).json(item);
}

// Search memory by pattern
async function searchMemory(namespace, pattern, limit, res) {
  const namespaceStore = memoryNamespaces.get(namespace);
  
  if (!namespaceStore) {
    return res.status(404).json({ error: 'Namespace not found' });
  }

  const regex = new RegExp(pattern, 'i');
  const matches = [];
  const now = new Date();

  for (const [key, item] of namespaceStore.entries()) {
    // Skip expired items
    if (item.expiresAt && now > new Date(item.expiresAt)) {
      namespaceStore.delete(key);
      continue;
    }

    if (regex.test(key) || regex.test(JSON.stringify(item.value))) {
      matches.push(item);
      
      if (matches.length >= limit) break;
    }
  }

  return res.status(200).json({
    pattern,
    namespace,
    matches: matches.length,
    results: matches
  });
}

// Get namespace contents
async function getNamespaceContents(namespace, limit, res) {
  const namespaceStore = memoryNamespaces.get(namespace);
  
  if (!namespaceStore) {
    return res.status(200).json({
      namespace,
      exists: false,
      items: []
    });
  }

  const items = [];
  const now = new Date();

  for (const [key, item] of namespaceStore.entries()) {
    // Skip expired items
    if (item.expiresAt && now > new Date(item.expiresAt)) {
      namespaceStore.delete(key);
      continue;
    }

    items.push(item);
    
    if (items.length >= limit) break;
  }

  return res.status(200).json({
    namespace,
    exists: true,
    total: namespaceStore.size,
    returned: items.length,
    items
  });
}

// Delete memory value
async function deleteMemoryValue(namespace, key, res) {
  const namespaceStore = memoryNamespaces.get(namespace);
  
  if (!namespaceStore) {
    return res.status(404).json({ error: 'Namespace not found' });
  }

  const deleted = namespaceStore.delete(key);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Key not found' });
  }

  memoryHistory.push({
    operation: 'delete',
    namespace,
    key,
    timestamp: new Date().toISOString()
  });

  return res.status(200).json({ success: true, key, namespace });
}

// Delete by pattern
async function deleteByPattern(namespace, pattern, res) {
  const namespaceStore = memoryNamespaces.get(namespace);
  
  if (!namespaceStore) {
    return res.status(404).json({ error: 'Namespace not found' });
  }

  const regex = new RegExp(pattern, 'i');
  const keysToDelete = [];

  for (const [key, item] of namespaceStore.entries()) {
    if (regex.test(key) || regex.test(JSON.stringify(item.value))) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => {
    namespaceStore.delete(key);
    memoryHistory.push({
      operation: 'delete_pattern',
      namespace,
      key,
      pattern,
      timestamp: new Date().toISOString()
    });
  });

  return res.status(200).json({
    success: true,
    pattern,
    namespace,
    deleted: keysToDelete.length,
    keys: keysToDelete
  });
}

// Create namespace
async function createNamespace(data, res) {
  const {
    namespace,
    metadata = {}
  } = data;

  if (!namespace) {
    return res.status(400).json({ error: 'Namespace name is required' });
  }

  if (memoryNamespaces.has(namespace)) {
    return res.status(409).json({ error: 'Namespace already exists' });
  }

  const store = new Map();
  memoryNamespaces.set(namespace, store);

  // Store namespace metadata
  const namespaceInfo = {
    name: namespace,
    createdAt: new Date().toISOString(),
    metadata
  };

  return res.status(201).json({
    success: true,
    namespace: namespaceInfo
  });
}

// Delete namespace
async function deleteNamespace(namespace, res) {
  if (namespace === 'default') {
    return res.status(400).json({ error: 'Cannot delete default namespace' });
  }

  const deleted = memoryNamespaces.delete(namespace);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Namespace not found' });
  }

  memoryHistory.push({
    operation: 'delete_namespace',
    namespace,
    timestamp: new Date().toISOString()
  });

  return res.status(200).json({ success: true, namespace });
}

// Helper functions
function getOrCreateNamespace(namespace) {
  if (!memoryNamespaces.has(namespace)) {
    memoryNamespaces.set(namespace, new Map());
  }
  return memoryNamespaces.get(namespace);
}

// Cleanup expired items periodically
setInterval(() => {
  const now = new Date();
  
  for (const [namespaceName, namespaceStore] of memoryNamespaces.entries()) {
    for (const [key, item] of namespaceStore.entries()) {
      if (item.expiresAt && now > new Date(item.expiresAt)) {
        namespaceStore.delete(key);
      }
    }
  }
}, 60000); // Run every minute

// Initialize default namespace
getOrCreateNamespace('default');