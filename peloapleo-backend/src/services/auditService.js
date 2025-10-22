import { withDb } from "../store/dataStore.js";
import { prefixedId } from "../utils/id.js";

export async function recordAudit({ userId, action, targetType, targetId, details }) {
  const entry = {
    id: prefixedId("aud"),
    userId,
    action,
    targetType,
    targetId: targetId || null,
    details: details || null,
    createdAt: new Date().toISOString(),
  };
  await withDb((db) => {
    db.auditLogs.unshift(entry);
    db.auditLogs = db.auditLogs.slice(0, 1000);
  });
  return entry;
}
