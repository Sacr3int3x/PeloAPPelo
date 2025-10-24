import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const profilePhotoUpload = upload.single("photo");
export const listingPhotoUpload = upload.array("photos", 5);

export function handleMulter(middleware) {
  return (params) => {
    return new Promise((resolve, reject) => {
      middleware(params.req, params.res, (error) => {
        if (error) {
          error.statusCode = 400;
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
}
