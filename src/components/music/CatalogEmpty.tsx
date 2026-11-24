import { createElement } from '@navse200/my-react'
import type { Child } from '@navse200/my-react'
import backdrop from '../../assets/catalog/backdrop.svg'
import barrel from '../../assets/catalog/barrel.svg'
import extension from '../../assets/catalog/extension.svg'
import eyepiece from '../../assets/catalog/eyepiece.svg'
import lens from '../../assets/catalog/objective-lens.svg'
import note from '../../assets/catalog/music-note.svg'
import rightGlint from '../../assets/catalog/right-glint.svg'
import upperGlint from '../../assets/catalog/upper-glint.svg'

interface Props {
    title: string
    description?: string
    illustrated?: boolean
    children?: Child
}

export function CatalogEmpty({ title, description, illustrated, children }: Props) {
    return (
        <section className={`catalog-empty${illustrated ? ' catalog-empty--illustrated' : ''}`} aria-live="polite">
            {illustrated && (
                <div className="catalog-empty__illustration" aria-hidden="true">
                    <img className="catalog-empty__backdrop" src={backdrop} alt="" />
                    <img className="catalog-empty__eyepiece" src={eyepiece} alt="" />
                    <img className="catalog-empty__extension" src={extension} alt="" />
                    <img className="catalog-empty__barrel" src={barrel} alt="" />
                    <img className="catalog-empty__lens" src={lens} alt="" />
                    <img className="catalog-empty__upper-glint" src={upperGlint} alt="" />
                    <img className="catalog-empty__right-glint" src={rightGlint} alt="" />
                    <img className="catalog-empty__note" src={note} alt="" />
                </div>
            )}
            <h2>{title}</h2>
            {description && <p>{description}</p>}
            {children}
        </section>
    )
}
