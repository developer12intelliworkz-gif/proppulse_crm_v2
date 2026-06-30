import pool from "../../database/config.js";

/**
 * Express middleware to verify the authenticated user has a specific permission.
 * If the user's role is "admin", they bypass all permission checks.
 * Inactive roles or roles without the permission will result in a 403 Forbidden response.
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Access token required" });
      }

      // Query user and join roles_permissions
      const query = `
        SELECT u.id, rp.role_name, rp.permissions, rp.status as role_status
        FROM users u
        LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `;
      const result = await pool.query(query, [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found or deleted" });
      }

      const userDetail = result.rows[0];
      const roleName = userDetail.role_name?.toLowerCase();

      // Removed hardcoded admin bypass to enforce database-configured permissions for all roles

      // Check role status
      if (userDetail.roles_permissions_id && !userDetail.role_status) {
        return res.status(403).json({ error: "Access denied: user role is inactive" });
      }

      // Extract permissions array
      let permissionsArray = [];
      const permsObj = userDetail.permissions;
      if (permsObj) {
        if (Array.isArray(permsObj)) {
          permissionsArray = permsObj;
        } else if (typeof permsObj === "object") {
          permissionsArray = permsObj[userDetail.role_name] || permsObj[roleName] || Object.values(permsObj).flat();
        }
      }

      if (!Array.isArray(permissionsArray)) {
        permissionsArray = [];
      }

      const required = Array.isArray(permission) ? permission : [permission];
      const hasAny = required.some((p) => permissionsArray.includes(p));

      if (!hasAny) {
        return res.status(403).json({ 
          error: `Access denied: requires one of permissions [${required.join(", ")}]` 
        });
      }

      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      res.status(500).json({ error: "Internal server error during authorization check" });
    }
  };
};
