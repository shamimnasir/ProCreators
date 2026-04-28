import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS — same-origin only (proxy.js handles cross-origin block)
function handleCORS(response, request) {
  // Echo back the same-origin's Origin header so credentialed requests work,
  // but never set a wildcard or untrusted Origin.
  try {
    const origin = request?.headers?.get('origin')
    if (origin) {
      const host = request.headers.get('host')
      const allowedHosts = new Set([host])
      if (process.env.NEXT_PUBLIC_BASE_URL) {
        try { allowedHosts.add(new URL(process.env.NEXT_PUBLIC_BASE_URL).host) } catch (_) {}
      }
      const originHost = new URL(origin).host
      if (allowedHosts.has(originHost) || originHost.endsWith('.emergentagent.com')) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Vary', 'Origin')
      }
    }
  } catch (_) { /* no-op */ }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }), request)
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint - GET /api/root (since /api/ is not accessible with catch-all)
    if (route === '/root' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }), request)
    }
    // Root endpoint - GET /api/root (since /api/ is not accessible with catch-all)
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Hello World" }), request)
    }

    // Status endpoints - POST /api/status
    if (route === '/status' && method === 'POST') {
      const body = await request.json()
      
      if (!body.client_name) {
        return handleCORS(NextResponse.json(
          { error: "client_name is required" }, 
          { status: 400 }
        ), request)
      }

      const statusObj = {
        id: uuidv4(),
        client_name: body.client_name,
        timestamp: new Date()
      }

      await db.collection('status_checks').insertOne(statusObj)
      return handleCORS(NextResponse.json(statusObj), request)
    }

    // Status endpoints - GET /api/status
    if (route === '/status' && method === 'GET') {
      const statusChecks = await db.collection('status_checks')
        .find({})
        .limit(1000)
        .toArray()

      // Remove MongoDB's _id field from response
      const cleanedStatusChecks = statusChecks.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedStatusChecks), request)
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ), request)

  } catch (error) {
    // SECURITY: Don't leak stack traces or internal details in production
    console.error('API Error:', error?.message)
    const isDev = process.env.NODE_ENV !== 'production'
    return handleCORS(NextResponse.json(
      { error: "Internal server error", ...(isDev ? { detail: error?.message } : {}) },
      { status: 500 }
    ), request)
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute