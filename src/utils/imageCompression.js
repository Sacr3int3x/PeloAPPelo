/**
 * Utilidad para comprimir imágenes en el cliente antes de subirlas
 */

/**
 * Comprime una imagen manteniendo la calidad visual
 * @param {File} file - Archivo de imagen
 * @param {Object} options - Opciones de compresión
 * @returns {Promise<Blob>} Imagen comprimida
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxSizeMB = 1,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Crear canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        // Mejorar calidad de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob con compresión
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Error al comprimir imagen"));
              return;
            }

            // Si aún es muy grande, reducir calidad
            const sizeMB = blob.size / 1024 / 1024;
            if (sizeMB > maxSizeMB && quality > 0.5) {
              compressImage(file, {
                ...options,
                quality: quality - 0.1,
              })
                .then(resolve)
                .catch(reject);
              return;
            }

            resolve(blob);
          },
          file.type === "image/png" ? "image/png" : "image/jpeg",
          quality,
        );
      };

      img.onerror = () => reject(new Error("Error al cargar imagen"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Error al leer archivo"));
    reader.readAsDataURL(file);
  });
}

/**
 * Genera una versión thumbnail de una imagen
 */
export async function generateThumbnail(file, size = 300) {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.8,
    maxSizeMB: 0.1,
  });
}

/**
 * Valida que un archivo sea una imagen
 */
export function isImageFile(file) {
  return file && file.type.startsWith("image/");
}

/**
 * Obtiene dimensiones de una imagen
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error("No es un archivo de imagen"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
        });
      };
      img.onerror = () => reject(new Error("Error al cargar imagen"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Error al leer archivo"));
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte una imagen a WebP si el navegador lo soporta
 */
export async function convertToWebP(file, quality = 0.85) {
  if (!window.HTMLCanvasElement.prototype.toBlob) {
    return file; // Fallback para navegadores antiguos
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback al original
              return;
            }
            resolve(blob);
          },
          "image/webp",
          quality,
        );
      };

      img.onerror = () => resolve(file); // Fallback al original
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(file); // Fallback al original
    reader.readAsDataURL(file);
  });
}

/**
 * Hook para comprimir imágenes antes de subir
 */
export function useImageCompression(options = {}) {
  const compress = async (files) => {
    if (!files || files.length === 0) return [];

    const compressionPromises = Array.from(files).map(async (file) => {
      if (!isImageFile(file)) return file;

      try {
        const compressed = await compressImage(file, options);
        return new File([compressed], file.name, {
          type: compressed.type,
          lastModified: Date.now(),
        });
      } catch (error) {
        console.error("Error comprimiendo imagen:", error);
        return file; // Retornar original en caso de error
      }
    });

    return Promise.all(compressionPromises);
  };

  return compress;
}
