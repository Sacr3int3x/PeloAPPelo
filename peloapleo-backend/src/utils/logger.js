export function logInfo(message, meta = {}) {
  console.log(
    `[INFO] ${new Date().toISOString()} ${message}`,
    Object.keys(meta).length ? meta : "",
  );
}

export function logError(message, error) {
  console.error(
    `[ERROR] ${new Date().toISOString()} ${message}`,
    error && error.stack ? error.stack : error || "",
  );
}
