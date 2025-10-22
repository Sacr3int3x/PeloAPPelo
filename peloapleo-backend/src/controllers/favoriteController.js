import { sendJson } from "../utils/http.js";
import { extractToken } from "../utils/auth.js";
import { requireUser } from "../services/authService.js";
import {
  addFavorite,
  listFavoritesByUser,
  removeFavorite,
} from "../services/favoriteService.js";

export async function listMine({ req, res }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const { items, ids } = await listFavoritesByUser(user.id);
  sendJson(res, 200, {
    items,
    ids: Array.from(ids),
  });
}

export async function add({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [listingId] = params;
  await addFavorite(user.id, listingId);
  sendJson(res, 200, { success: true });
}

export async function remove({ req, res, params }) {
  const token = extractToken(req);
  const user = await requireUser(token);
  const [listingId] = params;
  await removeFavorite(user.id, listingId);
  sendJson(res, 200, { success: true });
}
