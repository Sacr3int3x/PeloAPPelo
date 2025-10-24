import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import {
  createListing,
  deleteListing,
  getListingById,
  listListings,
  updateListing,
  updateListingStatus,
} from "../services/listingService.js";
import { getUserFromToken, requireUser } from "../services/authService.js";

export async function list({ req, res, query }) {
  const token = extractToken(req);
  const currentUser = await getUserFromToken(token);
  const filters = {};

  if (query.category) filters.category = query.category;
  if (query.location) filters.location = query.location;
  if (query.brand) filters.brand = query.brand;
  if (query.model) filters.model = query.model;
  if (query.condition) {
    filters.condition = String(query.condition).toLowerCase();
  }
  if (query.owner) {
    if (query.owner === "me") {
      if (!currentUser) {
        const error = new Error("No autorizado");
        error.statusCode = 401;
        throw error;
      }
      filters.ownerEmail = currentUser.email;
      filters.includeOwn = true;
    } else {
      filters.ownerEmail = query.owner;
    }
  }
  if (query.q) {
    filters.searchTerm = String(query.q).trim().toLowerCase();
  }

  const sort = query.sort || "new";
  const items = await listListings({ filters, sort });
  sendJson(res, 200, { items });
}

export async function detail({ res, params }) {
  const [id] = params;
  const listing = await getListingById(id);
  if (!listing) {
    const error = new Error("Publicación no encontrada.");
    error.statusCode = 404;
    throw error;
  }
  sendJson(res, 200, { item: listing });
}

export async function create({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const body = req.body || {};
  if (!body?.name || !body?.category) {
    const error = new Error("Nombre y categoría son obligatorios.");
    error.statusCode = 400;
    throw error;
  }
  const listing = await createListing({
    ownerId: user.id,
    payload: body,
  });
  sendJson(res, 201, { item: listing });
}

export async function update({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [listingId] = params;
  const updates = req.body || {};
  const updated = await updateListing({
    listingId,
    ownerId: user.id,
    updates,
  });
  sendJson(res, 200, { item: updated });
}

export async function uploadPhoto({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [listingId] = params;

  if (!req.files || req.files.length === 0) {
    const error = new Error("No se proporcionaron imágenes");
    error.statusCode = 400;
    throw error;
  }

  const images = req.files.map((file) => {
    const base64 = file.buffer.toString("base64");
    return `data:${file.mimetype};base64,${base64}`;
  });

  const listing = await getListingById(listingId);
  if (!listing) {
    const error = new Error("Publicación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (listing.ownerId !== user.id) {
    const error = new Error(
      "No tienes permisos para modificar esta publicación",
    );
    error.statusCode = 403;
    throw error;
  }

  const updated = await updateListing({
    listingId,
    ownerId: user.id,
    updates: {
      images: [...(listing.images || []), ...images],
    },
  });

  sendJson(res, 200, { item: updated });
}

export async function updateStatus({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [listingId] = params;
  const body = req.body || {};
  const status = body?.status;
  const updated = await updateListingStatus({
    listingId,
    ownerId: user.id,
    status,
  });
  sendJson(res, 200, { item: updated });
}

export async function remove({ req, res, params }) {
  console.log("[DELETE] Iniciando eliminación de publicación");
  const token = extractToken(req);
  console.log("[DELETE] Token extraído:", !!token);

  const user = await requireUser(token);
  console.log("[DELETE] Usuario autenticado:", user.id);

  const [listingId] = params;
  console.log("[DELETE] ID de publicación a eliminar:", listingId);

  try {
    console.log("[DELETE] Intentando eliminar publicación");
    await deleteListing({
      listingId,
      ownerId: user.id,
    });
    console.log("[DELETE] Publicación eliminada exitosamente");

    sendJson(res, 204);
  } catch (error) {
    console.error("[DELETE] Error eliminando publicación:", error);
    throw error;
  }
}
