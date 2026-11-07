// Compatibility entry point: audio is served by track ID from our backend.
export { createPlayer, getAudioUrl } from '../../shared/audio/player.ts'
export type { AudioPlayer, PlaybackState, PlayableTrack } from '../../shared/audio/player.ts'
