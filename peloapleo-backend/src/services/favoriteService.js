import { getDb, withDb } from "../store/dataStore.js";
import { listingToResponse } from "./listingService.js";
import { prefixedId } from "../utils/id.js";

export async function listFavoritesByUser(userId) {
  const db = await getDb();
  const favs = db.favorites.filter((fav) => fav.userId === userId);
  const listings = favs
    .map((fav) => db.listings.find((listing) => listing.id === fav.listingId))
    .filter(Boolean)
    .map((listing) => listingToResponse(listing, db));
  return {
    items: listings,
    ids: new Set(favs.map((fav) => fav.listingId)),
  };
}

export async function addFavorite(userId, listingId) {
  await withDb((db) => {
    const listing = db.listings.find((item) => item.id === listingId);
    if (!listing) {
      const error = new Error("Publicación no encontrada.");
      error.statusCode = 404;
      throw error;
    }
    const existing = db.favorites.find(
      (fav) => fav.userId === userId && fav.listingId === listingId,
    );
    if (!existing) {
      db.favorites.push({
        id: prefixedId("fav"),
        userId,
        listingId,
        createdAt: new Date().toISOString(),
      });
    }
  });
}

export async function removeFavorite(userId, listingId) {
  await withDb((db) => {
    db.favorites = db.favorites.filter(
      (fav) => !(fav.userId === userId && fav.listingId === listingId),
    );
  });
}
