import test from 'node:test'
import assert from 'node:assert/strict'
import { createPlayer, getAudioUrl, formatTime } from '../src/features/music/player.ts'
import { getHomeData } from '../src/features/music/api.ts'

class FakeAudio extends EventTarget {
    preload = ''
    volume = 1
    muted = false
    paused = true
    ended = false
    src = ''
    currentTime = 0
    duration = NaN
    error: { code: number } | null = null
    loads = 0
    playResult: Promise<void> = Promise.resolve()
    play() {
        this.paused = false
        this.dispatchEvent(new Event('play'))
        return this.playResult
    }
    pause() {
        this.paused = true
    }
    load() {
        this.loads++
        this.currentTime = 0
        this.duration = NaN
        this.error = null
    }
    removeAttribute(name: string) {
        if (name === 'src') this.src = ''
    }
}
function setup() {
    const audio = new FakeAudio()
    // The fake implements only the native media surface exercised by the controller.
    const player = createPlayer(audio as unknown as HTMLAudioElement)
    player.setTrack({ id: 1, audio_url: 'https://example.test/song.mp3' })
    return { audio, player }
}

test('audio URLs use the explicit media address, not the track ID', () => {
    assert.equal(getAudioUrl({ id: 'track-id' }), '')
    assert.equal(
        getAudioUrl({ id: 1, audio_url: '/api/v1/media/file-id' }, 'https://api.test/'),
        'https://api.test/api/v1/media/file-id',
    )
    assert.equal(getAudioUrl({ id: 1, audio_url: 'javascript:alert(1)' }), '')
    assert.equal(getAudioUrl({ id: 1, audio_url: '//other.test/file.mp3' }), '')
    assert.equal(formatTime(NaN), '0:00')
    assert.equal(formatTime(125.9), '2:05')
})

test('native events drive time, duration, play state, seek and volume', async () => {
    const { audio, player } = setup()
    await player.play()
    assert.equal(player.getState().playing, true)
    audio.duration = 120
    audio.currentTime = 10
    audio.dispatchEvent(new Event('loadedmetadata'))
    assert.equal(player.getState().duration, 120)
    player.seek(500)
    assert.equal(audio.currentTime, 120)
    player.seek(NaN)
    assert.equal(audio.currentTime, 120)
    player.setVolume(0.25)
    assert.equal(audio.volume, 0.25)
    player.toggleMute()
    assert.equal(player.getState().muted, true)
    player.setVolume(0.5)
    assert.equal(audio.muted, false)
    player.pause()
    assert.equal(audio.paused, true)
    assert.equal(player.getState().playing, false)
    player.dispose()
})

test('rerendering the same track does not reload it; source changes reset progress', () => {
    const { audio, player } = setup()
    player.setTrack({ id: 1, audio_url: 'https://example.test/song.mp3' })
    assert.equal(audio.loads, 1)
    audio.currentTime = 10
    player.setTrack({ id: 2, audio_url: 'https://example.test/next.mp3' })
    assert.equal(audio.currentTime, 0)
    assert.equal(player.getState().duration, 0)
    player.setTrack(undefined)
    assert.equal(audio.src, '')
    assert.equal(player.getState().available, false)
    player.dispose()
})

test('an old rejected play promise cannot overwrite the new track', async () => {
    const { audio, player } = setup()
    let rejectOld: (reason: Error) => void = () => {}
    audio.playResult = new Promise((_, reject) => {
        rejectOld = reject
    })
    const oldPlay = player.play()
    player.setTrack({ id: 2, audio_url: 'https://example.test/next.mp3' })
    audio.playResult = Promise.resolve()
    await player.play()
    rejectOld(new Error('interrupted'))
    await oldPlay
    assert.equal(player.getState().error, '')
    assert.equal(player.getState().playing, true)
    player.dispose()
})

test('play rejection is visible and disposal removes listeners and source', async () => {
    const { audio, player } = setup()
    audio.playResult = Promise.reject(new DOMException('blocked', 'NotAllowedError'))
    await player.play()
    assert.match(player.getState().error, /Браузер/)
    let updates = 0
    let ended = 0
    player.subscribe(() => updates++)
    player.setOnEnded(() => ended++)
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    assert.equal(ended, 1)
    player.dispose()
    const before = updates
    audio.dispatchEvent(new Event('timeupdate'))
    audio.dispatchEvent(new Event('ended'))
    assert.equal(updates, before)
    assert.equal(ended, 1)
    assert.equal(audio.src, '')
    assert.equal(audio.paused, true)
})

test('catalog accepts nullable images from Go API and checks audio_url', async () => {
    const body = {
        tracks: [{ id: 'track', cover_url: null, audio_url: '/api/v1/media/file' }],
        artists: [{ id: 'artist', image_url: null }],
        albums: [{ id: 'album', cover_url: null }],
    }
    const request: typeof fetch = async () => new Response(JSON.stringify(body))
    assert.deepEqual(await getHomeData(request), body)
    await assert.rejects(
        getHomeData(
            async () =>
                new Response(
                    JSON.stringify({
                        ...body,
                        tracks: [{ id: 'track', audio_url: 42 }],
                    }),
                ),
        ),
        /неизвестном формате/,
    )
})
