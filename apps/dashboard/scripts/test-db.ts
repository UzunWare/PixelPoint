/**
 * Test Database Connection Script
 *
 * This script attempts to connect to Supabase and list projects.
 * Run with: npx tsx scripts/test-db.ts
 *
 * Make sure you have set up .env.local with your Supabase credentials.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import type { Database, Project } from '@pixelpoint/shared-types';

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Missing environment variables!');
    console.warn('   Please create .env.local with:');
    console.warn('   - NEXT_PUBLIC_SUPABASE_URL');
    console.warn('   - NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
    console.warn('   Copy from .env.local.example and fill in your values.\n');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   URL: ${supabaseUrl}\n`);

  // Create client
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  try {
    // Test connection by querying projects table
    console.log('📊 Attempting to query projects table...\n');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error querying projects:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);

      if (error.code === 'PGRST116') {
        console.log('\n💡 Hint: The table might not exist yet.');
        console.log('   Run the schema.sql file in your Supabase SQL Editor.');
      }
      process.exit(1);
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log(`   Found ${data?.length || 0} project(s)\n`);

    if (data && data.length > 0) {
      console.log('📋 Projects:');
      (data as Project[]).forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} (${project.url})`);
      });
    } else {
      console.log('   No projects found. Create one in the dashboard!');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();
