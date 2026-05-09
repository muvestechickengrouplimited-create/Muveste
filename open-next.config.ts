const config = {
  dangerous: {
    enableCacheInterception: false,
  },
  bundler: {
    external: ["jose", "jwks-rsa"],
  },
};

export default config;
