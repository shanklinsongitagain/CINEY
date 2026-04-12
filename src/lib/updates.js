const githubRepo = import.meta.env.VITE_GITHUB_REPO

export async function getLatestReleaseVersion() {
  if (!githubRepo) {
    return null
  }

  const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`)
  if (!response.ok) {
    return null
  }

  const release = await response.json()
  return {
    version: release.tag_name || release.name || '',
    url: release.html_url || '',
  }
}

export function isNewerVersion(currentVersion, latestVersion) {
  if (!currentVersion || !latestVersion || currentVersion === latestVersion) {
    return false
  }

  return currentVersion !== latestVersion
}
