import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Crime City: Underground Empire',
  description: 'Top-down crime-fighting action game with casino gambling',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
