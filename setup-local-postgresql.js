
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Real Estate CRM with PostgreSQL...\n');

// Check if PostgreSQL is installed
function checkPostgreSQL() {
  return new Promise((resolve, reject) => {
    exec('psql --version', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ PostgreSQL is not installed or not in PATH');
        console.log('Please install PostgreSQL first:');
        console.log('- Windows: Download from https://www.postgresql.org/download/windows/');
        console.log('- macOS: brew install postgresql');
        console.log('- Linux: sudo apt-get install postgresql postgresql-contrib');
        reject(error);
      } else {
        console.log('✅ PostgreSQL is installed:', stdout.trim());
        resolve();
      }
    });
  });
}

// Create database
function createDatabase() {
  return new Promise((resolve, reject) => {
    console.log('📊 Creating database...');
    exec('createdb real_estate_crm', (error, stdout, stderr) => {
      if (error) {
        if (error.message.includes('already exists')) {
          console.log('✅ Database already exists');
          resolve();
        } else {
          console.log('❌ Error creating database:', error.message);
          console.log('Try manually: createdb real_estate_crm');
          reject(error);
        }
      } else {
        console.log('✅ Database created successfully');
        resolve();
      }
    });
  });
}

// Run schema
function runSchema() {
  return new Promise((resolve, reject) => {
    console.log('📋 Running database schema...');
    exec('psql -d real_estate_crm -f database/schema.sql', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error running schema:', error.message);
        console.log('Try manually: psql -d real_estate_crm -f database/schema.sql');
        reject(error);
      } else {
        console.log('✅ Schema applied successfully');
        resolve();
      }
    });
  });
}

// Install API dependencies
function installDependencies() {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing API dependencies...');
    exec('cd api && npm install', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Error installing dependencies:', error.message);
        reject(error);
      } else {
        console.log('✅ Dependencies installed successfully');
        resolve();
      }
    });
  });
}

// Main setup function
async function setup() {
  try {
    await checkPostgreSQL();
    await createDatabase();
    await runSchema();
    await installDependencies();
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update api/.env with your PostgreSQL password');
    console.log('2. Start the API server: cd api && npm start');
    console.log('3. Start the frontend: npm run dev');
    console.log('\n🔑 Demo login credentials:');
    console.log('- Admin: admin@demo.com / admin123');
    console.log('- Manager: manager@demo.com / admin123');
    console.log('- Agent: agent@demo.com / admin123');
    
  } catch (error) {
    console.log('\n❌ Setup failed. Please check the errors above and try again.');
  }
}

setup();
