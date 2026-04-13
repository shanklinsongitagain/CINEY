import { useContext } from 'react'
import { PlayerContext } from './playerContext'

export function usePlayer() {
  return useContext(PlayerContext)
}
