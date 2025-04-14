'use client'

import React, { useState, useEffect } from 'react'
import {ethers} from "ethers";
import { CONFIG, NETWORK_DETAILS, } from '../config';
import { PYUSD_ABI } from './cons'
import { config } from 'dotenv';


declare global {
  interface Window {
    ethereum: any;
  }
}

export default function PrivacyPool() {
  const uei ="https://blockchain.googleapis.com/v1/projects/eternal-insight-454209-c0/locations/asia-east1/endpoints/ethereum-holesky/rpc?key=AIzaSyCfk2WrM1miNMxwNdlUB2_NzzO2XoYBA-Q";
  const [amount, setAmount] = useState('')
  const [withdrawCommitment, setWithdrawCommitment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [userBalance, setUserBalance] = useState('0')
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [lastCommitment, setLastCommitment] = useState('')
  const [currentAccount, setCurrentAccount] = useState('')
  const [currentNetwork, setCurrentNetwork] = useState('')
  const [activeTab, setActiveTab] = useState('deposit')
  const [selectedCommitment, setSelectedCommitment] = useState<{
    commitment: string;
    secret: string;
    timestamp: number;
    amount: string;
  } | null>(null)
  const [recipient, setRecipient] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastActionStatus, setLastActionStatus] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleAccountChange = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setCurrentAccount("");
          setIsConnected(false);
          setError("Disconnected from MetaMask. Please reconnect.");
          // Optionally reload the page
        } else {
          setCurrentAccount(accounts[0]);
        }
      });
    }
  };

  const updateUserBalance = async (address: string) => {
    try {
      // Fix: Use JsonRpcProvider from ethers v6
      const provider = new ethers.JsonRpcProvider(uei);

      const pyusdContract = new ethers.Contract(
        CONFIG.PYUSD_ADDRESS,
        PYUSD_ABI,
        provider
      )
      const balance = await pyusdContract.balanceOf(address)
      setUserBalance(ethers.formatEther(balance))
    } catch (err) {
      console.error('Error fetching balance:', err)
    }
  }

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_DETAILS.chainId }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_DETAILS],
          })
        } catch (addError) {
          setError('Failed to add network')
        }
      } else {
        setError('Failed to switch network')
      }
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) return setError("Please install MetaMask");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
      setIsConnected(true);

      // Create provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      // Get signer
      const signer = await provider.getSigner();
      setSigner(signer);
      setError(""); // Clear error on successful connection
      window.location.reload();

    } catch (err: any) {
        setError("Error connecting to MetaMask: " + err.message);
    }
  };

  // Check if connected to MetaMask
  const checkIfconn = async () => {
    if (!window.ethereum) return setError("Please install MetaMask");
    const account = await window.ethereum.request({ method: "eth_accounts" });
    if (account.length) {
      setCurrentAccount(account[0]);
      setIsConnected(true);
      
      // Update balance if we have an account
      if (account[0]) {
        updateUserBalance(account[0]);
      }
    } else {
      setError("Please Connect to Wallet");
      setIsConnected(false);
    }
  };

  useEffect(() => {
    handleAccountChange();
    checkIfconn();
  }, []);

  const handleDeposit = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    if (!amount || isNaN(Number(amount))) {
      setError('Please enter a valid amount')
      return
    }

    const depositAmount = Number(amount)
    if (depositAmount < CONFIG.MIN_DEPOSIT) {
      setError(`Minimum deposit is ${CONFIG.MIN_DEPOSIT} PYUSD`)
      return
    }

    if (depositAmount > CONFIG.MAX_DEPOSIT) {
      setError(`Maximum deposit is ${CONFIG.MAX_DEPOSIT} PYUSD`)
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const signerAddress = await signer.getAddress()
      
      // First check if user has PYUSD balance
      const pyusdContract = new ethers.Contract(
        CONFIG.PYUSD_ADDRESS,
        [
          'function balanceOf(address account) external view returns (uint256)',
          'function approve(address spender, uint256 amount) external returns (bool)',
          'function allowance(address owner, address spender) external view returns (uint256)'
        ],
        signer
      )
      
      const balance = await pyusdContract.balanceOf(signerAddress)
      const amountWei = ethers.parseEther(amount)
      
      // Check if user has enough PYUSD balance
      if (balance < amountWei) {
        setError(`Insufficient PYUSD balance. You have ${ethers.formatEther(balance)} PYUSD but are trying to deposit ${amount} PYUSD.`)
        setLoading(false)
        return
      }
      
      // Create pool contract instance
      const poolContract = new ethers.Contract(
        CONFIG.POOL_ADDRESS,
        [
          'function deposit(bytes32 commitment, uint256 amount) external'
        ],
        signer
      )
      
      // Approve PYUSD spending
      setSuccess('Approving PYUSD spending...')
      console.log("Approving PYUSD spending...");
      try {
        const approveTx = await pyusdContract.approve(CONFIG.POOL_ADDRESS, amountWei)
        await approveTx.wait()
        console.log("Approval complete. Transaction hash:", approveTx.hash);
      } catch (approveError: any) {
        console.error("Approval failed:", approveError);
        setError(`PYUSD approval failed: ${approveError.message}`);
        setLoading(false);
        return;
      }

      // Generate a commitment hash
      const secret = ethers.hexlify(ethers.randomBytes(32)); // Generate a random secret
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Create a commitment hash: keccak256(amount + secret + timestamp)
      const commitmentData = ethers.solidityPacked(
        ["uint256", "bytes32", "uint256"],
        [amountWei, secret, timestamp]
      );
      const commitment = ethers.keccak256(commitmentData);
      
      console.log("Generated commitment:", commitment);
      console.log("Secret (SAVE THIS!):", secret);
      console.log("Timestamp:", timestamp);
      
      // Check allowance to confirm approval (wrapped in try/catch to be optional)
      try {
        const allowance = await pyusdContract.allowance(signerAddress, CONFIG.POOL_ADDRESS)
        console.log("Current allowance:", ethers.formatEther(allowance))
        
        if (allowance < amountWei) {
          setError("Approval failed. Please try again.")
          setLoading(false)
          return
        }
      } catch (allowanceError) {
        // If allowance check fails, just log it and continue
        console.log("Could not check allowance, continuing anyway:", allowanceError)
      }

      // Make deposit with manual gas estimation
      setSuccess('Making deposit...')
      console.log("Preparing to make deposit of", amount, "PYUSD with commitment:", commitment);
      
      // Try with manual gas limit to avoid estimation issues
      const gasLimit = 500000; // Set a high gas limit manually
      
      // First check if the contract is working with a small view function call
      try {
        // Check contract health with a simple estimate gas call
        const gasEstimate = await provider.estimateGas({
          to: CONFIG.POOL_ADDRESS,
          value: 0,
          data: "0x"
        });
        
        console.log("Contract appears to be responsive, gas estimate:", gasEstimate);
      } catch (contractCheckError) {
        console.error("Contract might not be active:", contractCheckError);
        setError("The privacy pool contract appears to be inactive or paused. Please try again later or contact support.");
        setLoading(false);
        return;
      }
      
      try {
        // Get user's ETH balance to ensure they have enough for gas
        const ethBalance = await provider.getBalance(signerAddress);
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei"); // Fallback gas price
        const estimatedGasCost = BigInt(gasLimit) * gasPrice;
        
        if (ethBalance < estimatedGasCost) {
          setError(`Insufficient ETH for gas. You need approximately ${ethers.formatEther(estimatedGasCost)} ETH for this transaction.`);
          setLoading(false);
          return;
        }
        
        // Now call deposit with both the commitment and amount
        const tx = await poolContract.deposit(commitment, amountWei, {
          gasLimit: gasLimit
        })
        
        console.log("Deposit transaction sent:", tx.hash);
        setSuccess(`Deposit transaction sent! Waiting for confirmation...`);
        
        const receipt = await tx.wait()
        console.log("Deposit complete, receipt:", receipt);
        
        if (receipt.status === 0) {
          throw new Error("Transaction failed on the blockchain. The contract rejected your deposit.")
        }

        // Store the commitment, secret, and timestamp for later use
        const commitmentInfo = {
          commitment: commitment,
          secret: secret,
          timestamp: timestamp,
          amount: amount
        };
        
        // Save to localStorage for later retrieval
        const savedCommitments = JSON.parse(localStorage.getItem('zkpyusdCommitments') || '[]');
        savedCommitments.push(commitmentInfo);
        localStorage.setItem('zkpyusdCommitments', JSON.stringify(savedCommitments));
        console.log("Saved commitment info to localStorage");

        // Get commitment from event logs
        console.log("Looking for deposit event in logs:", receipt.logs);
        
        // Handle different formats of logs
        if (receipt.logs && receipt.logs.length > 0) {
          // Try to find Deposit event directly
          const depositEvent = receipt.logs.find(
            (log: any) => log.eventName === 'Deposited' || log.fragment?.name === 'Deposited'
          );
          
          if (depositEvent) {
            console.log("Found deposit event:", depositEvent);
            // Handle different event args format
            const eventCommitment = depositEvent.args?.commitment || depositEvent.args?.[0];
            if (eventCommitment) {
              setLastCommitment(eventCommitment.toString());
              setSuccess(`Deposit successful! Save your secret: ${secret}`);
              console.log("Commitment confirmed from event:", eventCommitment.toString());
            } else {
              console.error("Commitment not found in event args:", depositEvent.args);
              // Even if we don't find the commitment in args, set the one we generated
              setLastCommitment(commitment);
              setSuccess(`Deposit successful! Save your secret: ${secret}`);
            }
          } else {
            // If we can't find the event, just use our generated commitment
            console.log("Could not find Deposited event, using generated commitment");
            setLastCommitment(commitment);
            setSuccess(`Deposit successful! Save your secret: ${secret}`);
          }
        } else {
          // Fallback to our generated commitment if no logs found
          console.log("No event logs found, using generated commitment");
          setLastCommitment(commitment);
          setSuccess(`Deposit successful! Save your secret: ${secret}`);
        }

        setAmount('')
        
        // Update balance
        await updateUserBalance(signerAddress)
        
      } catch (depositError: any) {
        console.error("Error during deposit call:", depositError);
        
        // Check for specific error messages
        const errorMessage = depositError.message || '';
        
        if (errorMessage.includes("status 0")) {
          setError("Transaction failed on-chain. The contract rejected your transaction. The privacy pool may be paused or your transaction doesn't meet contract requirements.");
        } else if (errorMessage.includes("execution reverted")) {
          setError("Smart contract rejected the transaction. This could be due to: 1) The pool is paused, 2) Contract funds limit reached, or 3) Your transaction doesn't meet internal requirements.");
        } else if (errorMessage.includes("user rejected")) {
          setError("Transaction was rejected in your wallet.");
        } else if (errorMessage.includes("gas required exceeds")) {
          setError("Transaction requires more gas than allowed. The contract may have complex logic that requires higher gas limits.");
        } else {
          setError(`Deposit failed: ${errorMessage}`);
        }
      }
      
    } catch (err: any) {
      console.error("Deposit error:", err);
      
      // Handle specific error cases
      if (err.message.includes("insufficient funds")) {
        setError("Insufficient ETH for gas fees.");
      } else if (err.message.includes("user rejected")) {
        setError("Transaction was rejected in your wallet.");
      } else {
        setError(err.message || 'Error making deposit. Please check console for details.');
      }
      
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    if (!withdrawCommitment) {
      setError('Please enter a commitment hash')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const poolContract = new ethers.Contract(
        CONFIG.POOL_ADDRESS,
        [
          'function withdraw(bytes32 commitment, address recipient) external',
          'function isSpent(bytes32 commitment) external view returns (bool)',
          'function getDepositTimestamp(bytes32 commitment) external view returns (uint256)'
        ],
        signer
      )

      // Check if commitment exists and isn't spent
      const isSpent = await poolContract.isSpent(withdrawCommitment)
      if (isSpent) {
        setError('This commitment has already been withdrawn')
        return
      }

      // Check timelock
      const timestamp = await poolContract.getDepositTimestamp(withdrawCommitment)
      const now = Math.floor(Date.now() / 1000)
      if (now - Number(timestamp) < CONFIG.TIMELOCK_SECONDS) {
        const minutesLeft = Math.ceil((CONFIG.TIMELOCK_SECONDS - (now - Number(timestamp))) / 60)
        setError(`Cannot withdraw yet. ${minutesLeft} minutes remaining`)
        return
      }

      setSuccess('Processing withdrawal...')
      const tx = await poolContract.withdraw(withdrawCommitment, await signer.getAddress())
      await tx.wait()

      setWithdrawCommitment('')
      setSuccess('Withdrawal successful!')
      
      // Fix: Get address and update balance with just the address
      const address = await signer.getAddress();
      await updateUserBalance(address)
      
    } catch (err: any) {
      setError(err.message || 'Error withdrawing funds')
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex justify-center w-full my-2">
        <div className="luxury-card animate-border-glow w-full max-w-lg p-8 md:p-10 shadow-2xl shadow-indigo-900/20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 flex items-center justify-center shadow-lg shadow-indigo-700/20">
                <svg className="w-10 h-10 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
            </div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-400 mb-4">Connect Your Wallet</h2>
              <p className="text-[#D4AF37]/70 px-6 text-lg">
                Sign in to access the PYUSD Privacy Pool with secure blockchain transactions
              </p>
            </div>
            
            <button
              onClick={connectWallet}
              className="luxury-button w-full max-w-sm mx-auto py-4 px-6 font-semibold text-center text-lg shadow-xl shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 transition-all duration-300 flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
              </svg>
              Connect Wallet
            </button>
            
            <div className="mt-8 text-[#D4AF37]/50 text-sm">
              <p>Please make sure you are using a Web3-enabled browser</p>
              <p className="mt-1">Supported networks: {NETWORK_DETAILS.chainName}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Network alert */}
      {currentNetwork !== NETWORK_DETAILS.chainName && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 mb-8 text-center mx-auto max-w-lg">
          <div className="flex items-center justify-center mb-2 space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <p className="text-amber-400 font-medium">Wrong Network Detected</p>
          </div>
          <button 
            onClick={switchNetwork}
            className="mt-2 px-6 py-2 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            Switch to {NETWORK_DETAILS.chainName}
          </button>
        </div>
      )}

      {/* Main interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
        {/* Deposit Section */}
        <div className="luxury-card animate-border-glow h-full shadow-xl shadow-indigo-900/10">
          <div className="p-7 md:p-9 h-full">
            <div className="mb-7">
              <h2 className="text-2xl md:text-3xl font-bold text-[#D4AF37] mb-3">Deposit PYUSD</h2>
              <p className="text-[#D4AF37]/60 text-sm">
                Securely deposit your PYUSD into the privacy pool
              </p>
            </div>
            
            <div className="gold-divider mb-7"></div>
            
            {/* Balance Display */}
            <div className="mb-7 p-5 bg-[#D4AF37]/5 rounded-lg border border-[#D4AF37]/10 backdrop-blur-sm">
              <div className="text-[#D4AF37]/70 text-xs uppercase tracking-wider mb-2 font-semibold">Available Balance</div>
              <div className="text-lg font-mono text-white flex items-baseline">
                <span className="text-3xl font-semibold mr-2">{parseFloat(userBalance).toFixed(6)}</span>
                <span className="text-[#D4AF37] font-medium">PYUSD</span>
              </div>
            </div>
            
            {/* Amount Input */}
            <div className="mb-8">
              <label className="block text-[#D4AF37]/80 text-sm mb-2 font-medium">
                Amount to Deposit
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="elegant-input text-lg"
              />
            </div>
            
            {/* Deposit Button */}
            <button
              onClick={handleDeposit}
              disabled={loading}
              className="luxury-button w-full py-4 font-semibold text-lg shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="loading-spinner w-5 h-5"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Deposit PYUSD'
              )}
            </button>
          </div>
        </div>
        
        {/* Withdraw Section */}
        <div className="luxury-card animate-border-glow h-full shadow-xl shadow-indigo-900/10">
          <div className="p-7 md:p-9 h-full">
            <div className="mb-7">
              <h2 className="text-2xl md:text-3xl font-bold text-[#D4AF37] mb-3">Withdraw PYUSD</h2>
              <p className="text-[#D4AF37]/60 text-sm">
                Withdraw your PYUSD from the privacy pool
              </p>
            </div>
            
            <div className="gold-divider mb-7"></div>
            
            {/* Commitment Hash Input */}
            <div className="mb-8">
              <label className="block text-[#D4AF37]/80 text-sm mb-2 font-medium">
                Commitment Hash
              </label>
              <input
                type="text"
                value={withdrawCommitment}
                onChange={(e) => setWithdrawCommitment(e.target.value)}
                placeholder="Enter your commitment hash"
                className="elegant-input font-mono text-sm"
              />
              <p className="mt-2 text-[#D4AF37]/50 text-xs">
                Enter the commitment hash you received when you made your deposit
              </p>
            </div>
            
            {/* Withdraw Button */}
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="luxury-button w-full py-4 font-semibold text-lg shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 transition-all duration-300 mt-auto"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="loading-spinner w-5 h-5"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Withdraw PYUSD'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {(error || success) && (
        <div className="mt-10 max-w-2xl mx-auto">
          {error && (
            <div className="status-error backdrop-blur-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="status-success backdrop-blur-sm">
              {success}
            </div>
          )}
        </div>
      )}

      {/* Last Commitment Hash */}
      {lastCommitment && (
        <div className="luxury-card mt-10 p-7 max-w-2xl mx-auto animate-border-glow shadow-xl shadow-indigo-900/10">
          <div className="flex justify-between items-center mb-5">
            <div className="text-[#D4AF37] text-xl font-bold">Your Commitment Hash</div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(lastCommitment);
                setSuccess("Commitment hash copied to clipboard!");
                setTimeout(() => {
                  if (success && success.includes("copied to clipboard")) {
                    setSuccess("");
                  }
                }, 3000);
              }}
              className="px-4 py-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 rounded text-[#D4AF37] text-sm transition-all font-medium"
            >
              Copy
            </button>
          </div>
          <div className="p-4 bg-[#D4AF37]/5 rounded-lg border border-[#D4AF37]/20 backdrop-blur-sm">
            <p className="font-mono text-sm break-all text-white">{lastCommitment}</p>
          </div>
          <div className="mt-5 text-[#D4AF37]/70 text-sm bg-[#D4AF37]/10 p-4 rounded-lg border border-[#D4AF37]/20 backdrop-blur-sm">
            <strong className="text-[#D4AF37]">IMPORTANT:</strong> Save this commitment hash! You will need it to withdraw your funds. Without it, your funds will be permanently locked.
          </div>
        </div>
      )}

      <div className="mt-10 px-8 py-8 rounded-xl border-2 border-indigo-700/30 bg-gradient-to-br from-indigo-900/30 to-purple-900/40 backdrop-blur-sm shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-300 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-400 animate-pulse">Advanced Withdraw</h2>
        <p className="text-gray-300 mb-6 text-lg">Withdraw PYUSD from the privacy pool using saved commitments</p>
        
        {!isConnected ? (
          <div className="text-center">
            <button 
              onClick={connectWallet} 
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              Connect Wallet to Withdraw
            </button>
          </div>
        ) : (
          <div>
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
                Select a Commitment
              </h3>
              <select
                className="w-full p-4 bg-gray-800/80 border border-indigo-700/50 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg shadow-indigo-900/20"
                onChange={(e) => {
                  try {
                    if (e.target.value) {
                      const savedCommitments = JSON.parse(localStorage.getItem('zkpyusdCommitments') || '[]');
                      const selected = savedCommitments.find((c: any) => c.commitment === e.target.value);
                      if (selected) {
                        // Ensure all required properties exist
                        const safeSelected = {
                          commitment: selected.commitment,
                          secret: selected.secret,
                          timestamp: selected.timestamp,
                          amount: selected.amount || "0" // Default to "0" if amount is missing
                        };
                        setSelectedCommitment(safeSelected);
                      } else {
                        setSelectedCommitment(null);
                      }
                    } else {
                      setSelectedCommitment(null);
                    }
                  } catch (error) {
                    console.error("Error selecting commitment:", error);
                    setSelectedCommitment(null);
                  }
                }}
                defaultValue=""
              >
                <option value="">Select a commitment</option>
                {(() => {
                  try {
                    const savedCommitments = JSON.parse(localStorage.getItem('zkpyusdCommitments') || '[]');
                    return savedCommitments.map((c: any, i: number) => (
                      <option key={i} value={c.commitment}>
                        {c.amount} PYUSD - {new Date(c.timestamp * 1000).toLocaleString()}
                      </option>
                    ));
                  } catch (error) {
                    console.error("Error loading commitments:", error);
                    return null;
                  }
                })()}
              </select>
            </div>
            
            <div className="mt-6">
              <label htmlFor="recipient" className="block text-base font-medium text-indigo-300 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                Recipient Address
              </label>
              <input
                type="text"
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-indigo-700/50 bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-inner shadow-indigo-900/30"
              />
            </div>
            
            {selectedCommitment && (
              <div className="mt-6 p-5 rounded-lg bg-indigo-900/40 border border-indigo-700/50 shadow-lg shadow-indigo-900/10">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center">
                    <div className="text-sm text-indigo-300 w-20">Amount:</div>
                    <div className="text-white font-medium">{selectedCommitment.amount} PYUSD</div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm text-indigo-300 w-20">Date:</div>
                    <div className="text-white font-medium">{new Date(selectedCommitment.timestamp * 1000).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-sm text-indigo-300 mb-1">Secret:</div>
                    <div className="p-2 bg-black/30 rounded border border-indigo-700/30">
                      <span className="text-indigo-300 font-mono text-sm break-all">{selectedCommitment.secret}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={async () => {
                if (isProcessing) return;
                setIsProcessing(true);
                setErrorMessage('');
                setLastActionStatus('');

                try {
                  if (!selectedCommitment) {
                    throw new Error("Please select a commitment to withdraw");
                  }
                  
                  if (!provider) {
                    throw new Error("Please connect your wallet");
                  }

                  // Generate the nullifier hash from the secret
                  const nullifierHash = BigInt("0x" + ethers.keccak256(ethers.toUtf8Bytes(selectedCommitment.secret))).toString();
                  
                  // Submit the withdrawal
                  const signer = await provider.getSigner();
                  const poolContract = new ethers.Contract(CONFIG.POOL_ADDRESS, PYUSD_ABI, signer);
                  
                  // Call withdraw function with higher gas limit
                  const tx = await poolContract.withdraw(
                    selectedCommitment.commitment,
                    nullifierHash,
                    selectedCommitment.secret,
                    recipient || await signer.getAddress(), // Use signer address if recipient is empty
                    selectedCommitment.timestamp,
                    { gasLimit: 500000 }
                  );
                  
                  console.log("Withdrawal transaction sent:", tx.hash);
                  setLastActionStatus('Withdrawal transaction sent! Waiting for confirmation...');
                  
                  const receipt = await tx.wait();
                  console.log("Withdrawal complete, receipt:", receipt);
                  
                  if (receipt.status === 0) {
                    throw new Error("Transaction failed on the blockchain.");
                  }
                  
                  // Remove the used commitment from localStorage
                  const savedCommitments = JSON.parse(localStorage.getItem('zkpyusdCommitments') || '[]');
                  const updatedCommitments = savedCommitments.filter(
                    (c: any) => c.commitment !== selectedCommitment.commitment
                  );
                  localStorage.setItem('zkpyusdCommitments', JSON.stringify(updatedCommitments));
                  
                  setLastActionStatus(`Withdrawal successful! PYUSD sent to ${recipient || await signer.getAddress()}`);
                  setSelectedCommitment(null);
                  setRecipient('');
                  
                  // Update balance
                  const signerAddress = await signer.getAddress();
                  await updateUserBalance(signerAddress);
                  
                } catch (error: any) {
                  console.error("Withdrawal error:", error);
                  setErrorMessage(`Withdrawal failed: ${error.message}`);
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing || !isConnected || !selectedCommitment || !recipient}
              className={`w-full mt-6 px-6 py-4 rounded-lg font-medium transition-all duration-300 text-lg ${
                isProcessing || !isConnected || !selectedCommitment || !recipient
                  ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/50' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Processing Withdrawal...
                </div>
              ) : (
                'Withdraw PYUSD'
              )}
            </button>
            
            {/* Status Messages */}
            {(errorMessage || lastActionStatus) && (
              <div className="mt-6">
                {errorMessage && (
                  <div className="p-4 bg-red-900/30 border border-red-700/40 rounded-lg text-red-300">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                      <span>{errorMessage}</span>
                    </div>
                  </div>
                )}
                {lastActionStatus && (
                  <div className="p-4 bg-green-900/30 border border-green-700/40 rounded-lg text-green-300">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      <span>{lastActionStatus}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 