function getServerPort(config) {
  if (config.SERVER_PORT) return config.SERVER_PORT;
  if (config.CALLBACK_URL) {
    try {
      let url = new URL(config.CALLBACK_URL);
      return url.port ? url.port : url.protocol === "https:" ? 443 : 80;
    } catch (e) {
      console.error("Bad config.CALLBACK_URL entry. Using default port.");
    }
  }
  return 3000;
}

function getSubpath(config) {
  if (config.PATH_KEY) return config.PATH_KEY;
  if (config.CALLBACK_URL) {
    try {
      let url = new URL(config.CALLBACK_URL);
      return url.pathname ? url.pathname : "/";
    // eslint-disable-next-line no-empty
    } finally {
    }
  }
  return "/";
}

module.exports = {
  getServerPort,
  getSubpath,
};
