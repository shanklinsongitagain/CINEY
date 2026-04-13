import fs from 'node:fs'

function fail(message) {
  console.error(`❌ ${message}`)
  process.exitCode = 1
}

function pass(message) {
  console.log(`✅ ${message}`)
}

const requiredFiles = [
  '.github/workflows/android-build.yml',
  'android/app/src/main/AndroidManifest.xml',
  'src/lib/player.js',
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    fail(`Missing required file: ${file}`)
  } else {
    pass(`Found ${file}`)
  }
}

const envTemplateRequired = ['VITE_TMDB_API_KEY', 'VITE_PLAYER_BASE_URL', 'VITE_PLAYER_ALLOWED_ORIGIN']
const envText = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : ''
for (const key of envTemplateRequired) {
  if (!envText.includes(`${key}=`)) {
    fail(`.env missing ${key}`)
  } else {
    pass(`.env contains ${key}`)
  }
}

const manifest = fs.existsSync('android/app/src/main/AndroidManifest.xml')
  ? fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8')
  : ''
if (!manifest.includes('android.permission.INTERNET')) {
  fail('AndroidManifest missing INTERNET permission')
} else {
  pass('AndroidManifest INTERNET permission present')
}

if (!manifest.includes('android:hardwareAccelerated="true"')) {
  fail('AndroidManifest missing hardware acceleration')
} else {
  pass('AndroidManifest hardware acceleration enabled')
}

if (process.exitCode) {
  console.error('Release sanity checks failed')
  process.exit(process.exitCode)
}

console.log('🚀 Release sanity checks passed')
