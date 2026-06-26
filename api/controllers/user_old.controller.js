import pool from '../../database/config.js';
import bcrypt from 'bcrypt';

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const createUser = async (req, res) => {
  const { name, email, phone, role, status } = req.body;

  if (!name || !email || !phone || !role || typeof status === 'undefined') {
    return res.status(400).json({ message: 'All fields are required: name, email, phone, role, status' });
  }

  try {
    const defaultPassword = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    const isActive = status === 'true' || status === true;

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, role, is_active, password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, email, phone, role, is_active AS status, created_at, last_login, assigned_leads, converted_leads`,
      [name, email, phone, role, isActive, hashedPassword]
    );

    await pool.query(
      'INSERT INTO user_roles (user_id, role, assigned_by, assigned_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [result.rows[0].id, role, 'system']
    );

    // Avoid logging sensitive information like passwords in production
    // console.log(`Default password for ${email}: ${defaultPassword}`);
    res.status(201).json({ ...result.rows[0], password: undefined });
  } catch (err) {
    console.error('Error creating user:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }
    res.status(500).json({ message: 'Failed to create user' });
  }
};

export const updateProfile = async (req, res) => {
  const { name, phone, role } = req.body;
  const userId = req.user.id;
  const profilePhoto = req.file;

  if (!name || !phone || !role) {
    return res.status(400).json({ error: 'Name, phone, and role are required' });
  }

  try {
    const currentUser = await pool.query(
      'SELECT profile_photo FROM users WHERE id = $1',
      [userId]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingPhoto = currentUser.rows[0].profile_photo;
    const profilePhotoPath = profilePhoto
      ? `User Profile Photo/${profilePhoto.originalname}`
      : existingPhoto;

    const updateResult = await pool.query(
      `UPDATE users 
       SET name = $1, phone = $2, role = $3, profile_photo = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 AND deleted_at IS NULL 
       RETURNING *`,
      [name, phone, role, profilePhotoPath, userId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roleCheck = await pool.query('SELECT 1 FROM user_roles WHERE user_id = $1', [userId]);
    if (roleCheck.rowCount === 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role, assigned_by, assigned_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [userId, role, 'self']
      );
    } else {
      await pool.query(
        'UPDATE user_roles SET role = $1, assigned_by = $2, assigned_at = CURRENT_TIMESTAMP WHERE user_id = $3',
        [role, 'self', userId]
      );
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      updatedUser: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};