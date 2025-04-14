export const CONFIG = {
  NETWORK_ID: 17000,  // Holesky testnet
  MIN_DEPOSIT: 0.000001,
  MAX_DEPOSIT: 10000,
  TIMELOCK_SECONDS: 0,  // No timelock for testing
  PYUSD_ADDRESS: '0xf40575a665b3DB58803e60CDDDCF46f35a63622C',
  POOL_ADDRESS: '0xEa6ccaf5D6275aD7CDA2562F685fE5dB5FA2FAFD',
  VERIFIER_ADDRESS: '0xa91145a75C681d850B514a4529Ba8AA9fBF3dA5e'
}

export const NETWORK_DETAILS = {
  chainId: '17000',  // 17000 in hex
  chainName: 'Holesky',
  nativeCurrency: {
    name: 'Holesky ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://ethereum-holesky.publicnode.com'],
  blockExplorerUrls: ['https://holesky.etherscan.io']
} 