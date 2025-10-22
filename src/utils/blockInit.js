// Inicializar el estado global de bloqueo
window.__BLOCK_CONTEXT__ = {
  blockedUsers: new Map(),
  hasMutualBlock: (email1, email2) => {
    if (!email1 || !email2) return false;
    const normalized1 = email1.toLowerCase();
    const normalized2 = email2.toLowerCase();
    return window.__BLOCK_CONTEXT__.blockedUsers.has(normalized1) ||
           window.__BLOCK_CONTEXT__.blockedUsers.has(normalized2);
  },
  updateBlockedUsers: (blockedUsers) => {
    window.__BLOCK_CONTEXT__.blockedUsers = new Map(
      blockedUsers.map(email => [email.toLowerCase(), true])
    );
  }
};