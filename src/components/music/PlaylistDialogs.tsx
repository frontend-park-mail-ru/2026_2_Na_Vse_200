import { createElement, useState } from '@navse200/my-react'
import { Modal } from '../modal/Modal.tsx'
import { modals } from '../modal/manager.ts'
import { CatalogCover } from './CatalogCover.tsx'
import { CatalogSearchField } from './CatalogSearchField.tsx'
import { formatDuration } from './TrackList.tsx'
import { matchesQuery, mergeTracks } from '../../features/music/catalog.ts'
import { getArtistName, getTrackCover } from '../../features/music/presentation.ts'
import { errorMessage } from '../../shared/lib/forms.ts'
import type { Playlist, PlaylistDetails } from '../../features/music/playlists.ts'
import type { CatalogStatus, Track } from '../../types/domain.ts'
import './PlaylistDialogs.scss'

interface FormProps {
    playlist?: Playlist
    onSave: (details: PlaylistDetails) => void
}

export function PlaylistForm({ playlist, onSave }: FormProps) {
    const [cover, setCover] = useState(playlist?.cover ?? '')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const upload = (event: Event) => {
        const input = event.currentTarget as HTMLInputElement
        const file = input.files?.[0]
        if (!file) return
        input.value = ''
        if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) {
            setError('Выберите JPG или PNG размером до 2 МБ.')
            return
        }
        setError('')
        setBusy(true)
        const reader = new FileReader()
        reader.onload = () => {
            if (!input.isConnected) return
            const image = new Image()
            image.onload = () => {
                if (!input.isConnected) return
                setCover(image.src)
                setBusy(false)
            }
            image.onerror = () => {
                if (!input.isConnected) return
                setError('Не удалось открыть изображение.')
                setBusy(false)
            }
            image.src = String(reader.result)
        }
        reader.onerror = () => {
            if (!input.isConnected) return
            setError('Не удалось прочитать изображение.')
            setBusy(false)
        }
        reader.readAsDataURL(file)
    }

    const submit = (event: Event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget as HTMLFormElement)
        const name = String(data.get('name') ?? '').trim()
        if (!name) {
            setError('Введите название плейлиста.')
            return
        }
        try {
            onSave({ name, description: String(data.get('description') ?? '').trim(), cover })
            modals.close()
        } catch (failure) {
            setError(errorMessage(failure))
        }
    }

    return (
        <Modal className="playlist-dialog" title={playlist ? 'Редактировать плейлист' : 'Новый плейлист'} busy={busy}>
            <form className="playlist-dialog__form" onSubmit={submit}>
                <div className="playlist-dialog__upload">
                    <CatalogCover className="playlist-dialog__cover" src={cover} />
                    <div>
                        <input
                            className="playlist-dialog__file"
                            id="playlist-cover"
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={upload}
                            disabled={busy}
                        />
                        <label className="catalog-button" htmlFor="playlist-cover">
                            {playlist ? 'Изменить обложку' : 'Загрузить обложку'}
                        </label>
                        <small>JPG или PNG</small>
                    </div>
                </div>
                <label className="playlist-dialog__field">
                    Название
                    <input
                        name="name"
                        value={playlist?.name ?? ''}
                        placeholder="Мой плейлист"
                        maxLength={100}
                        required
                    />
                </label>
                <label className="playlist-dialog__field">
                    Описание
                    <textarea name="description" placeholder="Добавьте описание" maxLength={500}>
                        {playlist?.description ?? ''}
                    </textarea>
                </label>
                {error && (
                    <p className="playlist-dialog__error" role="alert">
                        {error}
                    </p>
                )}
                <div className="playlist-dialog__actions">
                    <button
                        className="catalog-button catalog-button--coral"
                        type="button"
                        onClick={modals.close}
                        disabled={busy}
                    >
                        Отмена
                    </button>
                    <button className="catalog-button" type="submit" disabled={busy}>
                        {playlist ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

interface PickerProps {
    playlist: Playlist
    tracks: Track[]
    getCatalog: () => { tracks: Track[]; status: CatalogStatus; error: string }
    onRetry: () => void
    onSave: (tracks: Track[]) => void
}

export function PlaylistTrackPicker({ playlist, tracks, getCatalog, onRetry, onSave }: PickerProps) {
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState<Track[]>([])
    const [error, setError] = useState('')
    const catalog = getCatalog()
    const existing = new Set(playlist.tracks.map(track => String(track.id)))
    const results = mergeTracks(tracks, catalog.tracks).filter(track =>
        matchesQuery(`${track.title ?? ''} ${getArtistName(track)}`, query),
    )
    const submit = (event: Event) => {
        event.preventDefault()
        if (!selected.length) return
        try {
            onSave(selected)
            modals.close()
        } catch (failure) {
            setError(errorMessage(failure))
        }
    }

    return (
        <Modal className="playlist-dialog playlist-dialog--picker" title="Добавить треки">
            <form onSubmit={submit}>
                <p className="playlist-dialog__subtitle">В плейлист «{playlist.name}»</p>
                <CatalogSearchField
                    query={query}
                    onChange={setQuery}
                    label="Найти трек"
                    placeholder="Трек или исполнитель"
                />
                {results.length ? (
                    <ul className="playlist-picker" aria-label="Треки для добавления">
                        {results.map(track => {
                            const added = existing.has(String(track.id))
                            const checked = selected.some(item => item.id === track.id)
                            return (
                                <li key={track.id}>
                                    <label
                                        className={`playlist-picker__row${checked ? ' playlist-picker__row--selected' : ''}`}
                                    >
                                        <CatalogCover src={getTrackCover(track)} />
                                        <span className="playlist-picker__meta">
                                            <strong>{track.title || 'Без названия'}</strong>
                                            <small>{getArtistName(track)}</small>
                                        </span>
                                        {added ? (
                                            <small>Уже в плейлисте</small>
                                        ) : (
                                            <span className="playlist-picker__choice">
                                                <small>{formatDuration(track)}</small>
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    aria-label={`Выбрать ${track.title || 'трек'}`}
                                                    onChange={() =>
                                                        setSelected(current =>
                                                            checked
                                                                ? current.filter(item => item.id !== track.id)
                                                                : [...current, track],
                                                        )
                                                    }
                                                />
                                            </span>
                                        )}
                                    </label>
                                </li>
                            )
                        })}
                    </ul>
                ) : catalog.status === 'error' ? (
                    <div className="track-list-message" role="alert">
                        <span>{catalog.error}</span>
                        <button type="button" onClick={onRetry}>
                            Попробовать ещё раз
                        </button>
                    </div>
                ) : (
                    <p className="playlist-dialog__empty" role="status">
                        {catalog.status === 'ready' ? 'Треки не найдены.' : 'Загружаем треки…'}
                    </p>
                )}
                {error && (
                    <p className="playlist-dialog__error" role="alert">
                        {error}
                    </p>
                )}
                <div className="playlist-dialog__actions">
                    <strong className="playlist-dialog__selection">Выбрано: {selected.length}</strong>
                    <button className="catalog-button catalog-button--coral" type="button" onClick={modals.close}>
                        Отмена
                    </button>
                    <button className="catalog-button" type="submit" disabled={!selected.length}>
                        Добавить
                    </button>
                </div>
            </form>
        </Modal>
    )
}

export function PlaylistDelete({ playlist, onDelete }: { playlist: Playlist; onDelete: () => void }) {
    const [error, setError] = useState('')
    const confirm = () => {
        try {
            onDelete()
            modals.close()
        } catch (failure) {
            setError(errorMessage(failure))
        }
    }
    return (
        <Modal className="playlist-dialog playlist-dialog--delete" title="Удалить плейлист?">
            <p>Плейлист «{playlist.name}» будет удалён.</p>
            {error && (
                <p className="playlist-dialog__error" role="alert">
                    {error}
                </p>
            )}
            <div className="playlist-dialog__actions">
                <button className="catalog-button catalog-button--dark" type="button" onClick={modals.close}>
                    Отмена
                </button>
                <button className="catalog-button catalog-button--coral" type="button" onClick={confirm}>
                    Удалить
                </button>
            </div>
        </Modal>
    )
}
