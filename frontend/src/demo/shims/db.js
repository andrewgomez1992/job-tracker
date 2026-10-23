/**
 * Browser stand-in for backend/src/db/index.js. The real database is set
 * once sql.js has loaded; until then every call goes through this proxy.
 */
let real = null;
export const setDatabase = (database) => { real = database; };

export const db = new Proxy({}, {
  get(_target, key) {
    if (!real) throw new Error('Demo database is not ready yet');
    const value = real[key];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

export const transaction = (fn) => db.transaction(fn);
