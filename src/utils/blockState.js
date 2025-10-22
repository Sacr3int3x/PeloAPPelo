// Inicializar el estado global de bloqueo
window.__BLOCK_CONTEXT__ = {
  blockedUsers: new Map(),
  
  updateBlockedUsers(entries) {
    this.blockedUsers = new Map(entries);
    this.notifyListeners();
    
    // Guardar en localStorage para persistencia
    try {
      localStorage.setItem('blockedUsers', JSON.stringify(Array.from(entries)));
    } catch (error) {
      console.error('Error guardando estado de bloqueos:', error);
    }
  },

  getBlockedUsers() {
    if (this.blockedUsers.size === 0) {
      // Intentar cargar desde localStorage
      try {
        const saved = localStorage.getItem('blockedUsers');
        if (saved) {
          this.blockedUsers = new Map(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error cargando estado de bloqueos:', error);
      }
    }
    return this.blockedUsers;
  },

  listeners: new Set(),

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.blockedUsers));
  },

  isBlocked(email1, email2) {
    if (!email1 || !email2) return false;
    
    const blockedUsers = this.getBlockedUsers();
    const normalized1 = email1.toLowerCase();
    const normalized2 = email2.toLowerCase();
    
    const block1 = blockedUsers.get(normalized1);
    const block2 = blockedUsers.get(normalized2);
    
    return Boolean(block1 || block2);
  }
};