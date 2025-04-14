import React from 'react'

interface NFTCardProps {
  children: React.ReactNode
  className?: string
}

interface NFTInputProps {
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

interface NFTButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}

interface NFTLabelProps {
  children: React.ReactNode
}

interface NFTErrorProps {
  message: string
}

interface GradientTextProps {
  children: React.ReactNode
  className?: string
}

export const NFTCard: React.FC<NFTCardProps> = ({ children, className = '' }) => (
  <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700/50 ${className}`}>
    {children}
  </div>
)

export const NFTInput: React.FC<NFTInputProps> = ({ type, value, onChange, placeholder, className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 ${className}`}
  />
)

export const NFTButton: React.FC<NFTButtonProps> = ({ children, onClick, disabled = false, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
)

export const NFTLabel: React.FC<NFTLabelProps> = ({ children }) => (
  <label className="block text-gray-300 text-sm font-medium mb-2">
    {children}
  </label>
)

export const NFTError: React.FC<NFTErrorProps> = ({ message }) => (
  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
    <p className="text-red-200 text-center">{message}</p>
  </div>
)

export const GradientText: React.FC<GradientTextProps> = ({ children, className = '' }) => (
  <span className={`bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
) 