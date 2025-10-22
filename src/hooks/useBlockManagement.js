import { useCallback } from 'react';
import { useBlock } from '../context/BlockContext';
import { useMessages } from '../context/MessageContext';
import { useData } from '../context/DataContext';

export function useBlockManagement() {
  const { blockUser, unblockUser, isBlocked, hasMutualBlock, blockedUsers } = useBlock();
  const { conversations, setConversations } = useMessages();
  const { refresh: refreshListings } = useData();

  // Bloquear usuario y limpiar datos relacionados
  const handleBlockUser = useCallback(async (targetEmail) => {
    try {
      // 1. Realizar el bloqueo
      await blockUser(targetEmail);

      // 2. Eliminar conversaciones con el usuario bloqueado
      setConversations(prev => 
        prev.filter(conv => {
          const participants = conv.participants || [];
          return !participants.some(p => 
            p.toLowerCase() === targetEmail.toLowerCase()
          );
        })
      );

      // 3. Refrescar listados para ocultar publicaciones
      await refreshListings();

      return { success: true };
    } catch (error) {
      console.error('Error en el proceso de bloqueo:', error);
      return {
        success: false,
        error: error.message || 'No se pudo completar el bloqueo'
      };
    }
  }, [blockUser, setConversations, refreshListings]);

  // Desbloquear usuario y actualizar datos
  const handleUnblockUser = useCallback(async (targetEmail) => {
    try {
      // 1. Realizar el desbloqueo
      await unblockUser(targetEmail);

      // 2. Refrescar listados para mostrar publicaciones
      await refreshListings();

      return { success: true };
    } catch (error) {
      console.error('Error en el proceso de desbloqueo:', error);
      return {
        success: false,
        error: error.message || 'No se pudo completar el desbloqueo'
      };
    }
  }, [unblockUser, refreshListings]);

  // Verificar si el usuario puede interactuar con otro
  const canInteractWith = useCallback((targetEmail) => {
    if (!targetEmail) return false;
    return !hasMutualBlock(targetEmail);
  }, [hasMutualBlock]);

  return {
    blockUser: handleBlockUser,
    unblockUser: handleUnblockUser,
    isBlocked,
    canInteractWith,
    blockedUsers,
  };
}