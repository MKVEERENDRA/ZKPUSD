import Image from 'next/image'
import { Metadata } from 'next'
import PrivacyPool from './components/PrivacyPool'

export const metadata: Metadata = {
  title: 'PYUSD Privacy Pool',
  description: 'Deposit and withdraw PYUSD privately using zero-knowledge proofs',
}

export default function Home() {
  return (
    <main className="min-h-screen luxury-bg flex flex-col justify-center items-center px-4 py-8 md:py-14 main-container">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="starry-bg"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,rgba(0,0,0,0)_70%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/5 to-indigo-950/10"></div>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[100px] -z-10"></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16">
          <div className="mb-4 animate-float">
            <Image 
              src="/lock-icon.svg" 
              width={80} 
              height={80} 
              alt="PYUSD Privacy Pool" 
              className="mx-auto opacity-80"
              onError={(e) => {
                // Fallback if image doesn't exist
                const target = e.target as HTMLElement;
                if (target.parentElement) {
                  target.parentElement.innerHTML = `
                    <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-600/30 to-[#D4AF37]/30 flex items-center justify-center">
                      <svg class="w-10 h-10 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                  `;
                }
              }}
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-5 animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-[#FFDF00] to-[#D4AF37]">
            PYUSD Privacy Pool
          </h1>
          <p className="text-[#D4AF37]/70 text-xl max-w-2xl mx-auto leading-relaxed">
            Secure your transactions with zero-knowledge technology for complete privacy and control
          </p>
        </header>

        {/* Main Content */}
        <div className="mx-auto">
          <PrivacyPool />
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 md:mt-20 pb-4">
          <div className="gold-divider max-w-xs mx-auto mb-6"></div>
          <div className="flex flex-col md:flex-row items-center justify-center md:space-x-8 space-y-4 md:space-y-0 text-[#D4AF37]/70">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#D4AF37]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              Secure
            </span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#D4AF37]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              Private
            </span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#D4AF37]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Trustless
            </span>
          </div>
          <p className="mt-6 text-xs text-[#D4AF37]/40">Powered by zero-knowledge cryptography and blockchain technology</p>
        </footer>
      </div>
    </main>
  )
} 