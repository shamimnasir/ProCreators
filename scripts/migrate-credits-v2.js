#!/usr/bin/env node

/**
 * Credit System Migration Script — v1 to v2
 * 
 * Converts all existing user credits from the old system (1 credit = $0.001)
 * to the new simplified system (1 credit ≈ $0.02).
 * 
 * Conversion factor: divide by 20
 * 
 * Old → New examples:
 *   19,000 → 950 (Creator plan)
 *   49,000 → 2,450 (Pro plan)
 *   99,000 → 4,950 (Business plan)
 *   500 → 25 (Free tier)
 * 
 * This script is IDEMPOTENT — it checks for a migration flag and will not run twice.
 * 
 * Usage: node scripts/migrate-credits-v2.js
 */

const { MongoClient } = require('mongodb')

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017'
const DB_NAME = process.env.DB_NAME || process.env.MONGO_DB_NAME || 'procreators'
const CONVERSION_FACTOR = 20
const MIGRATION_ID = 'credit-system-v2-simplification'

async function migrate() {
  console.log('🔄 Credit System Migration v1 → v2')
  console.log(`   Conversion factor: ÷${CONVERSION_FACTOR}`)
  console.log(`   Database: ${DB_NAME}`)
  console.log('')

  const client = new MongoClient(MONGO_URL)
  
  try {
    await client.connect()
    const db = client.db(DB_NAME)

    // Check if migration already ran
    const existingMigration = await db.collection('migrations').findOne({ _id: MIGRATION_ID })
    if (existingMigration) {
      console.log('⚠️  Migration already completed on:', existingMigration.completedAt)
      console.log('   Skipping. To re-run, delete the migration record first.')
      return
    }

    // Get all users
    const users = await db.collection('users').find({}).toArray()
    console.log(`📊 Found ${users.length} users to migrate`)

    let updated = 0
    let skipped = 0
    
    for (const user of users) {
      const oldMembership = user.membershipCredits || 0
      const oldPurchased = user.purchasedCredits || 0
      const oldCredits = user.credits || 0
      const oldTotal = oldMembership + oldPurchased

      // Skip users with 0 credits
      if (oldTotal === 0 && oldCredits === 0) {
        skipped++
        continue
      }

      // Convert credits (divide by CONVERSION_FACTOR, round up to not lose value)
      const newMembership = Math.ceil(oldMembership / CONVERSION_FACTOR)
      const newPurchased = Math.ceil(oldPurchased / CONVERSION_FACTOR)
      const newCredits = Math.ceil(oldCredits / CONVERSION_FACTOR)

      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            membershipCredits: newMembership,
            purchasedCredits: newPurchased,
            credits: newCredits,
            creditSystemVersion: 2,
            creditsMigratedAt: new Date(),
            _oldCredits: { // Keep backup of old values
              membershipCredits: oldMembership,
              purchasedCredits: oldPurchased,
              credits: oldCredits
            }
          }
        }
      )

      console.log(`   ✅ ${user.email || user._id}: ${oldTotal} → ${newMembership + newPurchased} credits`)
      updated++
    }

    // Also clear any custom pricing overrides (they use old values)
    const customPricing = await db.collection('credit_pricing').findOne({ _id: 'tool-pricing' })
    if (customPricing?.tools) {
      console.log('\n🔧 Clearing custom tool pricing overrides (old values no longer valid)')
      await db.collection('credit_pricing').deleteOne({ _id: 'tool-pricing' })
    }

    // Record migration
    await db.collection('migrations').insertOne({
      _id: MIGRATION_ID,
      completedAt: new Date(),
      usersUpdated: updated,
      usersSkipped: skipped,
      conversionFactor: CONVERSION_FACTOR,
      oldCreditValue: 0.001,
      newCreditValue: 0.02
    })

    console.log('')
    console.log('✅ Migration complete!')
    console.log(`   Updated: ${updated} users`)
    console.log(`   Skipped: ${skipped} users (0 credits)`)
    console.log(`   Old credit backups stored in user._oldCredits field`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

migrate()
