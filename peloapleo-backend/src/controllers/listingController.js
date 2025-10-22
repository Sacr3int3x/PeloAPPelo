import { readJsonBody, sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import {
  createListing,
  getListingById,
  listListings,
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
  const body = await readJsonBody(req);
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

export async function updateStatus({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [listingId] = params;
  const body = await readJsonBody(req);
  const status = body?.status;
  const updated = await updateListingStatus({
    listingId,
    ownerId: user.id,
    status,
  });
  sendJson(res, 200, { item: updated });
}
