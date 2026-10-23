/** No file storage in the browser demo: uploads keep their details but not the file. */
export const uploadDocument = (_req, _res, next) => next();
export const deleteUploadedFile = () => {};
