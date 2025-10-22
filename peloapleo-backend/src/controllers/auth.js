const { Router } = require('express');
const { hash } = require('../utils/hash');
const { generateId } = require('../utils/ids');
const { requireAdmin } = require('../middleware/auth');
const { store } = require('../store');

const router = Router();

// Ruta de registro estándar
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, location, phone } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // Verificar si el email ya existe
    const existing = store.users.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({
        error: 'Ya existe una cuenta con ese email'
      });
    }

    const passwordHash = hash(password);
    const user = {
      id: generateId('usr'),
      email,
      name,
      location,
      phone,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.users.push(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        location: user.location,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'No se pudo completar el registro'
    });
  }
});

// Ruta de login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Usuario/email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const user = store.users.find(u => u.email === identifier);
    if (!user) {
      return res.status(401).json({
        error: 'No encontramos una cuenta con esos datos'
      });
    }

    // Verificar contraseña
    const passwordHash = hash(password);
    if (passwordHash !== user.passwordHash) {
      return res.status(401).json({
        error: 'Contraseña incorrecta'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        location: user.location,
        phone: user.phone,
        role: user.role,
        isAdmin: user.role === 'admin',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'No se pudo iniciar sesión'
    });
  }
});

// Ruta para crear usuario desde panel admin
router.post('/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, name, location, phone, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // Verificar si el email ya existe
    const existing = store.users.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({
        error: 'Ya existe una cuenta con ese email'
      });
    }

    const passwordHash = hash(password);
    const user = {
      id: generateId('usr'),
      email,
      name,
      location,
      phone,
      passwordHash,
      role: role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.users.push(user);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        location: user.location,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      error: 'No se pudo crear el usuario'
    });
  }
});

module.exports = router;