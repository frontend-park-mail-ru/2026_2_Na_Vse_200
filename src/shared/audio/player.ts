import { API_URL } from '../../config.ts'
import { connectionAvailable } from '../offline/network.ts'

export interface PlayableTrack {
    id: string | number
}

export interface PlaybackState {
    available: boolean
    playing: boolean
    loading: boolean
    currentTime: number
    duration: number
    volume: number
    muted: boolean
    error: string
}

function getAudioUrl(track?: PlayableTrack): string {
    if (!track || (typeof track.id !== 'string' && typeof track.id !== 'number')) return ''
    if (typeof track.id === 'number' && !Number.isFinite(track.id)) return ''
    const id = String(track.id)
    if (!id.trim()) return ''
    // The backend resolves this ID to a database record and a file in its media directory.
    return `${API_URL}/tracks/${encodeURIComponent(id)}/audio`
}

/** One element per mount. Connectivity events never reset its source or buffered data. */
export function createPlayer(audio: HTMLAudioElement = document.createElement('audio')) {
    audio.preload = 'metadata'
    audio.volume = 0.6136
    let source = ''
    let trackId: PlayableTrack['id'] | undefined
    let generation = 0
    let changingSource = false
    let disposed = false
    let onEnded = () => {}
    const listeners = new Set<() => void>()
    let state: PlaybackState = {
        available: false,
        playing: false,
        loading: false,
        currentTime: 0,
        duration: 0,
        volume: audio.volume,
        muted: false,
        error: '',
    }
    const emit = () => {
        if (!disposed && !changingSource) for (const listener of listeners) listener()
    }
    const sync = () => {
        if (changingSource || disposed) return
        state = {
            ...state,
            playing: !audio.paused && !audio.ended,
            currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
            duration: Number.isFinite(audio.duration) ? audio.duration : 0,
            volume: audio.volume,
            muted: audio.muted,
        }
        emit()
    }
    const ready = () => {
        state = { ...state, loading: false, error: '' }
        sync()
    }
    const waiting = () => {
        state = {
            ...state,
            loading: true,
            error: connectionAvailable() ? '' : 'Буфер закончился. Подключитесь к интернету для продолжения.',
        }
        sync()
    }
    const failed = () => {
        generation++
        state = {
            ...state,
            playing: false,
            loading: false,
            error: connectionAvailable()
                ? 'Не удалось воспроизвести аудио. Проверьте файл или попробуйте ещё раз.'
                : 'Для продолжения воспроизведения подключитесь к интернету.',
        }
        emit()
    }
    const events: Record<string, () => void> = {
        loadedmetadata: sync,
        durationchange: sync,
        timeupdate: sync,
        volumechange: sync,
        play: sync,
        pause: sync,
        playing: ready,
        canplay: ready,
        waiting,
        stalled: waiting,
        error: failed,
        ended: () => {
            ready()
            onEnded()
        },
    }
    for (const [event, handler] of Object.entries(events)) audio.addEventListener(event, handler)

    return {
        getState: () => state,
        subscribe(listener: () => void) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        setOnEnded(listener: () => void) {
            onEnded = listener
        },
        setTrack(track?: PlayableTrack) {
            const next = getAudioUrl(track)
            if (disposed || (next === source && trackId === track?.id)) return
            changingSource = true
            generation++
            source = next
            trackId = track?.id
            audio.pause()
            if (source) audio.src = source
            else audio.removeAttribute('src')
            audio.load()
            state = {
                ...state,
                available: Boolean(source),
                playing: false,
                loading: false,
                currentTime: 0,
                duration: 0,
                error: '',
            }
            changingSource = false
        },
        async play() {
            if (!source || disposed) return
            const request = ++generation
            state = { ...state, loading: true, error: '' }
            emit()
            try {
                // Reload only after an explicit retry of a failed resource, never on disconnect.
                if (audio.error && connectionAvailable()) audio.load()
                await audio.play()
                if (disposed || request !== generation) return
                ready()
            } catch {
                if (!disposed && request === generation) failed()
            }
        },
        pause() {
            generation++
            audio.pause()
            state = { ...state, playing: false, loading: false }
            emit()
        },
        seek(seconds: number) {
            if (!source || !Number.isFinite(seconds) || state.duration <= 0) return
            const target = Math.max(0, Math.min(state.duration, seconds))
            if (!connectionAvailable()) {
                let seekable = false
                for (let index = 0; index < audio.seekable.length; index++) {
                    if (target >= audio.seekable.start(index) && target <= audio.seekable.end(index)) seekable = true
                }
                if (!seekable) {
                    state = { ...state, error: 'Эта часть трека недоступна без интернета.' }
                    emit()
                    return
                }
            }
            try {
                audio.currentTime = target
                sync()
            } catch {
                state = { ...state, error: 'Перемотка пока недоступна.' }
                emit()
            }
        },
        setVolume(value: number) {
            if (!Number.isFinite(value)) return
            audio.volume = Math.max(0, Math.min(1, value))
            audio.muted = false
            sync()
        },
        toggleMute() {
            audio.muted = !audio.muted
            sync()
        },
        dispose() {
            disposed = true
            generation++
            listeners.clear()
            for (const [event, handler] of Object.entries(events)) audio.removeEventListener(event, handler)
            audio.pause()
            audio.removeAttribute('src')
            audio.load()
        },
    }
}

export type AudioPlayer = ReturnType<typeof createPlayer>
