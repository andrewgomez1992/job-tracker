const join = (...parts) => parts.filter(Boolean).join('/').replace(/\/+/g, '/');
const basename = (p = '') => String(p).split('/').pop();
const dirname = (p = '') => String(p).split('/').slice(0, -1).join('/') || '/';
const extname = (p = '') => (/\.[^./]*$/.exec(String(p)) || [''])[0];
const resolve = (...parts) => join(...parts);
export { join, basename, dirname, extname, resolve };
export default { join, basename, dirname, extname, resolve };
