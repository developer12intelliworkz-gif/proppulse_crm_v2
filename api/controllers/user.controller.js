import pool from '../database/config.js';
import bcrypt from 'bcrypt';
 
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, rp.role_name AS role, u.is_active AS status, u.created_at, u.last_login, u.assigned_leads, u.converted_leads
      FROM users u
      LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
      WHERE u.deleted_at IS NULL AND (rp.id IS NULL OR rp.deleted_at IS NULL)
      ORDER BY u.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const createUser = async (req, res) => {
  const { name, email, phone, roles_permissions_id, status, password } = req.body;

  if (!name || !email || !phone || !roles_permissions_id || typeof status === 'undefined' || !password) {
    return res.status(400).json({ message: 'All fields are required: name, email, phone, roles_permissions_id, status, password' });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const isActive = status === 'true' || status === true;

    // Verify roles_permissions_id exists, is active, and not soft-deleted
    const roleCheck = await pool.query(
      'SELECT role_name FROM roles_permissions WHERE id = $1 AND status = TRUE AND deleted_at IS NULL',
      [roles_permissions_id]
    );
    if (roleCheck.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid, inactive, or deleted role' });
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, roles_permissions_id, is_active, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, roles_permissions_id, is_active AS status, created_at, last_login, assigned_leads, converted_leads`,
      [name, email, phone, roles_permissions_id, isActive, hashedPassword]
    );
    const user = result.rows[0];
    res.status(201).json({ ...user, role: roleCheck.rows[0].role_name, password: undefined });
  } catch (err) {
    console.error('Error creating user:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }
    res.status(500).json({ message: `Failed to create user: ${err.message}` });
  }
};