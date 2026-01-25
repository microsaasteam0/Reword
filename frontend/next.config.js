/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://snippetstream-api22-production.up.railway.app',
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'ui-avatars.com'],
  },
}

module.exports = nextConfig