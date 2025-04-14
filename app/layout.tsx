import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PYUSD Privacy Pool',
  description: 'Secure and private PYUSD transactions with zero-knowledge proofs',
  keywords: 'PYUSD, Privacy, Zero Knowledge, Blockchain, Cryptocurrency',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen`}>
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative">
          {children}
        </div>
      </body>
    </html>
  )
}
