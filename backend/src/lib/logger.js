const stamp = () => new Date().toISOString().slice(11, 23);

const write = (level, colour, args) => {
  // eslint-disable-next-line no-console
  console.log(`\x1b[90m${stamp()}\x1b[0m ${colour}${level}\x1b[0m`, ...args);
};

export const logger = {
  info: (...args) => write('info ', '\x1b[36m', args),
  warn: (...args) => write('warn ', '\x1b[33m', args),
  error: (...args) => write('error', '\x1b[31m', args),
  ready: (...args) => write('ready', '\x1b[32m', args),
};
