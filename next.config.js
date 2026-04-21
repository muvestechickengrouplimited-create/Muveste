/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14.1 requires this to safely externalize node-specific packages during SSR/Server tasks
    serverComponentsExternalPackages: ['firebase-admin', 'googleapis', 'google-auth-library', 'undici'],
  },
};

module.exports = nextConfig;
