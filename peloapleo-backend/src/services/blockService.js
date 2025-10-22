import { db } from '../store/db.js';

// Obtener lista de usuarios bloqueados
export async function getBlockedUsers(userEmail) {
  const blockedUsers = db.get('blocked') || {};
  return blockedUsers[userEmail.toLowerCase()] || [];
}

// Bloquear un usuario
export async function blockUser(ownerEmail, targetEmail) {
  const blocked = db.get('blocked') || {};
  const ownerBlocked = blocked[ownerEmail.toLowerCase()] || [];
  
  // Agregar el usuario a la lista si no está ya bloqueado
  if (!ownerBlocked.includes(targetEmail.toLowerCase())) {
    ownerBlocked.push(targetEmail.toLowerCase());
  }
  
  blocked[ownerEmail.toLowerCase()] = ownerBlocked;
  db.set('blocked', blocked);
}

// Desbloquear un usuario
export async function unblockUser(ownerEmail, targetEmail) {
  const blocked = db.get('blocked') || {};
  const ownerBlocked = blocked[ownerEmail.toLowerCase()] || [];
  
  // Remover el usuario de la lista de bloqueados
  blocked[ownerEmail.toLowerCase()] = ownerBlocked.filter(
    email => email.toLowerCase() !== targetEmail.toLowerCase()
  );
  
  db.set('blocked', blocked);
}
