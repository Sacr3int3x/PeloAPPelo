// Simple key-value storage
const store = new Map();

export const db = {
  get(key) {
    return store.get(key);
  },
  set(key, value) {
    store.set(key, value);
  },
  delete(key) {
    store.delete(key);
  },
  clear() {
    store.clear();
  },
  has(key) {
    return store.has(key);
  }
};