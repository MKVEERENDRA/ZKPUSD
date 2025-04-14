import { ethers } from 'ethers'
import { buildPoseidon } from 'circomlibjs'

export class MerkleTree {
  private levels: number
  private tree: string[][]
  private defaultNodes: string[]
  private currentIndex: number
  private poseidonHash: any // TODO: Add proper typing once available

  constructor(levels: number) {
    this.levels = levels
    this.currentIndex = 0
    this.tree = Array(levels).fill([])
    this.defaultNodes = this.generateDefaultNodes()
    this.initializePoseidon()
  }

  private async initializePoseidon() {
    this.poseidonHash = await buildPoseidon()
  }

  private generateDefaultNodes(): string[] {
    const defaultNodes: string[] = []
    defaultNodes[0] = '0x' + '0'.repeat(64) // Zero hash as hex string

    for (let i = 1; i < this.levels; i++) {
      defaultNodes[i] = this.hashLeftRight(defaultNodes[i - 1], defaultNodes[i - 1])
    }

    return defaultNodes
  }

  private hashLeftRight(left: string, right: string): string {
    const hash = this.poseidonHash([left, right])
    return '0x' + hash.toString(16).padStart(64, '0')
  }

  public insert(commitment: string): void {
    let index = this.currentIndex
    let currentHash = commitment

    for (let i = 0; i < this.levels; i++) {
      let level = this.tree[i] || []
      if (index % 2 === 0) {
        level[index] = currentHash
        currentHash = this.hashLeftRight(currentHash, this.defaultNodes[i])
      } else {
        level[index] = currentHash
        currentHash = this.hashLeftRight(level[index - 1], currentHash)
      }
      this.tree[i] = level
      index = Math.floor(index / 2)
    }

    this.currentIndex++
  }

  public getRoot(): string {
    if (this.currentIndex === 0) {
      return this.defaultNodes[this.levels - 1]
    }

    let index = this.currentIndex - 1
    let currentHash = this.tree[0][index]

    for (let i = 1; i < this.levels; i++) {
      const level = this.tree[i]
      if (index % 2 === 0) {
        currentHash = this.hashLeftRight(currentHash, this.defaultNodes[i - 1])
      } else {
        currentHash = this.hashLeftRight(level[index - 1], currentHash)
      }
      index = Math.floor(index / 2)
    }

    return currentHash
  }

  public getProof(index: number): string[] {
    if (index >= this.currentIndex) {
      throw new Error('Index out of bounds')
    }

    const proof: string[] = []
    let currentIndex = index

    for (let i = 0; i < this.levels - 1; i++) {
      const levelSize = Math.pow(2, i)
      const level = this.tree[i]

      const isLeft = currentIndex % 2 === 0
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1

      if (siblingIndex < levelSize && level[siblingIndex]) {
        proof.push(level[siblingIndex])
      } else {
        proof.push(this.defaultNodes[i])
      }

      currentIndex = Math.floor(currentIndex / 2)
    }

    return proof
  }
} 