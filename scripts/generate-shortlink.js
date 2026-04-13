import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '..', '.env')

function readEnvFileValue(key) {
  if (!fs.existsSync(envPath)) {
    return ''
  }

  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLine = envContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith(`${key}=`))

  return envLine ? envLine.slice(key.length + 1).trim() : ''
}

const githubRepo =
  process.env.VITE_GITHUB_REPO ||
  process.env.GITHUB_REPO ||
  readEnvFileValue('VITE_GITHUB_REPO') ||
  readEnvFileValue('GITHUB_REPO')

if (!githubRepo) {
  console.error('Missing VITE_GITHUB_REPO or GITHUB_REPO. Add VITE_GITHUB_REPO=owner/repo to your .env file or set it in the terminal before running npm run get-link.')
  process.exit(1)
}

const RELEASE_TAG = 'latest-firestick-build'

async function getLatestApkUrl() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ciney-shortlink-generator',
  }

  // Try /releases/latest first (works for non-prerelease)
  let response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`, { headers })

  // Fall back to the known tag if latest returns 404 (release marked as prerelease or doesn't exist yet)
  if (response.status === 404) {
    response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/tags/${RELEASE_TAG}`, { headers })
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `No release found yet for "${githubRepo}". ` +
        `Push to main to trigger the GitHub Actions build, then run this command again once the build finishes.`
      )
    }
    throw new Error(`GitHub API request failed with status ${response.status}`)
  }

  const release = await response.json()
  const apkAsset = (release.assets ?? []).find(
    (asset) => asset.name === 'app-debug.apk' || asset.name === 'app-release.apk',
  )

  if (!apkAsset?.browser_download_url) {
    throw new Error('Could not find app-debug.apk or app-release.apk in the latest release assets. The GitHub Actions build may still be running.')
  }

  return apkAsset.browser_download_url
}

async function shortenUrl(longUrl) {
  const shortenerUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
  const response = await fetch(shortenerUrl, {
    headers: {
      'User-Agent': 'ciney-shortlink-generator',
    },
  })

  if (!response.ok) {
    throw new Error(`TinyURL request failed with status ${response.status}`)
  }

  return response.text()
}

function printBox(shortUrl) {
  const lines = [
    '╔════════════════════════════════════════════════════════════╗',
    '║                    🚀 FIRESTICK LINK                      ║',
    `║ ${shortUrl.padEnd(58, ' ')}║`,
    '╚════════════════════════════════════════════════════════════╝',
  ]

  console.log(lines.join('\n'))
}

async function main() {
  const apkUrl = await getLatestApkUrl()
  const shortUrl = await shortenUrl(apkUrl)
  printBox(shortUrl)
}

main().catch((error) => {
  console.error(`Failed to generate Firestick short link: ${error.message}`)
  process.exit(1)
})
