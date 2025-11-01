import { withDb, getDb, saveDb } from "../store/dataStore.js";
import {
  hashPassword,
  verifyPassword,
  createToken,
  tokenExpiresAt,
} from "../utils/crypto.js";
import { prefixedId } from "../utils/id.js";
import { ADMIN_EMAILS } from "../config.js";
import admin from "firebase-admin";

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  const email = (user.email || "").toLowerCase();
  const role = user.role || (ADMIN_EMAILS.has(email) ? "admin" : "user");
  return {
    ...rest,
    role,
    isAdmin: role === "admin" || ADMIN_EMAILS.has(email),
    // Incluir campos de verificación de identidad
    verificationStatus: user.verificationStatus || "unverified",
    identityDocuments: user.identityDocuments || null,
    verificationRequestedAt: user.verificationRequestedAt || null,
    verificationCompletedAt: user.verificationCompletedAt || null,
  };
}

function normalizeIdentifier(value) {
  return (value || "").trim().toLowerCase();
}

export async function createUser({
  email,
  password,
  name,
  location,
  username,
  phone,
}) {
  const normalizedEmail = normalizeIdentifier(email);
  const normalizedUsername = normalizeIdentifier(username);
  const displayName =
    (name || "").trim() || normalizedEmail.split("@")[0] || "Usuario";
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  return withDb((db) => {
    if (db.users.some((u) => u.email === normalizedEmail)) {
      const error = new Error(
        "Ya existe una cuenta registrada con este correo.",
      );
      error.statusCode = 409;
      throw error;
    }
    if (
      normalizedUsername &&
      db.users.some((u) => u.username === normalizedUsername)
    ) {
      const error = new Error("Ese nombre de usuario ya está en uso.");
      error.statusCode = 409;
      throw error;
    }
    const inferredRole = ADMIN_EMAILS.has(normalizedEmail) ? "admin" : "user";
    const record = {
      id: prefixedId("usr"),
      email: normalizedEmail,
      username: normalizedUsername || null,
      name: displayName,
      location: (location || "").trim(),
      phone: (phone || "").trim(),
      passwordHash,
      since: now,
      createdAt: now,
      updatedAt: now,
      role: inferredRole,
      // Campos de verificación de identidad
      verificationStatus: "unverified", // unverified, pending, approved, rejected
      identityDocuments: null,
      verificationRequestedAt: null,
      verificationCompletedAt: null,
    };
    db.users.push(record);
    return sanitizeUser(record);
  });
}

export async function findByIdentifier(identifier) {
  const normalized = normalizeIdentifier(identifier);
  const db = await getDb();
  return db.users.find(
    (user) => user.email === normalized || user.username === normalized,
  );
}

export async function authenticate(identifier, password) {
  const user = await findByIdentifier(identifier);
  if (!user) {
    const error = new Error("No encontramos una cuenta con esos datos.");
    error.statusCode = 404;
    throw error;
  }
  if (!verifyPassword(password, user.passwordHash)) {
    const error = new Error("Clave incorrecta.");
    error.statusCode = 401;
    throw error;
  }
  const session = await createSession(user.id);
  return {
    user: sanitizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function createSession(userId) {
  const token = createToken();
  const expiresAt = tokenExpiresAt();
  await withDb((db) => {
    db.sessions = db.sessions.filter(
      (session) =>
        session.userId !== userId || new Date(session.expiresAt) > new Date(),
    );
    db.sessions.push({
      id: prefixedId("sess"),
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
  });
  await saveDb();
  return { token, expiresAt };
}

export async function getUserFromToken(token) {
  if (!token) return null;
  const db = await getDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    return null;
  }
  const user = db.users.find((u) => u.id === session.userId);
  return user ? sanitizeUser(user) : null;
}

export async function requireUser(token) {
  const user = await getUserFromToken(token);
  if (!user) {
    const error = new Error("No autorizado");
    error.statusCode = 401;
    throw error;
  }
  return user;
}

export async function requireAdmin(token) {
  const user = await requireUser(token);
  if (!user.isAdmin) {
    const error = new Error(
      "Acceso denegado. Se requieren permisos de administrador",
    );
    error.statusCode = 403;
    throw error;
  }
  return user;
}

export async function logout(token) {
  if (!token) return;
  await withDb((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== token);
  });
}

export async function updateUser(userId, updates) {
  return withDb((db) => {
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      const error = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const user = db.users[userIndex];
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.users[userIndex] = updatedUser;
    return sanitizeUser(updatedUser);
  });
}

// Inicializar Firebase Admin
function initializeFirebaseAdmin() {
  if (admin.apps.length) return; // Ya inicializado

  try {
    // Verificar que todas las variables de entorno necesarias estén configuradas
    const requiredEnvVars = [
      "FIREBASE_PRIVATE_KEY_ID",
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_CLIENT_ID",
      "FIREBASE_CLIENT_X509_CERT_URL",
    ];

    console.log("Checking Firebase environment variables...");
    const missingVars = requiredEnvVars.filter((varName) => {
      const value = process.env[varName];
      const isMissing = !value || value.includes("your_");
      console.log(
        `${varName}: ${isMissing ? "MISSING/PLACEHOLDER" : "OK"} (${value ? value.substring(0, 20) + "..." : "undefined"})`,
      );
      return isMissing;
    });

    if (missingVars.length > 0) {
      console.warn(
        "Firebase Admin credentials not properly configured. Google authentication will not work.",
      );
      console.warn(
        "Missing or placeholder values for:",
        missingVars.join(", "),
      );
      console.warn(
        "Please configure your Firebase service account credentials in the .env file.",
      );
      return; // No inicializar si faltan credenciales
    }

    console.log(
      "All Firebase credentials found, initializing Firebase Admin...",
    );

    // Procesar la private key - manejar tanto formato JSON como texto plano
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      try {
        privateKey = JSON.parse(privateKey);
      } catch (e) {
        // Si no es JSON válido, usar como está
      }
    }
    // Asegurar que tenga los saltos de línea correctos
    privateKey = privateKey.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        type: "service_account",
        project_id: "peloapelo-13354",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      }),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error.message);
    console.warn("Google authentication will not be available");
  }
}

// Inicializar Firebase Admin al cargar el módulo
initializeFirebaseAdmin();

export async function authenticateWithGoogle(idToken) {
  try {
    // Verificar el token de Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const {
      uid: firebaseUid,
      email,
      name,
      picture: avatar,
      email_verified: emailVerified,
    } = decodedToken;

    // Buscar usuario existente
    const db = await getDb();
    const existingUser = db.users.find(
      (u) => u.firebaseUid === firebaseUid || u.email === email,
    );

    if (existingUser) {
      // Usuario existente - crear sesión
      const session = await createSession(existingUser.id);
      return {
        success: true,
        requiresRegistration: false,
        user: sanitizeUser(existingUser),
        token: session.token,
        expiresAt: session.expiresAt,
      };
    } else {
      // Usuario nuevo - devolver datos para completar registro
      return {
        success: true,
        requiresRegistration: true,
        googleData: {
          firebaseUid,
          email,
          name,
          avatar,
          emailVerified,
        },
      };
    }
  } catch (error) {
    console.error("Error authenticating with Google:", error);
    return {
      success: false,
      error: "Error al autenticar con Google",
    };
  }
}
export async function completeGoogleRegistration(googleData, additionalData) {
  const { firebaseUid, email, name, avatar, emailVerified } = googleData;
  const { username, location, phone } = additionalData;

  return withDb(async (db) => {
    // Verificar si ya existe un usuario con este firebaseUid
    const existingFirebaseUser = db.users.find(
      (u) => u.firebaseUid === firebaseUid,
    );
    if (existingFirebaseUser) {
      // Usuario ya completó el registro con Google, hacer login
      const session = await createSession(existingFirebaseUser.id);
      return {
        user: sanitizeUser(existingFirebaseUser),
        token: session.token,
        expiresAt: session.expiresAt,
      };
    }

    // Verificar si existe un usuario con el mismo email pero sin firebaseUid
    const existingEmailUser = db.users.find(
      (u) => u.email === email && !u.firebaseUid,
    );
    if (existingEmailUser) {
      // Usuario existe con email/password, pero está intentando registrarse con Google
      // Podríamos permitir fusionar las cuentas o requerir login con email/password
      const error = new Error(
        "Ya existe una cuenta con este email. Por favor inicia sesión con tu email y contraseña, o usa un email diferente para Google.",
      );
      error.statusCode = 409;
      throw error;
    }

    // Verificar si el username ya está en uso
    const existingUsernameUser = db.users.find((u) => u.username === username);
    if (existingUsernameUser) {
      const error = new Error(
        "Ese nombre de usuario ya está en uso. Por favor elige otro.",
      );
      error.statusCode = 409;
      throw error;
    }

    // Crear nuevo usuario con datos de Google + datos adicionales
    const userId = prefixedId("usr");
    const now = new Date().toISOString();

    const user = {
      id: userId,
      firebaseUid: firebaseUid,
      email: email,
      name: name,
      username: username,
      location: location,
      phone: phone || null,
      avatar: avatar,
      emailVerified: emailVerified,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      // Campos de verificación de identidad
      verificationStatus: "unverified",
      identityDocuments: null,
      verificationRequestedAt: null,
      verificationCompletedAt: null,
    };

    db.users.push(user);
    await saveDb();

    // Crear sesión
    const session = await createSession(user.id);
    return {
      user: sanitizeUser(user),
      token: session.token,
      expiresAt: session.expiresAt,
    };
  });
}
