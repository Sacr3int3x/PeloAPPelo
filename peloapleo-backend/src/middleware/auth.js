const jwt = require('jsonwebtoken');
const { store } = require('../store');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware para validar el token JWT
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autorizado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = store.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(401).json({
      error: 'No autorizado'
    });
  }
}

// Middleware para validar que el usuario es administrador
function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autorizado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = store.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(401).json({
      error: 'No autorizado'
    });
  }
}

module.exports = {
  requireAuth,
  requireAdmin
};