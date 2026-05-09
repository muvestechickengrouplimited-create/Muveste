/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin', 'googleapis', 'google-auth-library', 'undici'],
};

module.exports = nextConfig;
