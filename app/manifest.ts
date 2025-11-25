import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ARC Forge - ARC Raiders Item Database',
    short_name: 'ARC Forge',
    description: 'Complete ARC Raiders item database with crafting trees, recipes, and item information',
    start_url: '/',
    display: 'standalone',
    background_color: '#07020b',
    theme_color: '#8b5cf6',
    icons: [
      {
        src: '/logo.webp',
        sizes: 'any',
        type: 'image/webp',
      },
    ],
    categories: ['games', 'entertainment', 'utilities'],
  };
}

