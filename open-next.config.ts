import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  dangerous: {
    enableCacheInterception: false,
  },
  bundler: {
    external: ["jose", "jwks-rsa"],
  },
};

export default config;
