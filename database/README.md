
# Database Setup Instructions

## 1. Install PostgreSQL
Make sure PostgreSQL is installed and running on your system.

## 2. Create Database
```sql
CREATE DATABASE real_estate_crm;
```

## 3. Run Schema
```bash
psql -U postgres -d real_estate_crm -f schema.sql
```

## 4. Configure Environment
Copy `api/.env.example` to `api/.env` and update with your database credentials:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=real_estate_crm
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your-very-secure-secret-key
```

## 5. Install Dependencies
```bash
cd api
npm install bcrypt express pg jsonwebtoken cors dotenv
```

## 6. Start API Server
```bash
cd api
npm start
```

## Default Login Credentials
- Admin: admin@demo.com / admin123
- Manager: manager@demo.com / admin123  
- Agent: agent@demo.com / admin123

## Database Schema Features
- User management with roles (admin, manager, agent)
- Project management with properties
- Lead/Contact management with assignments
- Follow-up system with scheduling
- Activity logging for audit trails
- Proper indexes for performance
- Foreign key relationships for data integrity

## Security Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- SQL injection prevention with parameterized queries
