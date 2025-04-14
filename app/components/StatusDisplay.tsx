'use client'

import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { CONFIG } from '../config'
import { NFTCard, GradientText } from './styles/NFTCard'

interface Deposit {
  commitment: string
  amount: string
  timestamp: number
  isSpent: boolean
}

export default function StatusDisplay() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [totalLocked, setTotalLocked] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(true)
  const [userCommitments, setUserCommitments] = useState<string[]>([])

  useEffect(() => {
    const fetchPoolStatus = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const poolContract = new ethers.Contract(
          CONFIG.POOL_ADDRESS,
          [
            'function getDeposits() external view returns (tuple(bytes32 commitment, uint256 amount, uint256 timestamp, bool isSpent)[])',
            'function totalLocked() external view returns (uint256)',
            'function getUserCommitments(address user) external view returns (bytes32[])'
          ],
          provider
        )

        // Get user's commitments
        const signer = await provider.getSigner()
        const userAddress = await signer.getAddress()
        const commitments = await poolContract.getUserCommitments(userAddress)
        setUserCommitments(commitments)

        // Get all deposits
        const depositData = await poolContract.getDeposits()
        const formattedDeposits = depositData.map((deposit: any) => ({
          commitment: deposit.commitment,
          amount: ethers.formatEther(deposit.amount),
          timestamp: Number(deposit.timestamp),
          isSpent: deposit.isSpent
        }))

        // Get total locked amount
        const locked = await poolContract.totalLocked()
        
        setDeposits(formattedDeposits)
        setTotalLocked(ethers.formatEther(locked))
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching pool status:', error)
        setIsLoading(false)
      }
    }

    fetchPoolStatus()
    // Set up polling every 30 seconds
    const interval = setInterval(fetchPoolStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const isWithdrawable = (deposit: Deposit) => {
    if (deposit.isSpent) return false
    const now = Math.floor(Date.now() / 1000)
    const timePassed = now - deposit.timestamp
    return timePassed >= 7200 // 2 hours in seconds
  }

  const isUserDeposit = (commitment: string) => {
    return userCommitments.includes(commitment)
  }

  return (
    <NFTCard>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <GradientText className="text-2xl font-bold">
            Your Deposits
          </GradientText>
          <div className="text-right">
            <GradientText className="text-lg">
              Total Locked: {totalLocked} PYUSD
            </GradientText>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-lg text-purple-300">
            Your Verified Deposits
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-t-2 border-purple-500 rounded-full animate-spin" />
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No deposits available
            </div>
          ) : (
            <div className="space-y-3">
              {deposits
                .filter(deposit => isUserDeposit(deposit.commitment))
                .map((deposit) => (
                <div 
                  key={deposit.commitment}
                  className={`
                    p-4 rounded-lg
                    ${isWithdrawable(deposit) 
                      ? 'bg-purple-900/30 border border-purple-500/30' 
                      : 'bg-gray-800/30 border border-gray-700/30'}
                    transition-all duration-300
                  `}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-400">
                        Your Commitment: {`${deposit.commitment.slice(0, 10)}...${deposit.commitment.slice(-8)}`}
                      </div>
                      <div className="text-purple-300">
                        Amount: {deposit.amount} PYUSD
                      </div>
                    </div>
                    <div>
                      {deposit.isSpent ? (
                        <span className="px-3 py-1 bg-gray-700/20 text-gray-400 rounded-full text-sm">
                          Already Withdrawn
                        </span>
                      ) : isWithdrawable(deposit) ? (
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                          Ready to Withdraw
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-700/20 text-gray-400 rounded-full text-sm">
                          Waiting ({Math.floor((7200 - (Math.floor(Date.now() / 1000) - deposit.timestamp)) / 60)}m left)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </NFTCard>
  )
} 