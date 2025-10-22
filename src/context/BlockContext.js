import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from './AuthContext';
import { realtime } from '../services/realtime';
import '../utils/blockState';

const BlockContext = createContext(null);

export function useBlock() {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error('useBlock debe usarse dentro de un BlockProvider');
  }
  return context;
}

export function BlockProvider({ children }) {
  const { user, token } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState(() => window.__BLOCK_CONTEXT__.getBlockedUsers());
  const [loading, setLoading] = useState(true);

  // Cargar la lista de bloqueos al inicio
  const loadBlockedUsers = useCallback(async () => {
    if (!token || !user?.email) {
      setBlockedUsers(new Map());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest('/me', { token });
      
      // Crear un nuevo Map con los usuarios bloqueados
      const newBlockedUsers = new Map();
      if (response?.user?.blocked && Array.isArray(response.user.blocked)) {
        response.user.blocked.forEach(email => {
          newBlockedUsers.set(email.toLowerCase(), {
            email: email.toLowerCase(),
            blockedAt: new Date(),
            direction: 'outgoing'
          });
        });
      }
      
      setBlockedUsers(newBlockedUsers);
      
      // Actualizar el estado global
      if (window.__BLOCK_CONTEXT__) {
        window.__BLOCK_CONTEXT__.updateBlockedUsers(Array.from(newBlockedUsers.entries()));
      }
    } catch (error) {
      console.error('Error cargando lista de bloqueados:', error);
      // En caso de error, mantener el estado actual
      if (window.__BLOCK_CONTEXT__) {
        const savedBlockedUsers = window.__BLOCK_CONTEXT__.getBlockedUsers();
        setBlockedUsers(savedBlockedUsers);
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Cargar bloqueos iniciales
  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  // Escuchar eventos de bloqueo en tiempo real
  useEffect(() => {
    if (!user?.email) return;

    const handleBlockUpdate = ({ owner, target }) => {
      if (owner.toLowerCase() === user.email.toLowerCase()) {
        setBlockedUsers(prev => {
          const next = new Map(prev);
          next.set(target.toLowerCase(), {
            email: target.toLowerCase(),
            blockedAt: new Date(),
          });
          return next;
        });
      }
    };

    const handleUnblockUpdate = ({ owner, target }) => {
      if (owner.toLowerCase() === user.email.toLowerCase()) {
        setBlockedUsers(prev => {
          const next = new Map(prev);
          next.delete(target.toLowerCase());
          return next;
        });
      }
    };

    const offBlock = realtime.on('user.blocked', handleBlockUpdate);
    const offUnblock = realtime.on('user.unblocked', handleUnblockUpdate);

    return () => {
      offBlock();
      offUnblock();
    };
  }, [user]);

  // Bloquear un usuario
  const blockUser = useCallback(async (targetEmail) => {
    if (!token || !user?.email || !targetEmail) {
      throw new Error('No autorizado o email inválido');
    }

    try {
      await apiRequest('/me/block', {
        method: 'POST',
        token,
        data: { email: targetEmail },
      });

      // Actualizar estado local
      setBlockedUsers(prev => {
        const next = new Map(prev);
        next.set(targetEmail.toLowerCase(), {
          email: targetEmail.toLowerCase(),
          blockedAt: new Date(),
        });
        return next;
      });

      // Notificar a través de realtime
      realtime.emit('user.blocked', {
        owner: user.email,
        target: targetEmail,
      });

      return { success: true };
    } catch (error) {
      console.error('Error al bloquear usuario:', error);
      throw new Error(error.message || 'No se pudo bloquear al usuario');
    }
  }, [token, user]);

  // Desbloquear un usuario
  const unblockUser = useCallback(async (targetEmail) => {
    if (!token || !user?.email || !targetEmail) {
      throw new Error('No autorizado o email inválido');
    }

    try {
      await apiRequest('/me/unblock', {
        method: 'POST',
        token,
        data: { email: targetEmail },
      });

      // Actualizar estado local
      setBlockedUsers(prev => {
        const next = new Map(prev);
        next.delete(targetEmail.toLowerCase());
        return next;
      });

      // Notificar a través de realtime
      realtime.emit('user.unblocked', {
        owner: user.email,
        target: targetEmail,
      });

      return { success: true };
    } catch (error) {
      console.error('Error al desbloquear usuario:', error);
      throw new Error(error.message || 'No se pudo desbloquear al usuario');
    }
  }, [token, user]);

  // Verificar si un usuario está bloqueado
  const isBlocked = useCallback((targetEmail) => {
    if (!targetEmail) return false;
    return blockedUsers.has(targetEmail.toLowerCase());
  }, [blockedUsers]);

  // Verificar si hay un bloqueo mutuo entre dos usuarios
  const hasMutualBlock = useCallback((email1, email2) => {
    if (!email1 || !email2) return false;
    const normalized1 = email1.toLowerCase();
    const normalized2 = email2.toLowerCase();
    
    // Verificar si cualquiera de los usuarios ha bloqueado al otro
    return blockedUsers.has(normalized2) || blockedUsers.has(normalized1);
  }, [blockedUsers]);

  const value = {
    blockedUsers: Array.from(blockedUsers.keys()),
    loading,
    blockUser,
    unblockUser,
    isBlocked,
    hasMutualBlock,
    refresh: loadBlockedUsers,
  };

  return (
    <BlockContext.Provider value={value}>
      {children}
    </BlockContext.Provider>
  );
}