#!/usr/bin/env tsx

/**
 * Generate API Key Script
 *
 * Usage:
 *   tsx src/scripts/generate-api-key.ts <user_id> <name>
 *
 * Example:
 *   tsx src/scripts/generate-api-key.ts test-user-id "Claude Desktop"
 */

import { createHash, randomBytes } from 'crypto';
import { supabase } from '../services/supabase.js';

// Generate a random API key with mc_ prefix
function generateApiKey(): string {
  const randomHex = randomBytes(16).toString('hex'); // 32 hex characters
  return `mc_${randomHex}`;
}

// Hash API key with SHA-256
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Create key preview (first 4 + ... + last 4 characters)
function createKeyPreview(key: string): string {
  if (key.length < 12) return key;
  return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Error: Missing required arguments');
    console.error('Usage: tsx src/scripts/generate-api-key.ts <user_id> <name>');
    console.error('Example: tsx src/scripts/generate-api-key.ts test-user-id "Claude Desktop"');
    process.exit(1);
  }

  const [userId, name] = args;

  console.log('Generating API key...\n');

  // Generate API key
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const keyPreview = createKeyPreview(apiKey);

  try {
    // Insert into database
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        key_preview: keyPreview,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating API key:', error.message);
      process.exit(1);
    }

    // Display success message
    console.log('✅ API Key created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANT: Copy this key now. It will not be shown again!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`API Key: ${apiKey}\n`);
    console.log('Key Details:');
    console.log(`  ID:         ${data.id}`);
    console.log(`  Name:       ${name}`);
    console.log(`  User ID:    ${userId}`);
    console.log(`  Preview:    ${keyPreview}`);
    console.log(`  Created:    ${data.created_at}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Usage:');
    console.log(`  Authorization: Bearer ${apiKey}\n`);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
