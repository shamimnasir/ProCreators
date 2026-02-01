// Admin Feature Controls API (Kill Switches)
import { NextResponse } from 'next/server'
import {
  getFeatureControls,
  updateFeatureControls,
  emergencyKillAll,
  restoreFromEmergencyKill,
  toggleTool,
  getControlAuditLog
} from '@/lib/featureControls'

// GET - Get current feature controls
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAuditLog = searchParams.get('auditLog') === 'true'
    
    const controls = await getFeatureControls()
    
    let response = { success: true, controls }
    
    if (includeAuditLog) {
      const auditLog = await getControlAuditLog(50)
      response.auditLog = auditLog
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error getting controls:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Update controls
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, adminId = 'system', ...params } = body
    
    switch (action) {
      case 'update': {
        // Update specific controls
        const { updates } = params
        const result = await updateFeatureControls(updates, adminId)
        return NextResponse.json(result)
      }
      
      case 'emergency_kill': {
        // Emergency kill all generations
        const { reason } = params
        const result = await emergencyKillAll(adminId, reason || 'Emergency shutdown')
        return NextResponse.json(result)
      }
      
      case 'restore': {
        // Restore from emergency kill
        const result = await restoreFromEmergencyKill(adminId)
        return NextResponse.json(result)
      }
      
      case 'toggle_tool': {
        // Toggle specific tool
        const { toolId, enabled } = params
        if (!toolId || typeof enabled !== 'boolean') {
          return NextResponse.json({ success: false, error: 'toolId and enabled required' }, { status: 400 })
        }
        const result = await toggleTool(toolId, enabled, adminId)
        return NextResponse.json(result)
      }
      
      case 'toggle_feature': {
        // Toggle feature type (video, image, etc.)
        const { featureType, enabled } = params
        const featureKey = `${featureType}GenerationEnabled`
        const result = await updateFeatureControls({ [featureKey]: enabled }, adminId)
        return NextResponse.json(result)
      }
      
      case 'toggle_model': {
        // Toggle specific model
        const { modelId, enabled } = params
        const result = await updateFeatureControls({ [`models.${modelId}`]: enabled }, adminId)
        return NextResponse.json(result)
      }
      
      case 'maintenance_mode': {
        // Toggle maintenance mode
        const { enabled, message } = params
        const updates = { 
          maintenanceMode: enabled,
          maintenanceMessage: message || 'We are currently performing maintenance. Please try again later.'
        }
        const result = await updateFeatureControls(updates, adminId)
        return NextResponse.json(result)
      }
      
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Control operation error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
