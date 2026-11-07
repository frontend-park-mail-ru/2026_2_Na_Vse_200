import type { Track } from '../../types/domain.ts'
import { API_ORIGIN } from '../../config.ts'

/** audio_url is supplied by the API. Root-relative URLs belong to the API origin. */
export function getAudioUrl(track: Track | undefined, origin = API_ORIGIN): string {
    const url = track?.audio_url?.trim() ?? ''
    if (/^https?:\/\//i.test(url) || url.startsWith('blob:')) return url
    if (url.startsWith('/') && !url.startsWith('//')) return `${origin.replace(/\/$/, '')}${url}`
    return ''
}

export function formatTime(seconds: number): string {
    const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}

export interface PlaybackState {
    playing: boolean
    loading: boolean
    currentTime: number
    duration: number
    volume: number
    muted: boolean
    error: string
    available: boolean
}

/** One native audio element per mounted application. No media side effects during JSX rendering. */
export function createPlayer(audio: HTMLAudioElement = new Audio()) {
    audio.preload = 'metadata'
    audio.volume = 0.62
    let source = ''
    let trackId: Track['id'] | undefined
    let requestId = 0
    let disposed = false
    let state: PlaybackState = {
        playing: false,
        loading: false,
        currentTime: 0,
        duration: 0,
        volume: audio.volume,
        muted: false,
        error: '',
        available: false,
    }
    const listeners = new Set<() => void>()
    let onEnded = () => {}
    const emit = () => {
        if (!disposed) for (const listener of listeners) listener()
    }
    const sync = () => {
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
        state = { ...state, loading: false }
        sync()
    }
    const waiting = () => {
        state = { ...state, loading: true }
        sync()
    }
    const ended = () => {
        ready()
        onEnded()
    }
    const failed = () => {
        requestId++
        const message =
            audio.error?.code === 2
                ? 'Не удалось загрузить аудио. Проверьте соединение.'
                : 'Не удалось воспроизвести файл. Проверьте его адрес и формат.'
        state = { ...state, playing: false, loading: false, error: message }
        emit()
    }
    const events: Record<string, () => void> = {
        timeupdate: sync,
        loadedmetadata: sync,
        durationchange: sync,
        volumechange: sync,
        play: sync,
        pause: ready,
        playing: ready,
        canplay: ready,
        waiting,
        ended,
        error: failed,
    }
    for (const [name, handler] of Object.entries(events)) audio.addEventListener(name, handler)

    async function play() {
        if (disposed || !source) return
        const id = ++requestId
        state = { ...state, loading: true, error: '' }
        emit()
        try {
            if (audio.error) audio.load()
            await audio.play()
            if (disposed || id !== requestId) return
            ready()
        } catch (error) {
            if (disposed || id !== requestId) return
            state = {
                ...state,
                playing: false,
                loading: false,
                error:
                    error instanceof Error && error.name === 'NotAllowedError'
                        ? 'Браузер остановил запуск. Нажмите «Воспроизвести» ещё раз.'
                        : 'Не удалось запустить аудио. Проверьте файл или попробуйте ещё раз.',
            }
            emit()
        }
    }

    return {
        getState: () => state,
        subscribe(listener: () => void) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        setOnEnded(listener: () => void) {
            onEnded = listener
        },
        // Called by mountApp before render; browser events subsequently publish progress.
        setTrack(track: Track | undefined) {
            const nextSource = getAudioUrl(track)
            if (disposed || (source === nextSource && trackId === track?.id)) return
            requestId++
            audio.pause()
            source = nextSource
            trackId = track?.id
            state = {
                ...state,
                available: Boolean(source),
                playing: false,
                loading: false,
                currentTime: 0,
                duration: 0,
                error: '',
            }
            if (source) audio.src = source
            else audio.removeAttribute('src')
            audio.load()
        },
        play,
        pause() {
            requestId++
            audio.pause()
            state = { ...state, playing: false, loading: false }
            emit()
        },
        seek(seconds: number) {
            if (!source || !Number.isFinite(seconds) || state.duration <= 0) return
            try {
                audio.currentTime = Math.max(0, Math.min(seconds, state.duration))
                sync()
            } catch {
                state = { ...state, error: 'Перемотка пока недоступна. Дождитесь загрузки аудио.' }
                emit()
            }
        },
        setVolume(value: number) {
            if (!Number.isFinite(value)) return
            audio.volume = Math.max(0, Math.min(value, 1))
            audio.muted = false
            sync()
        },
        toggleMute() {
            audio.muted = !audio.muted
            sync()
        },
        dispose() {
            disposed = true
            requestId++
            listeners.clear()
            for (const [name, handler] of Object.entries(events)) audio.removeEventListener(name, handler)
            audio.pause()
            audio.removeAttribute('src')
            audio.load()
        },
    }
}

export type AudioPlayer = ReturnType<typeof createPlayer>
