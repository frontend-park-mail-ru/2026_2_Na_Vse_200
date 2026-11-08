import { ArtistPage } from '../../pages/ArtistPage.tsx'
import { createArtistController } from './controller.ts'
import { ARTIST_ROUTE } from './route.ts'

export const artistFeature = { ...ARTIST_ROUTE, Page: ArtistPage, createController: createArtistController }
