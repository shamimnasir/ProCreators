// Feature Controls / Kill Switch Library
// Allows disabling features globally or per-tool

import { connectToDatabase } from './mongodb'

const DEFAULT_CONTROLS = {
  // Global toggles
  globalEnabled: true,
  videoGenerationEnabled: true,
  imageGenerationEnabled: true,
  audioGenerationEnabled: true,
  textGenerationEnabled: true,
  pdfGenerationEnabled: true,
  
  // Model-specific toggles
  models: {
    'gpt-4o': true,
    'gpt-4o-mini': true,
    'claude-3-sonnet': true,
    'claude-3-haiku': true,
    'gemini-pro': true,
    'dall-e-3': true,
    'stable-diffusion': true
  },
  
  // Tool-specific toggles
  tools: {},
  
  // Maintenance mode
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing maintenance. Please try again later.'
}

// Get current feature controls
export async function getFeatureControls() {
  try {
    const { db } = await connectToDatabase()
    const controls = await db.collection('system_controls').findOne({ _id: 'feature_controls' })
    
    return controls || DEFAULT_CONTROLS
  } catch (error) {
    console.error('Error getting feature controls:', error)
    return DEFAULT_CONTROLS
  }
}

// Update feature controls
export async function updateFeatureControls(updates, adminId) {
  const { db } = await connectToDatabase()
  
  // Log the change
  await db.collection('control_audit_log').insertOne({
    action: 'update_controls',
    changes: updates,
    adminId,
    timestamp: new Date()
  })
  
  // Update controls
  const result = await db.collection('system_controls').updateOne(
    { _id: 'feature_controls' },
    { 
      $set: { 
        ...updates,
        lastUpdatedBy: adminId,
        lastUpdatedAt: new Date()
      }
    },
    { upsert: true }
  )
  
  return { success: true, result }
}

// Check if a feature is enabled
export async function isFeatureEnabled(featureType, toolId = null) {
  const controls = await getFeatureControls()
  
  // Check maintenance mode first
  if (controls.maintenanceMode) {
    return {
      enabled: false,
      reason: controls.maintenanceMessage || 'System is under maintenance'
    }
  }
  
  // Check global toggle
  if (!controls.globalEnabled) {
    return {
      enabled: false,
      reason: 'All generations are temporarily disabled'
    }
  }
  
  // Check feature type toggle
  const featureToggles = {
    'video': controls.videoGenerationEnabled,
    'image': controls.imageGenerationEnabled,
    'audio': controls.audioGenerationEnabled,
    'text': controls.textGenerationEnabled,
    'pdf': controls.pdfGenerationEnabled
  }
  
  if (featureToggles[featureType] === false) {
    return {
      enabled: false,
      reason: `${featureType.charAt(0).toUpperCase() + featureType.slice(1)} generation is temporarily disabled`
    }
  }
  
  // Check tool-specific toggle
  if (toolId && controls.tools?.[toolId] === false) {
    return {
      enabled: false,
      reason: 'This tool is temporarily unavailable'
    }
  }
  
  return { enabled: true }
}

// Check if a model is enabled
export async function isModelEnabled(modelId) {
  const controls = await getFeatureControls()
  
  if (controls.models?.[modelId] === false) {
    return {
      enabled: false,
      reason: `Model ${modelId} is temporarily disabled`
    }
  }
  
  return { enabled: true }
}

// Emergency kill all generations
export async function emergencyKillAll(adminId, reason) {
  const { db } = await connectToDatabase()
  
  // Log the emergency action
  await db.collection('control_audit_log').insertOne({
    action: 'emergency_kill_all',
    reason,
    adminId,
    timestamp: new Date()
  })
  
  // Disable everything
  await db.collection('system_controls').updateOne(
    { _id: 'feature_controls' },
    { 
      $set: { 
        globalEnabled: false,
        emergencyKillActive: true,
        emergencyKillReason: reason,
        emergencyKillBy: adminId,
        emergencyKillAt: new Date()
      }
    },
    { upsert: true }
  )
  
  return { success: true, message: 'Emergency kill activated' }
}

// Restore from emergency kill
export async function restoreFromEmergencyKill(adminId) {
  const { db } = await connectToDatabase()
  
  // Log the restore
  await db.collection('control_audit_log').insertOne({
    action: 'restore_from_emergency',
    adminId,
    timestamp: new Date()
  })
  
  // Re-enable
  await db.collection('system_controls').updateOne(
    { _id: 'feature_controls' },
    { 
      $set: { 
        globalEnabled: true,
        emergencyKillActive: false,
        restoredBy: adminId,
        restoredAt: new Date()
      }
    }
  )
  
  return { success: true, message: 'System restored' }
}

// Toggle specific tool
export async function toggleTool(toolId, enabled, adminId) {
  const { db } = await connectToDatabase()
  
  await db.collection('control_audit_log').insertOne({
    action: enabled ? 'enable_tool' : 'disable_tool',
    toolId,
    adminId,
    timestamp: new Date()
  })
  
  await db.collection('system_controls').updateOne(
    { _id: 'feature_controls' },
    { 
      $set: { 
        [`tools.${toolId}`]: enabled,
        lastUpdatedBy: adminId,
        lastUpdatedAt: new Date()
      }
    },
    { upsert: true }
  )
  
  return { success: true }
}

// Get audit log
export async function getControlAuditLog(limit = 100) {
  const { db } = await connectToDatabase()
  
  return db.collection('control_audit_log')
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray()
}
