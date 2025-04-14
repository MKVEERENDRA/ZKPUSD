import * as snarkjs from 'snarkjs'
import { ethers } from 'ethers'

export interface DepositInput {
  amount: string
  secret: string
  timestamp: number
}

export interface WithdrawInput {
  amount: string
  secret: string
  depositTimestamp: number
  currentTimestamp: number
  commitment: string
}

export async function generateDepositProof(input: DepositInput) {
  // Generate nullifier from secret
  const nullifier = ethers.keccak256(ethers.toUtf8Bytes(input.secret))
  
  // Generate commitment hash using Poseidon
  const commitment = await snarkjs.poseidon([nullifier, input.secret])

  // TODO: Generate actual proof once circuits are ready
  // const { proof, publicSignals } = await snarkjs.groth16.fullProve(...)

  return {
    commitment,
    nullifier
  }
}

export async function generateWithdrawProof(input: WithdrawInput) {
  try {
    // Convert inputs to appropriate format
    const circuitInput = {
      amount: ethers.parseEther(input.amount).toString(),
      secret: BigInt('0x' + Buffer.from(input.secret).toString('hex')).toString(),
      depositTimestamp: input.depositTimestamp.toString(),
      currentTimestamp: input.currentTimestamp.toString(),
      commitment: input.commitment
    }

    // Generate witness
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      '/circuits/withdraw.wasm',
      '/circuits/withdraw_final.zkey'
    )

    // Convert proof to solidity calldata format
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals)
    const [proofEncoded, ...rest] = calldata.split(',')
    
    return {
      proof: JSON.parse(proofEncoded),
      publicSignals: rest.map(x => x.trim())
    }
  } catch (error) {
    console.error('Error generating withdrawal proof:', error)
    throw error
  }
} 