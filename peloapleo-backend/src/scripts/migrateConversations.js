import { db } from "../store/db.js";

async function migrateConversations() {
  console.log("Iniciando migración de conversaciones...");

  if (!Array.isArray(db.data.conversations)) {
    console.log("No hay conversaciones para migrar");
    return;
  }

  let migratedCount = 0;

  db.data.conversations.forEach((conversation) => {
    if (
      !conversation.participants &&
      conversation.buyerId &&
      conversation.sellerId
    ) {
      conversation.participants = [conversation.buyerId, conversation.sellerId];
      migratedCount++;
      console.log(`Migrada conversación ${conversation.id}:`, {
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        participants: conversation.participants,
      });
    }
  });

  if (migratedCount > 0) {
    await db.write();
    console.log(
      `✅ Migración completada: ${migratedCount} conversaciones actualizadas`,
    );
  } else {
    console.log("✅ Todas las conversaciones ya tienen el campo participants");
  }
}

// Ejecutar la migración
migrateConversations()
  .then(() => {
    console.log("Migración finalizada exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en la migración:", error);
    process.exit(1);
  });
