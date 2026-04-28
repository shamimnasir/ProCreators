import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || process.env.MONGO_DB_NAME || 'procreators'

let client = null
let db = null

export async function connectToDatabase() {
  if (db) {
    return { db, client }
  }

  try {
    client = new MongoClient(MONGO_URL)
    await client.connect()
    db = client.db(DB_NAME)
    
    console.log('Connected to MongoDB')
    return { db, client }
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

export async function getCollection(collectionName) {
  const { db } = await connectToDatabase()
  return db.collection(collectionName)
}
