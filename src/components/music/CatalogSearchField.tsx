import { createElement } from '@navse200/my-react'
import search from '../../assets/artist/figma/search.svg'

interface Props {
    query: string
    onChange: (query: string) => void
    placeholder: string
    label: string
}

export function CatalogSearchField({ query, onChange, placeholder, label }: Props) {
    return (
        <div className="catalog-search-field">
            <img src={search} alt="" />
            <input
                type="search"
                value={query}
                aria-label={label}
                placeholder={placeholder}
                onInput={event => onChange((event.currentTarget as HTMLInputElement).value)}
                onKeyDown={event => {
                    if (event.key === 'Enter') event.preventDefault()
                }}
            />
        </div>
    )
}
