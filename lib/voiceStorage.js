import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGO_URL

if (!MONGODB_URI) {
  throw new Error('Please define the MONGO_URL environment variable')
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(MONGODB_URI)
  clientPromise = client.connect()
}

export async function getDatabase() {
  const client = await clientPromise
  return client.db('procreators')
}

export async function getVoicesCollection() {
  const db = await getDatabase()
  return db.collection('cloned_voices')
}

// Voice database operations
export class VoiceStorage {
  static async saveVoice(voiceData) {
    try {
      const collection = await getVoicesCollection()
      
      const voice = {
        voice_id: voiceData.voice_id,
        voice_name: voiceData.voice_name,
        description: voiceData.description || '',
        language: voiceData.language || 'bn',
        provider: 'elevenlabs',
        user_id: voiceData.user_id || 'default', // For future multi-user support
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        file_size: voiceData.file_size || 0,
        tags: voiceData.tags || []
      }

      const result = await collection.insertOne(voice)
      return { success: true, id: result.insertedId, voice }
    } catch (error) {
      console.error('Error saving voice to database:', error)
      return { success: false, error: error.message }
    }
  }

  static async getVoices(userId = 'default') {
    try {
      const collection = await getVoicesCollection()
      
      const voices = await collection
        .find({ 
          user_id: userId, 
          is_active: true 
        })
        .sort({ created_at: -1 })
        .toArray()

      return { success: true, voices }
    } catch (error) {
      console.error('Error fetching voices from database:', error)
      return { success: false, error: error.message }
    }
  }

  static async updateVoice(voiceId, updateData) {
    try {
      const collection = await getVoicesCollection()
      
      const result = await collection.updateOne(
        { voice_id: voiceId, is_active: true },
        { 
          $set: { 
            ...updateData, 
            updated_at: new Date() 
          } 
        }
      )

      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('Error updating voice in database:', error)
      return { success: false, error: error.message }
    }
  }

  static async deleteVoice(voiceId) {
    try {
      const collection = await getVoicesCollection()
      
      // Soft delete - mark as inactive instead of removing
      const result = await collection.updateOne(
        { voice_id: voiceId },
        { 
          $set: { 
            is_active: false, 
            updated_at: new Date() 
          } 
        }
      )

      return { success: true, modifiedCount: result.modifiedCount }
    } catch (error) {
      console.error('Error deleting voice from database:', error)
      return { success: false, error: error.message }
    }
  }

  static async incrementUsage(voiceId) {
    try {
      const collection = await getVoicesCollection()
      
      const result = await collection.updateOne(
        { voice_id: voiceId, is_active: true },
        { 
          $inc: { usage_count: 1 },
          $set: { updated_at: new Date() }
        }
      )

      return { success: true }
    } catch (error) {
      console.error('Error incrementing voice usage:', error)
      return { success: false, error: error.message }
    }
  }

  static async searchVoices(query, userId = 'default') {
    try {
      const collection = await getVoicesCollection()
      
      const voices = await collection
        .find({ 
          user_id: userId, 
          is_active: true,
          $or: [
            { voice_name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
          ]
        })
        .sort({ created_at: -1 })
        .toArray()

      return { success: true, voices }
    } catch (error) {
      console.error('Error searching voices:', error)
      return { success: false, error: error.message }
    }
  }
}

export default clientPromise