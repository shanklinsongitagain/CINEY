import { useEffect, useRef, useState } from 'react'
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { readSavedProgress, saveProgress } from '../lib/progress'
import { getMediaTitle } from '../lib/tmdb'

function VideoPlayer({ mediaType, id, season = 1, episode = 1, media, episodeDetails, sourceUrl, onClose }) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(0.8)
  const [isBuffering, setIsBuffering] = useState(false)
  const [error, setError] = useState(null)

  const { ref: playPauseRef, focused: playPauseFocused } = useFocusable({
    onEnterPress: () => togglePlay(),
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const startTime = readSavedProgress(mediaType, id, season, episode)
    video.currentTime = Math.max(0, startTime - 2)
    video.volume = 0.8
    setCurrentTime(startTime)
    setVolume(0.8)

    const handleTimeUpdate = () => {
      const ct = video.currentTime
      setCurrentTime(ct)
      
      if (Math.floor(ct) % 30 === 0 && ct > 5) {
        saveProgress(
          mediaType,
          id,
          ct,
          season,
          episode,
          {
            title: getMediaTitle(media),
            posterPath: media?.poster_path ?? '',
            backdropPath: media?.backdrop_path ?? '',
            releaseDate: media?.release_date || media?.first_air_date || '',
            episodeName: episodeDetails?.name ?? '',
          }
        )
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setError(null)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleWaiting = () => setIsBuffering(true)
    const handleCanPlay = () => setIsBuffering(false)
    const handleError = () => {
      setError('Unable to load video')
      setIsBuffering(false)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      saveProgress(
        mediaType,
        id,
        video.duration,
        season,
        episode,
        {
          title: getMediaTitle(media),
          posterPath: media?.poster_path ?? '',
          backdropPath: media?.backdrop_path ?? '',
          releaseDate: media?.release_date || media?.first_air_date || '',
          episodeName: episodeDetails?.name ?? '',
        }
      )
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
      video.removeEventListener('ended', handleEnded)
    }
  }, [mediaType, id, season, episode, media, episodeDetails])

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {
          setError('Playback failed')
        })
      } else {
        videoRef.current.pause()
      }
    }
    showControlsTemporarily()
  }

  const handleSeek = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX || (e.touches?.[0]?.clientX)) - rect.left
    const percent = Math.max(0, Math.min(x / rect.width, 1))
    const time = percent * duration

    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
    showControlsTemporarily()
  }

  const handleVolumeChange = (newVolume) => {
    const vol = Math.max(0, Math.min(newVolume, 1))
    setVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol
    }
    showControlsTemporarily()
  }

  const handleSkip = (direction) => {
    if (videoRef.current) {
      const skipAmount = direction === 'forward' ? 30 : 10
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(
          videoRef.current.currentTime + (direction === 'forward' ? skipAmount : -skipAmount),
          videoRef.current.duration
        )
      )
    }
    showControlsTemporarily()
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 5000)
    }
  }

  useEffect(() => {
    const handleMouseMove = () => showControlsTemporarily()
    const handleKeyDown = (e) => {
      if (!playerRef.current?.contains(document.activeElement)) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSkip('backward')
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSkip('forward')
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(volume + 0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(volume - 0.1)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          handleVolumeChange(volume === 0 ? 0.8 : 0)
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        default:
          break
      }
    }

    playerRef.current?.addEventListener('mousemove', handleMouseMove)
    playerRef.current?.addEventListener('touchmove', handleMouseMove)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      playerRef.current?.removeEventListener('mousemove', handleMouseMove)
      playerRef.current?.removeEventListener('touchmove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPlaying, volume, onClose])

  const formatTime = (sec) => {
    if (!Number.isFinite(sec)) return '0:00'
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div ref={playerRef} className="video-player" tabIndex={0}>
      <video
        ref={videoRef}
        className="video-player-element"
        src={sourceUrl}
        crossOrigin="anonymous"
        controlsList="nodownload"
      />

      {error && <div className="player-error">⚠️ {error}</div>}

      {isBuffering && <div className="player-buffering"><span>⟳</span> Buffering...</div>}

      <div className={`player-controls ${showControls ? 'show' : ''}`}>
        <div className="controls-top">
          <div className="media-info">
            <div className="media-title">{getMediaTitle(media)}</div>
            {mediaType === 'tv' && (
              <div className="media-episode">
                S{season}:E{episode}{episodeDetails?.name && ` — ${episodeDetails.name}`}
              </div>
            )}
          </div>
          <button className="close-button" onClick={onClose} title="Close (ESC)">✕</button>
        </div>

        <div className="controls-progress">
          <div
            className="progress-bar"
            onClick={handleSeek}
            onTouchStart={(e) => {
              handleSeek(e)
              e.currentTarget.addEventListener('touchmove', (e) => handleSeek(e), { once: true })
            }}
            role="slider"
            aria-valuemin="0"
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(currentTime)}
            tabIndex="0"
          >
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="controls-bottom">
          <div className="controls-left">
            <button
              ref={playPauseRef}
              className={`control-button play-button ${playPauseFocused ? 'focused' : ''}`}
              onClick={togglePlay}
              title="Play/Pause (Space)"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span className="time-separator">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="controls-right">
            <div className="volume-control">
              <button
                className="control-button"
                onClick={() => handleVolumeChange(volume === 0 ? 0.8 : 0)}
                title="Mute (M)"
              >
                {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="volume-slider"
                title="Volume (↑/↓)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
