export const fileURLToPath = (url) => String(url);
export const pathToFileURL = (p) => ({ href: String(p) });
export default { fileURLToPath, pathToFileURL };
