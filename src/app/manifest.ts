
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
        src: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=512&h=512&auto=format&fit=crop',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      }
    ],
    orientation: 'portrait',
    scope: '/',
  }
}
