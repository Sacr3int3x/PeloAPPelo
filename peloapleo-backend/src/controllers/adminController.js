import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";
import { ADMIN_EMAILS } from "../config.js";
import { getDb, withDb } from "../store/dataStore.js";
import { listingToResponse } from "../services/listingService.js";
import { readJsonBody } from "../utils/http.js";
import { recordAudit } from "../services/auditService.js";
import { sanitizeUser } from "../services/authService.js";
import { adminUpdateListing } from "../services/listingService.js";

function ensureAdmin(user) {
  const email = (user?.email || "").toLowerCase();
  const isAdmin = user?.role === "admin" || ADMIN_EMAILS.has(email);
  if (!isAdmin) {
    const error = new Error("Recurso solo disponible para administradores.");
    error.statusCode = 403;
    throw error;
  }
}

function parseLimitOffset(query) {
  const limit = Math.min(
    100,
    Math.max(5, Number.parseInt(query.limit ?? "25", 10) || 25),
  );
  const offset = Math.max(0, Number.parseInt(query.offset ?? "0", 10) || 0);
  return { limit, offset };
}

function applyPagination(list, limit, offset) {
  return list.slice(offset, offset + limit);
}

function buildCategoryStats(listings) {
  const map = new Map();
  listings.forEach((listing) => {
    const key = listing.category || "Sin categoría";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

function buildStatusStats(listings) {
  const map = new Map();
  listings.forEach((listing) => {
    const status = listing.status || "sin_estado";
    map.set(status, (map.get(status) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

function sanitizeReputation(rep, db) {
  const fromUser = db.users.find((user) => user.id === rep.fromUserId);
  const toUser = db.users.find((user) => user.id === rep.toUserId);
  const listing = db.listings.find((item) => item.id === rep.listingId);
  return {
    id: rep.id,
    transactionId: rep.transactionId,
    conversationId: rep.conversationId,
    listingId: rep.listingId,
    listingName: listing?.name || null,
    rating: rep.rating,
    comment: rep.comment || "",
    fromUser: fromUser
      ? { id: fromUser.id, email: fromUser.email, name: fromUser.name }
      : { id: rep.fromUserId },
    toUser: toUser
      ? { id: toUser.id, email: toUser.email, name: toUser.name }
      : { id: rep.toUserId },
    createdAt: rep.createdAt,
  };
}

function buildDailySeries(records, key = "createdAt", days = 14) {
  const today = new Date();
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const label = date.toISOString().slice(0, 10);
    const count = records.filter((entry) => {
      const value = entry[key];
      if (!value) return false;
      return value.slice(0, 10) === label;
    }).length;
    series.push({ label, value: count });
  }
  return series;
}

export async function overview({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  ensureAdmin(user);

  const db = await getDb();
  const listings = db.listings.map((entry) => listingToResponse(entry, db));
  const reputations = db.reputations || [];
  const response = {
    totals: {
      users: db.users.length,
      listings: listings.length,
      conversations: db.conversations.length,
      messages: db.conversations.reduce(
        (acc, conv) => acc + (conv.messages?.length || 0),
        0,
      ),
      reputations: reputations.length,
    },
    latestListings: listings.slice(0, 5),
    latestUsers: db.users
      .slice(-5)
      .reverse()
      .map((entry) => sanitizeUser(entry)),
    stats: {
      byCategory: buildCategoryStats(listings),
      byStatus: buildStatusStats(listings),
      listingsDaily: buildDailySeries(listings),
      usersDaily: buildDailySeries(db.users),
      conversationsDaily: buildDailySeries(db.conversations),
      reputationsDaily: buildDailySeries(reputations),
    },
  };

  sendJson(res, 200, response);
}

export async function users({ req, res, query }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  ensureAdmin(user);
  const db = await getDb();
  const search = (query.q || "").trim().toLowerCase();
  const roleFilter = (query.role || "").trim().toLowerCase();
  const locationFilter = (query.location || "").trim().toLowerCase();
  const { limit, offset } = parseLimitOffset(query);

  const filtered = db.users.filter((entry) => {
    const matchesSearch = search
      ? [entry.email, entry.username, entry.name]
          .map((value) => (value || "").toLowerCase())
          .some((value) => value.includes(search))
      : true;
    const matchesRole = roleFilter
      ? (entry.role || "user").toLowerCase() === roleFilter
      : true;
    const matchesLocation = locationFilter
      ? (entry.location || "").toLowerCase().includes(locationFilter)
      : true;
    return matchesSearch && matchesRole && matchesLocation;
  });

  const paged = applyPagination(filtered, limit, offset).map((entry) => ({
    ...sanitizeUser(entry),
    listings: db.listings.filter((listing) => listing.ownerId === entry.id)
      .length,
  }));

  sendJson(res, 200, {
    users: paged,
    total: filtered.length,
    limit,
    offset,
  });
}

export async function getUser({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  ensureAdmin(user);
  const [userId] = params;

  const db = await getDb();
  const entry = db.users.find((user) => user.id === userId);
  if (!entry) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const listingsCount = db.listings.filter(
    (listing) => listing.ownerId === entry.id,
  ).length;
  const reputations = (db.reputations || []).filter(
    (rep) => rep.toUserId === entry.id || rep.fromUserId === entry.id,
  );

  sendJson(res, 200, {
    ...sanitizeUser(entry),
    listingsCount,
    reputationsCount: reputations.length,
  });
}

export async function reputations({ req, res, query }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  ensureAdmin(user);
  const db = await getDb();
  const { limit, offset } = parseLimitOffset(query);
  const search = (query.q || "").trim().toLowerCase();

  const reps = (db.reputations || []).filter((rep) => {
    if (!search) return true;
    const fromUser = db.users.find((entry) => entry.id === rep.fromUserId);
    const toUser = db.users.find((entry) => entry.id === rep.toUserId);
    const listing = db.listings.find((entry) => entry.id === rep.listingId);
    const haystack = [
      fromUser?.email,
      fromUser?.name,
      toUser?.email,
      toUser?.name,
      listing?.name,
      rep.comment,
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase())
      .join(" ");
    return haystack.includes(search);
  });

  const paged = applyPagination(reps, limit, offset).map((rep) =>
    sanitizeReputation(rep, db),
  );

  sendJson(res, 200, {
    reputations: paged,
    total: reps.length,
    limit,
    offset,
  });
}

export async function listings({ req, res, query }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  ensureAdmin(user);
  const db = await getDb();
  const search = (query.q || "").trim().toLowerCase();
  const statusFilter = (query.status || "").trim().toLowerCase();
  const categoryFilter = query.category || "";
  const planFilter = (query.plan || "").trim().toLowerCase();
  const locationFilter = (query.location || "").trim().toLowerCase();
  const ownerFilter = (query.owner || "").trim().toLowerCase();
  const { limit, offset } = parseLimitOffset(query);

  const enriched = db.listings.map((listing) => listingToResponse(listing, db));
  const filtered = enriched.filter((listing) => {
    const matchesSearch = search
      ? [
          listing.name,
          listing.description,
          listing.brand,
          listing.model,
          listing.ownerEmail,
        ]
          .map((value) => (value || "").toLowerCase())
          .some((value) => value.includes(search))
      : true;
    const matchesStatus = statusFilter
      ? (listing.status || "").toLowerCase() === statusFilter
      : true;
    const matchesCategory = categoryFilter
      ? listing.category === categoryFilter
      : true;
    const matchesPlan = planFilter
      ? (listing.plan || "").toLowerCase() === planFilter
      : true;
    const matchesLocation = locationFilter
      ? (listing.location || "").toLowerCase().includes(locationFilter)
      : true;
    const matchesOwner = ownerFilter
      ? (listing.ownerEmail || "").toLowerCase().includes(ownerFilter)
      : true;
    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesPlan &&
      matchesLocation &&
      matchesOwner
    );
  });

  const sorted = filtered.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
  const paged = applyPagination(sorted, limit, offset);

  sendJson(res, 200, {
    items: paged,
    total: filtered.length,
    limit,
    offset,
  });
}

export async function conversations({ req, res, query }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  ensureAdmin(user);
  const db = await getDb();
  const search = (query.q || "").trim().toLowerCase();
  const { limit, offset } = parseLimitOffset(query);

  const threads = db.conversations
    .map((conversation) => {
      const participants = conversation.participants
        .map((userId) => db.users.find((entry) => entry.id === userId))
        .filter(Boolean);
      const listing = db.listings.find(
        (entry) => entry.id === conversation.listingId,
      );
      return {
        id: conversation.id,
        listingId: conversation.listingId,
        listing: listing ? { id: listing.id, name: listing.name } : null,
        participants: participants.map((participant) => ({
          id: participant.id,
          email: participant.email,
          name: participant.name,
        })),
        messages: conversation.messages.map((message) => {
          const author = db.users.find(
            (entry) => entry.id === message.senderId,
          );
          return {
            id: message.id,
            sender: author ? { id: author.id, email: author.email } : null,
            body: message.body,
            attachments: message.attachments,
            createdAt: message.createdAt,
          };
        }),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    })
    .filter((conversation) => {
      if (!search) return true;
      const participantMatch = conversation.participants.some(
        (participant) =>
          participant.email?.toLowerCase().includes(search) ||
          participant.name?.toLowerCase().includes(search),
      );
      const listingMatch = conversation.listing?.name
        ?.toLowerCase()
        .includes(search);
      return participantMatch || listingMatch;
    });

  const sorted = threads.sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
  );
  const paged = applyPagination(sorted, limit, offset);

  sendJson(res, 200, {
    conversations: paged,
    total: threads.length,
    limit,
    offset,
  });
}

export async function raw({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  ensureAdmin(user);
  const db = await getDb();
  sendJson(res, 200, db);
}

export async function updateUser({ req, res, params }) {
  const token = extractToken(req);
  const admin = await requireUser(token);
  ensureAdmin(admin);
  const [userId] = params;
  const body = await readJsonBody(req);
  const allowedRoles = new Set(["user", "moderator", "admin"]);

  let updatedUser = null;
  await withDb((db) => {
    const entry = db.users.find((user) => user.id === userId);
    if (!entry) {
      const error = new Error("Usuario no encontrado.");
      error.statusCode = 404;
      throw error;
    }
    if (body.name !== undefined) entry.name = String(body.name).trim();
    if (body.location !== undefined)
      entry.location = String(body.location).trim();
    if (body.phone !== undefined) entry.phone = String(body.phone).trim();
    if (body.role !== undefined) {
      const normalizedRole = String(body.role).toLowerCase();
      if (!allowedRoles.has(normalizedRole)) {
        const error = new Error("Rol no permitido.");
        error.statusCode = 400;
        throw error;
      }
      entry.role = normalizedRole;
    }
    entry.updatedAt = new Date().toISOString();
    updatedUser = sanitizeUser(entry);
  });

  await recordAudit({
    userId: admin.id,
    action: "user.update",
    targetType: "user",
    targetId: userId,
    details: body,
  });

  sendJson(res, 200, { user: updatedUser });
}

export async function updateListing({ req, res, params }) {
  const token = extractToken(req);
  const admin = await requireUser(token);
  ensureAdmin(admin);
  const [listingId] = params;
  const body = await readJsonBody(req);

  const result = await adminUpdateListing({
    listingId,
    updates: body,
  });

  await recordAudit({
    userId: admin.id,
    action: "listing.update",
    targetType: "listing",
    targetId: listingId,
    details: body,
  });

  sendJson(res, 200, { item: result });
}

export async function auditLogs({ req, res, query }) {
  const token = extractToken(req);
  const admin = await requireUser(token);
  ensureAdmin(admin);
  const { limit, offset } = parseLimitOffset(query);

  const db = await getDb();
  const paged = applyPagination(db.auditLogs, limit, offset).map((entry) => ({
    ...entry,
    actor: db.users.find((user) => user.id === entry.userId)?.email || null,
  }));

  sendJson(res, 200, {
    logs: paged,
    total: db.auditLogs.length,
    limit,
    offset,
  });
}
