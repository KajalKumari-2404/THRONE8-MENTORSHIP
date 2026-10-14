const AuditLogModel = require("../models/auditLogModel");

/**
 * Writes one audit log entry. Never throws — an audit log failure must not
 * roll back or block the business transaction it's attached to, so errors
 * are swallowed and logged to the console instead.
 */
async function logAudit(entry, session) {
  try {
    await AuditLogModel.create(
      [
        {
          actorId: entry.actorId || null,
          actorRole: entry.actorRole || "ADMIN",
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId || null,
          details: { before: entry.before || {}, after: entry.after || {} },
          requestId: entry.requestId || null,
        },
      ],
      session ? { session, ordered: true } : { ordered: true }
    );
  } catch (error) {
    console.error("Audit log write failed:", error.message, entry);
  }
}

module.exports = { logAudit };