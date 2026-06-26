
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = "https://zoninfaxfxtxcannieeq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbmluZmF4Znh0eGNhbm5pZWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTA4NTksImV4cCI6MjA2NDUyNjg1OX0.NHkzxX0-O0WI_xxEHbdaPsbQKZPPaVISzs4-p9SPjl0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportData() {
  try {
    console.log('Starting data export from Supabase...');

    // Export contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*');
    
    if (contactsError) throw contactsError;

    // Export properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*');
    
    if (propertiesError) throw propertiesError;

    // Export follow_ups
    const { data: followUps, error: followUpsError } = await supabase
      .from('follow_ups')
      .select('*');
    
    if (followUpsError) throw followUpsError;

    // Export contact (legacy table)
    const { data: contactLegacy, error: contactLegacyError } = await supabase
      .from('contact')
      .select('*');
    
    if (contactLegacyError) throw contactLegacyError;

    // Export user_roles
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('*');
    
    if (userRolesError) throw userRolesError;

    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save data to JSON files
    fs.writeFileSync(path.join(dataDir, 'contacts.json'), JSON.stringify(contacts, null, 2));
    fs.writeFileSync(path.join(dataDir, 'properties.json'), JSON.stringify(properties, null, 2));
    fs.writeFileSync(path.join(dataDir, 'follow_ups.json'), JSON.stringify(followUps, null, 2));
    fs.writeFileSync(path.join(dataDir, 'contact_legacy.json'), JSON.stringify(contactLegacy, null, 2));
    fs.writeFileSync(path.join(dataDir, 'user_roles.json'), JSON.stringify(userRoles, null, 2));

    console.log('Data export completed successfully!');
    console.log(`Exported ${contacts?.length || 0} contacts`);
    console.log(`Exported ${properties?.length || 0} properties`);
    console.log(`Exported ${followUps?.length || 0} follow-ups`);
    console.log(`Exported ${contactLegacy?.length || 0} legacy contacts`);
    console.log(`Exported ${userRoles?.length || 0} user roles`);

  } catch (error) {
    console.error('Export failed:', error);
  }
}

exportData();
