import { createElement } from '@navse200/my-react'
import type { CollectionItem } from '../../types/domain.ts'
import { CatalogCover } from './CatalogCover.tsx'

export interface CatalogCard extends CollectionItem {
    href: string
    detail?: string
    favorite?: boolean
}

interface Props {
    items: CatalogCard[]
    round?: boolean
}

export function CatalogCards({ items, round = false }: Props) {
    return (
        <ul className={`catalog-cards${round ? ' catalog-cards--round' : ''}`}>
            {items.map(item => (
                <li key={item.id}>
                    <a href={item.href} data-link>
                        <CatalogCover src={item.image_url ?? item.cover_url} favorite={item.favorite} />
                        <strong>{item.name ?? item.title}</strong>
                        {item.detail && <small>{item.detail}</small>}
                    </a>
                </li>
            ))}
        </ul>
    )
}
