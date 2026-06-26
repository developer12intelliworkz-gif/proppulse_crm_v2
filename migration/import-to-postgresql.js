
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL configuration - update these with your database details
const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

async function importData() {
  const client = await pool.connect();
  
  try {
    console.log('Starting data import to PostgreSQL...');

    // Read exported data
    const dataDir = path.join(__dirname, 'data');
    
    const contacts = JSON.parse(fs.readFileSync(path.join(dataDir, 'contacts.json'), 'utf8'));
    const properties = JSON.parse(fs.readFileSync(path.join(dataDir, 'properties.json'), 'utf8'));
    const followUps = JSON.parse(fs.readFileSync(path.join(dataDir, 'follow_ups.json'), 'utf8'));
    const contactLegacy = JSON.parse(fs.readFileSync(path.join(dataDir, 'contact_legacy.json'), 'utf8'));
    const userRoles = JSON.parse(fs.readFileSync(path.join(dataDir, 'user_roles.json'), 'utf8'));

    // Import contacts
    console.log('Importing contacts...');
    for (const contact of contacts) {
      await client.query(`
        INSERT INTO contacts (
          id, user_id, name, email, phone, location, status, type, properties,
          lead_score, referral_source, campaign_source, last_contact, lead_source,
          lead_source_details, current_scenario, budget, timeline, requirements,
          assigned_agent, notes, communication_preference, social_media, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        ON CONFLICT (id) DO NOTHING
      `, [
        contact.id, contact.user_id, contact.name, contact.email, contact.phone,
        contact.location, contact.status, contact.type, contact.properties,
        contact.lead_score, contact.referral_source, contact.campaign_source,
        contact.last_contact, contact.lead_source, contact.lead_source_details,
        contact.current_scenario, contact.budget, contact.timeline, contact.requirements,
        contact.assigned_agent, contact.notes, contact.communication_preference,
        contact.social_media, contact.created_at
      ]);
    }

    // Import properties
    console.log('Importing properties...');
    for (const property of properties) {
      await client.query(`
        INSERT INTO properties (
          id, user_id, address, city, state, zip_code, type, price, beds, baths,
          sqft, description, status, listing_date, agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO NOTHING
      `, [
        property.id, property.user_id, property.address, property.city, property.state,
        property.zip_code, property.type, property.price, property.beds, property.baths,
        property.sqft, property.description, property.status, property.listing_date,
        property.agent, property.created_at
      ]);
    }

    // Import follow_ups
    console.log('Importing follow-ups...');
    for (const followUp of followUps) {
      await client.query(`
        INSERT INTO follow_ups (
          id, user_id, title, contact, property, type, priority, status,
          due_date, due_time, description, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [
        followUp.id, followUp.user_id, followUp.title, followUp.contact,
        followUp.property, followUp.type, followUp.priority, followUp.status,
        followUp.due_date, followUp.due_time, followUp.description, followUp.created_at
      ]);
    }

    // Import legacy contact data
    console.log('Importing legacy contacts...');
    for (const contact of contactLegacy) {
      await client.query(`
        INSERT INTO contact (id, user_id, name, email, phone, location, type, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        contact.id, contact.user_id, contact.name, contact.email, contact.phone,
        contact.location, contact.type, contact.status, contact.created_at
      ]);
    }

    // Import user_roles
    console.log('Importing user roles...');
    for (const userRole of userRoles) {
      await client.query(`
        INSERT INTO user_roles ("UUID", role, created_at)
        VALUES ($1, $2, $3)
        ON CONFLICT ("UUID") DO NOTHING
      `, [userRole.UUID, userRole.role, userRole.created_at]);
    }

    console.log('Data import completed successfully!');

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

importData();
