import express from 'express';
import pool from '../../database/config.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAllUsers,
  createUser,
  updateProfile
} from '../controllers/user.controller.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, '../../public/User Profile Photo');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Save with original name
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file) return cb(null, true);
    const isImage = file.mimetype.startsWith('image/');
    isImage ? cb(null, true) : cb(new Error('Only image files are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/users', authenticateToken, getAllUsers);
router.post('/users', createUser);

router.put('/users/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashed, userId]);

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/profile', authenticateToken, upload.single('profile_photo'), (req, res) => {
  updateProfile(req, res);
});

router.put('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, status } = req.body;

  if (!name || !email || !phone || !role || typeof status === 'undefined') {
    return res.status(400).json({ error: 'Name, email, phone, role, and status are required' });
  }

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can edit users' });
    }

    const isActive = status === 'true' || status === true;
    await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, role = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6',
      [name, email, phone, role, isActive, id]
    );

    const roleCheck = await pool.query('SELECT 1 FROM user_roles WHERE user_id = $1', [id]);
    if (roleCheck.rowCount === 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role, assigned_by, assigned_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [id, role, 'admin']
      );
    } else {
      await pool.query(
        'UPDATE user_roles SET role = $1, assigned_by = $2, assigned_at = CURRENT_TIMESTAMP WHERE user_id = $3',
        [role, 'admin', id]
      );
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete users' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found or already deleted' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
