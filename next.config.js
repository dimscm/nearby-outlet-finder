/** @type {import('next').NextConfig} */
// Static export untuk GitHub Pages. BASE_PATH diisi otomatis oleh workflow (mis. /nearby-outlet-finder).
const basePath = process.env.BASE_PATH || '';
// Penanda versi build; aplikasi membandingkannya dengan /version.json untuk memberi tahu ada versi baru
const buildId = process.env.BUILD_ID || 'dev';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_BUILD_ID: buildId },
};

module.exports = nextConfig;
