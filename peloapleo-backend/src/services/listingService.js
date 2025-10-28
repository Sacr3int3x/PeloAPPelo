import { getDb, withDb } from "../store/dataStore.js";
import { MAX_LISTING_IMAGES } from "../config.js";
import { isDataUrl } from "../utils/file.js";
import { prefixedId } from "../utils/id.js";
import { emitEvent } from "../realtime/socketHub.js";

const allowedStatuses = new Set(["active", "paused", "sold", "finalizado"]);
const adminAllowedStatuses = new Set([
  "active",
  "paused",
  "sold",
  "finalizado",
  "removed",
  "suspended",
]);
const allowedConditions = new Set(["nuevo", "usado"]);

function ratingSummaryForOwner(ownerId, db) {
  const reputations =
    db.reputations?.filter((rep) => rep.toUserId === ownerId) || [];
  if (!reputations.length) {
    return { average: 0, count: 0 };
  }
  const total = reputations.reduce(
    (sum, rep) => sum + Number(rep.rating || 0),
    0,
  );
  const average = Number((total / reputations.length).toFixed(2));
  const lastReview =
    reputations
      .map((rep) => new Date(rep.createdAt || 0).getTime())
      .filter((time) => Number.isFinite(time))
      .sort((a, b) => b - a)[0] || null;
  return {
    average,
    count: reputations.length,
    lastReviewAt: lastReview ? new Date(lastReview).toISOString() : null,
  };
}

export function listingToResponse(listing, db) {
  const owner = db.users.find((user) => user.id === listing.ownerId);
  const ownerRating = ratingSummaryForOwner(listing.ownerId, db);
  return {
    ...listing,
    condition: (listing.condition || "usado").toLowerCase(),
    ownerId: listing.ownerId,
    ownerEmail: owner?.email || null,
    ownerName: owner?.name || null,
    ownerUsername: owner?.username || null,
    ownerAvatar: owner?.avatar || null,
    ownerPhone: owner?.phone || null,
    ownerSince: owner?.since || owner?.createdAt || null,
    ownerRating,
  };
}

function matchesFilter(listing, filters, db) {
  const owner = db.users.find((user) => user.id === listing.ownerId);
  if (filters.ownerEmail && owner?.email !== filters.ownerEmail) {
    return false;
  }
  if (filters.category && listing.category !== filters.category) {
    return false;
  }
  if (filters.location && listing.location !== filters.location) {
    return false;
  }
  if (filters.brand && listing.brand !== filters.brand) {
    return false;
  }
  if (filters.model && listing.model !== filters.model) {
    return false;
  }
  if (filters.condition) {
    const cond = (listing.condition || "usado").toLowerCase();
    if (cond !== filters.condition) return false;
  }
  if (filters.searchTerm) {
    const t = filters.searchTerm;
    const content = [
      listing.name,
      listing.brand,
      listing.model,
      listing.location,
      listing.description,
      owner?.name,
      owner?.email,
    ]
      .map((field) => (field || "").toLowerCase())
      .join(" ");
    if (!content.includes(t)) {
      return false;
    }
  }
  return true;
}

function sortListings(listings, sort) {
  switch (sort) {
    case "price_asc":
      return listings.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price_desc":
      return listings.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "new":
    default:
      return listings.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
  }
}

export async function listListings({ filters = {}, sort = "new" }) {
  const db = await getDb();
  const filtered = db.listings.filter((listing) =>
    matchesFilter(listing, filters, db),
  );
  const excludedStatuses = new Set([
    "removed",
    "suspended",
    "sold",
    "finalizado",
  ]);
  const visible =
    filters.includeModerated || filters.includeOwn
      ? filtered
      : filtered.filter(
          (listing) =>
            !excludedStatuses.has((listing.status || "").toLowerCase()),
        );
  const sorted = sortListings([...visible], sort);
  return sorted.map((listing) => listingToResponse(listing, db));
}

export async function getListingById(id) {
  const db = await getDb();
  const listing = db.listings.find((entry) => entry.id === id);
  if (!listing) return null;
  return listingToResponse(listing, db);
}

async function storeImages(images, listingId) {
  if (!Array.isArray(images)) return [];
  const stored = [];
  let index = 0;
  const { uploadImageToCloudinary } = await import("./cloudinaryService.js");
  for (const image of images) {
    if (!image || index >= MAX_LISTING_IMAGES) break;
    if (isDataUrl(image)) {
      // Convertir dataURL a buffer
      const match = /^data:(.+);base64,(.*)$/i.exec(image);
      if (!match) continue;
      const [, , base64] = match;
      const buffer = Buffer.from(base64, "base64");
      const filename = `listing-${listingId}-${index}-${Date.now()}`;
      const result = await uploadImageToCloudinary(buffer, filename);
      stored.push(result.secure_url);
    } else if (typeof image === "string") {
      stored.push(image);
    }
    index += 1;
  }
  return stored;
}

export async function createListing({ ownerId, payload }) {
  const now = new Date().toISOString();
  const listingId = prefixedId("lst");
  const images = await storeImages(payload.images || [], listingId);
  const record = {
    id: listingId,
    ownerId,
    category: payload.category,
    name: payload.name,
    brand: payload.brand || "",
    model: payload.model || "",
    location: payload.location || "",
    price: Number.parseInt(payload.price, 10) || 0,
    images,
    description: payload.description || "",
    status: payload.status || "active",
    plan: payload.plan || "gratis",
    condition: allowedConditions.has((payload.condition || "").toLowerCase())
      ? payload.condition.toLowerCase()
      : "usado",
    createdAt: now,
    updatedAt: now,
  };
  await withDb((db) => {
    db.listings.unshift(record);
  });
  const db = await getDb();
  const listing = listingToResponse(record, db);
  emitEvent("listing.created", { item: listing });
  return listing;
}

export async function updateListing({ listingId, ownerId, updates }) {
  let updated = null;
  await withDb((db) => {
    const entry = db.listings.find((listing) => listing.id === listingId);
    if (!entry) {
      const error = new Error("Publicación no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    if (entry.ownerId !== ownerId) {
      const error = new Error(
        "No tienes permisos para modificar esta publicación.",
      );
      error.statusCode = 403;
      throw error;
    }

    if (updates.name !== undefined) entry.name = String(updates.name).trim();
    if (updates.description !== undefined)
      entry.description = String(updates.description).trim();
    if (updates.category !== undefined)
      entry.category = String(updates.category).trim();
    if (updates.brand !== undefined) entry.brand = String(updates.brand).trim();
    if (updates.model !== undefined) entry.model = String(updates.model).trim();
    if (updates.location !== undefined)
      entry.location = String(updates.location).trim();
    if (updates.price !== undefined) {
      entry.price = Number.parseInt(updates.price, 10) || 0;
    }
    if (updates.condition !== undefined) {
      const nextCondition = String(updates.condition).toLowerCase();
      if (!allowedConditions.has(nextCondition)) {
        const error = new Error("Condición no válida.");
        error.statusCode = 400;
        throw error;
      }
      entry.condition = nextCondition;
    }
    if (updates.images !== undefined) {
      entry.images = updates.images;
    }
    entry.updatedAt = new Date().toISOString();
    updated = entry;
  });

  const db = await getDb();
  const listing = listingToResponse(updated, db);
  emitEvent("listing.updated", { item: listing });
  return listing;
}

export async function deleteListing({ listingId, ownerId }) {
  await withDb((db) => {
    const entryIndex = db.listings.findIndex(
      (listing) => listing.id === listingId,
    );
    if (entryIndex === -1) {
      const error = new Error("Publicación no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    const entry = db.listings[entryIndex];
    if (entry.ownerId !== ownerId) {
      const error = new Error(
        "No tienes permisos para eliminar esta publicación.",
      );
      error.statusCode = 403;
      throw error;
    }
    if (entry.status !== "finalizado" && entry.status !== "sold") {
      const error = new Error(
        "Solo se pueden eliminar publicaciones finalizadas o vendidas.",
      );
      error.statusCode = 400;
      throw error;
    }
    db.listings.splice(entryIndex, 1);
  });
}

export async function updateListingStatus({ listingId, ownerId, status }) {
  if (!allowedStatuses.has(status)) {
    const error = new Error("Estado inválido.");
    error.statusCode = 400;
    throw error;
  }
  let updated = null;
  await withDb((db) => {
    const entry = db.listings.find((listing) => listing.id === listingId);
    if (!entry) {
      const error = new Error("Publicación no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    if (entry.ownerId !== ownerId) {
      const error = new Error(
        "No tienes permisos para modificar esta publicación.",
      );
      error.statusCode = 403;
      throw error;
    }
    entry.status = status;
    entry.updatedAt = new Date().toISOString();
    updated = entry;
  });
  const db = await getDb();
  const listing = listingToResponse(updated, db);
  emitEvent("listing.updated", { item: listing });
  return listing;
}

export async function adminUpdateListing({ listingId, updates }) {
  let updated = null;
  await withDb((db) => {
    const entry = db.listings.find((listing) => listing.id === listingId);
    if (!entry) {
      const error = new Error("Publicación no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    if (updates.name !== undefined) entry.name = String(updates.name).trim();
    if (updates.description !== undefined)
      entry.description = String(updates.description).trim();
    if (updates.category !== undefined)
      entry.category = String(updates.category).trim();
    if (updates.brand !== undefined) entry.brand = String(updates.brand).trim();
    if (updates.model !== undefined) entry.model = String(updates.model).trim();
    if (updates.location !== undefined)
      entry.location = String(updates.location).trim();
    if (updates.plan !== undefined) entry.plan = String(updates.plan).trim();
    if (updates.price !== undefined) {
      entry.price = Number.parseInt(updates.price, 10) || 0;
    }
    if (updates.condition !== undefined) {
      const nextCondition = String(updates.condition).toLowerCase();
      if (!allowedConditions.has(nextCondition)) {
        const error = new Error("Condición no válida.");
        error.statusCode = 400;
        throw error;
      }
      entry.condition = nextCondition;
    }
    if (updates.status !== undefined) {
      const nextStatus = String(updates.status).toLowerCase();
      if (!adminAllowedStatuses.has(nextStatus)) {
        const error = new Error("Estado no permitido para administradores.");
        error.statusCode = 400;
        throw error;
      }
      entry.status = nextStatus;
    }
    if (updates.condition !== undefined) {
      const nextCondition = String(updates.condition).toLowerCase();
      if (!allowedConditions.has(nextCondition)) {
        const error = new Error("Condición no válida.");
        error.statusCode = 400;
        throw error;
      }
      entry.condition = nextCondition;
    }
    if (updates.moderationNotes !== undefined) {
      entry.moderationNotes = String(updates.moderationNotes).trim();
    }
    entry.updatedAt = new Date().toISOString();
    updated = entry;
  });

  const db = await getDb();
  const listing = listingToResponse(updated, db);
  emitEvent("listing.updated", { item: listing });
  return listing;
}
