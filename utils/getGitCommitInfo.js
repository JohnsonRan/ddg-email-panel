const cp = require('node:child_process')

/**
 * Adds the current git commit date and short hash as NEXT_PUBLIC_* env vars so
 * the UI can show which build is running. Next.js 16 freezes the config object,
 * so a new object is returned instead of mutating the original.
 */
module.exports = async (nextConfig = {}) => {
  const env = {
    ...nextConfig.env,
    NEXT_PUBLIC_GIT_LASTCOMMIT_DATE: '',
    NEXT_PUBLIC_GIT_LASTCOMMIT_SHORTHASH: '',
  }
  try {
    env.NEXT_PUBLIC_GIT_LASTCOMMIT_DATE = cp
      .execSync('git --no-pager log -1 --format="%ai"')
      .toString()
      .trim()
    env.NEXT_PUBLIC_GIT_LASTCOMMIT_SHORTHASH = cp.execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    console.error('[GetGitCommitInfo] fail!')
  }
  return { ...nextConfig, env }
}
