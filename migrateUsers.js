import { createClient } from "@supabase/supabase-js";



// Initialize Supabase client with service role key (admin access)
const supabase = createClient(
  "https://jajnueotoourhmfupepb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impham51ZW90b291cmhtZnVwZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzUyMDczOCwiZXhwIjoyMDgzMDk2NzM4fQ.GrSuoMWlE59DErcOBtGrsSkYesp-ThJIhey4QKHp3U4"
);

async function migrateUsers() {
  console.log('Starting user migration to Supabase Auth...');

  try {
    // 1. Fetch users from your 'users' table who don't have an auth_id yet
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, password, name, role, mobile, address, zone_id, store_id, photo, experience')
      .is('auth_id', null); // Only users not yet migrated

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users to migrate.');
      return;
    }

    console.log(`Found ${users.length} users to migrate.`);

    // 2. For each user, create an Auth user and update the table
    for (const user of users) {
      try {
        console.log(`Migrating user: ${user.email}`);

        // Create Auth user (Supabase will hash the password)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email.toLowerCase(),
          password: user.password, // Assumes plain text; Supabase handles hashing
          email_confirm: true, // Auto-confirm (requires setting enabled in Supabase)
          user_metadata: {
            name: user.name,
            role: user.role,
            // Add other metadata if needed
          },
        });

        if (authError) {
          console.error(`Failed to create Auth user for ${user.email}:`, authError.message);
          continue; // Skip this user
        }

        // Update the 'users' table with the new auth_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_id: authData.user.id })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Failed to update users table for ${user.email}:`, updateError.message);
        } else {
          console.log(`Successfully migrated: ${user.email}`);
        }

        // Optional: Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Unexpected error for ${user.email}:`, err.message);
      }
    }

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

// Run the migration
migrateUsers();