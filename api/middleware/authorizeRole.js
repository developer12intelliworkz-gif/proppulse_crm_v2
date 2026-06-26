// middleware/authorizeRole.js
export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const userEmail = req.user?.email;

    console.log(`🧑‍💼 User trying to access: ${userEmail}, Role: ${userRole}`);

    if (!allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Access denied: insufficient permissions" });
    }

    next();
  };
};
