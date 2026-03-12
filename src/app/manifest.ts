
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LEOBET PRO',
    short_name: 'LEOBET',
    description: 'Plataforma Profissional de Apostas e Bingos Auditados',
    start_url: '/',
    display: 'standalone',
    background_color: '#1E3A8A',
    theme_color: '#1E3A8A',
    icons: [
      {
        src: 'https://leobet-probets.vercel.app/leobet-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      }
    ],
    orientation: 'portrait',
    scope: '/',
  }
}
