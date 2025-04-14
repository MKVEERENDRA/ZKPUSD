'use client'

import React, { useState } from 'react'
import { ethers } from 'ethers'
import { generateDepositProof } from '../../lib/zk/proofGenerator'
import { CONFIG } from '../config'
import { NFTCard, NFTInput, NFTButton, NFTLabel } from './styles/NFTCard'

interface DepositFormState {
  amount: string
  secret: string
  isLoading: boolean
  error: string | null
}

export default function DepositForm() {
  const [state, setState] = useState<DepositFormState>({
    amount: '',
    secret: '',
    isLoading: false,
    error: null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState({ ...state, isLoading: true, error: null })

    try {
      // Generate ZK proof for deposit
      const proof = await generateDepositProof({
        amount: state.amount,
        secret: state.secret,
        timestamp: Math.floor(Date.now() / 1000)
      })

      // Get signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Get contract instance
      const poolContract = new ethers.Contract(
        CONFIG.POOL_ADDRESS,
        ['function deposit(bytes32 commitment, uint256 amount) external'],
        signer
      )

      // First approve PYUSD transfer
      const pyusdContract = new ethers.Contract(
        CONFIG.PYUSD_ADDRESS,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        signer
      )

      const amount = ethers.parseEther(state.amount)
      await pyusdContract.approve(CONFIG.POOL_ADDRESS, amount)

      // Submit deposit with proof
      const tx = await poolContract.deposit(proof.commitment, amount)
      await tx.wait()

      setState({
        amount: '',
        secret: '',
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Deposit error:', error)
      setState({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process deposit'
      })
    }
  }

  return (
    <NFTCard glowColor="rgba(147, 51, 234, 0.5)">
      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Deposit PYUSD
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <NFTLabel htmlFor="amount">
              Amount (PYUSD)
            </NFTLabel>
            <NFTInput
              type="number"
              id="amount"
              step="0.01"
              min="0"
              required
              value={state.amount}
              onChange={(e) => setState({ ...state, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </div>

          <div>
            <NFTLabel htmlFor="secret">
              Secret Phrase
            </NFTLabel>
            <NFTInput
              type="password"
              id="secret"
              required
              value={state.secret}
              onChange={(e) => setState({ ...state, secret: e.target.value })}
              placeholder="Enter your secret phrase"
            />
            <p className="text-sm text-purple-300/80 mt-2 animate-pulse">
              🔐 Remember this secret! You'll need it to withdraw.
            </p>
          </div>

          {state.error && (
            <div className="text-red-400 text-sm mt-2 animate-fade-in">
              {state.error}
            </div>
          )}

          <NFTButton
            type="submit"
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin mr-2">⚡</div>
                Processing...
              </div>
            ) : (
              'Deposit'
            )}
          </NFTButton>
        </form>
      </div>
    </NFTCard>
  )
} 