const { i18n } = require('./next-i18next.config')
const getGitCommitInfo = require('./utils/getGitCommitInfo')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  // Next.js otherwise writes an AGENTS.md into the repo root on every `next dev`.
  agentRules: false,
  async headers() {
    return [
      {
        // The service worker must never be served stale, and must be allowed
        // to control the whole origin.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

module.exports = async () => getGitCommitInfo(nextConfig)
