/**
 * Just enough of Express's Router for the backend's routes to run in the
 * browser: get/post/put/patch/delete, nested routers, :params and middleware.
 */
const compile = (pattern) => {
  const keys = [];
  const body = pattern.replace(/\/$/, '').replace(/:(\w+)/g, (_, key) => { keys.push(key); return '([^/]+)'; });
  return { re: new RegExp(`^${body}/?$`), keys };
};

const runChain = (handlers, req, res) => new Promise((resolve, reject) => {
  let i = 0;
  res.onFinish = resolve;
  const next = (err) => {
    if (err) { reject(err); return; }
    const handler = handlers[i++];
    if (!handler) { resolve(); return; }
    try {
      Promise.resolve(handler(req, res, next)).catch(reject);
    } catch (error) { reject(error); }
  };
  next();
});

export function Router() {
  const layers = [];
  const router = {
    use(prefix, sub) { layers.push({ prefix, sub }); return router; },
    async handle(req, res, url) {
      for (const layer of layers) {
        if (layer.sub) {
          if (url === layer.prefix || url.startsWith(`${layer.prefix}/`)) {
            if (await layer.sub.handle(req, res, url.slice(layer.prefix.length) || '/')) return true;
          }
          continue;
        }
        if (layer.method !== req.method) continue;
        const match = layer.re.exec(url);
        if (!match) continue;
        req.params = Object.fromEntries(layer.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
        await runChain(layer.handlers, req, res);
        return true;
      }
      return false;
    },
  };
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    router[method] = (path, ...handlers) => {
      layers.push({ method: method.toUpperCase(), ...compile(path), handlers });
      return router;
    };
  }
  return router;
}

export default { Router };
