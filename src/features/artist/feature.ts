import { ArtistPage } from '../../pages/ArtistPage.tsx'
import { createArtistController } from './controller.ts'
import { ARTIST_ROUTE } from './route.ts'

/** The integration point for App implementations on other branches. No profile or auth imports here. */
export const artistFeature = { ...ARTIST_ROUTE, Page: ArtistPage, createController: createArtistController }
