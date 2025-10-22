import { apiRequest, buildImageUrl } from './api';
import { DEMO_LISTINGS } from '../data/demo';

export async function fetchListings(params, token) {
  try {
    const response = await apiRequest('/listings', { 
      token,
      signal: params?.signal 
    });
    
    // Si no hay listados reales, usar los de demo
    if (!response.listings || response.listings.length === 0) {
      return { listings: DEMO_LISTINGS };
    }

    return response;
  } catch (error) {
    console.warn('Error cargando listados reales, usando demos:', error);
    return { listings: DEMO_LISTINGS };
  }
}

export async function createListing(data, token) {
  return apiRequest('/listings', {
    method: 'POST',
    data,
    token
  });
}

export async function updateListingStatus(listingId, status, token) {
  return apiRequest(`/listings/${listingId}/status`, {
    method: 'PATCH',
    data: { status },
    token
  });
}

export function buildListingImageUrl(path) {
  return buildImageUrl(path);
}