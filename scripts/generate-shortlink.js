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

async function getLatestApkUrl() {
  const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ciney-shortlink-generator',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}`)
  }

  const release = await response.json()
  const apkAsset = (release.assets ?? []).find((asset) => asset.name === 'app-debug.apk')

  if (!apkAsset?.browser_download_url) {
    throw new Error('Could not find app-debug.apk in the latest release assets.')
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
