
# CRM Migration from Supabase to PostgreSQL

This guide will help you migrate your CRM data from Supabase to PostgreSQL and set up the API.

## Prerequisites

1. Node.js installed
2. PostgreSQL database set up
3. Access to your Supabase project

## Step 1: Export Data from Supabase

1. Navigate to the migration folder:
   ```bash
   cd migration
   npm install
   ```

2. Run the export script:
   ```bash
   npm run export
   ```

This will create a `data` folder with JSON files containing your Supabase data.

## Step 2: Set Up PostgreSQL Schema

1. Connect to your PostgreSQL database
2. Run the schema script:
   ```bash
   psql -U your_username -d your_database -f postgresql-schema.sql
   ```

## Step 3: Import Data to PostgreSQL

1. Update the database configuration in `import-to-postgresql.js`
2. Run the import script:
   ```bash
   npm run import
   ```

## Step 4: Set Up the API

1. Navigate to the api folder:
   ```bash
   cd ../api
   npm install
   ```

2. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your PostgreSQL credentials

4. Start the API server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- POST `/auth/login` - Login (demo: admin@example.com / admin123)

### Contacts
- GET `/api/contacts` - Get contacts (with pagination, search, filter)
- POST `/api/contacts` - Create new contact
- PUT `/api/contacts/:id` - Update contact
- DELETE `/api/contacts/:id` - Delete contact

### Properties
- GET `/api/properties` - Get properties
- POST `/api/properties` - Create new property

### Follow-ups
- GET `/api/follow-ups` - Get follow-ups
- POST `/api/follow-ups` - Create new follow-up

## Authentication

All API endpoints (except `/auth/login`) require a Bearer token in the Authorization header:

```
Authorization: Bearer your-jwt-token
```

## Testing the API

You can test the API using curl or any API client:

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get contacts (replace TOKEN with the JWT from login)
curl -X GET http://localhost:3001/api/contacts \
  -H "Authorization: Bearer TOKEN"
```

## Database Configuration

Update the database connection settings in:
- `migration/import-to-postgresql.js`
- `api/.env`

Make sure your PostgreSQL database is running and accessible.

## Next Steps

1. Implement proper user authentication
2. Add input validation
3. Set up proper error handling
4. Add API documentation
5. Implement proper logging
6. Set up database migrations for future schema changes
