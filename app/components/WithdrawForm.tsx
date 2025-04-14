'use client'

import React, { useState } from 'react'
import { ethers } from 'ethers'
import { generateWithdrawProof } from '../../lib/zk/proofGenerator'
import { CONFIG } from '../config'
import { NFTCard, NFTInput, NFTButton, NFTLabel } from './styles/NFTCard'

declare global {
  interface Window {
    ethereum: any
  }
}

interface WithdrawFormState {
  secret: string
  commitment: string
  amount: string
  depositTimestamp: number
  isLoading: boolean
  error: string | null
}

export default function WithdrawForm() {
  const [state, setState] = useState<WithdrawFormState>({
    secret: '',
    commitment: '',
    amount: '',
    depositTimestamp: 0,
    isLoading: false,
    error: null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState({ ...state, isLoading: true, error: null })

    try {
      // Generate ZK proof for withdrawal
      const proof = await generateWithdrawProof({
        amount: state.amount,
        secret: state.secret,
        depositTimestamp: state.depositTimestamp,
        currentTimestamp: Math.floor(Date.now() / 1000),
        commitment: state.commitment
      })

      // Get signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Get contract instance
      const poolContract = new ethers.Contract(
        CONFIG.POOL_ADDRESS,
        ['function withdraw(bytes calldata proof, bytes32 commitment, uint256 amount) external'],
        signer
      )

      // Submit withdrawal with proof
      const tx = await poolContract.withdraw(
        proof.proof,
        proof.publicSignals[0], // commitment
        ethers.parseEther(state.amount)
      )
      await tx.wait()

      setState({
        secret: '',
        commitment: '',
        amount: '',
        depositTimestamp: 0,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Withdrawal error:', error)
      setState({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process withdrawal'
      })
    }
  }

  return (
    <NFTCard glowColor="rgba(59, 130, 246, 0.5)">
      <div className="relative z-10">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Withdraw PYUSD
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <NFTLabel htmlFor="withdrawSecret">
              Secret Phrase
            </NFTLabel>
            <NFTInput
              type="password"
              id="withdrawSecret"
              required
              value={state.secret}
              onChange={(e) => setState({ ...state, secret: e.target.value })}
              placeholder="Enter your secret phrase"
            />
          </div>

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
              placeholder="Enter amount to withdraw"
            />
          </div>

          <p className="text-sm text-blue-300/80 mt-2 animate-pulse">
            ⏳ Withdrawals only possible within 2 hours of deposit
          </p>

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
                <div className="animate-spin mr-2">💫</div>
                Processing...
              </div>
            ) : (
              'Withdraw'
            )}
          </NFTButton>
        </form>
      </div>
    </NFTCard>
  )
} 