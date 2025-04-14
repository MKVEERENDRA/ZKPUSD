// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./Groth16Verifier.sol";

contract ZKPYUSDPool is ReentrancyGuard {
    IERC20 public immutable pyusd;
    Groth16Verifier public immutable verifier;
    
    // Merkle tree root for deposit commitments
    bytes32 public merkleRoot;
    
    // Mapping to track used commitments (prevent double-spending)
    mapping(bytes32 => bool) public usedCommitments;
    
    // Pool statistics
    uint256 public totalDeposits;
    uint256 public activeDeposits;
    uint256 public totalVolume;
    
    // Events
    event Deposited(bytes32 indexed commitment, uint256 amount, uint256 timestamp);
    event Withdrawn(bytes32 indexed commitment, uint256 amount, address recipient);
    
    constructor(address _pyusd, address _verifier) {
        require(_pyusd != address(0), "Invalid PYUSD address");
        require(_verifier != address(0), "Invalid Verifier address");
        pyusd = IERC20(_pyusd);
        verifier = Groth16Verifier(_verifier);
    }
    
    /**
     * @dev Deposits PYUSD into the pool and adds commitment to Merkle tree
     * @param commitment The hash commitment of amount, secret, and timestamp
     * @param amount The amount of PYUSD to deposit
     */
    function deposit(bytes32 commitment, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(!usedCommitments[commitment], "Commitment already used");
        
        // Transfer PYUSD from user
        require(pyusd.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update Merkle tree (implementation needed)
        _updateMerkleTree(commitment);
        
        // Update statistics
        totalDeposits++;
        activeDeposits++;
        totalVolume += amount;
        
        emit Deposited(commitment, amount, block.timestamp);
    }
    
    /**
     * @dev Withdraws PYUSD using a zero-knowledge proof
     * @param proof The zero-knowledge proof
     * @param commitment The original deposit commitment
     * @param amount The amount to withdraw
     */
    function withdraw(
        bytes calldata proof,
        bytes32 commitment,
        uint256 amount
    ) external nonReentrant {
        require(!usedCommitments[commitment], "Commitment already used");
        require(_verifyProof(proof, commitment, amount), "Invalid proof");
        
        // Mark commitment as used
        usedCommitments[commitment] = true;
        
        // Transfer PYUSD to recipient
        require(pyusd.transfer(msg.sender, amount), "Transfer failed");
        
        // Update statistics
        activeDeposits--;
        
        emit Withdrawn(commitment, amount, msg.sender);
    }
    
    /**
     * @dev Updates the Merkle tree with a new commitment
     * @param commitment The new commitment to add
     */
    function _updateMerkleTree(bytes32 commitment) internal {
        // TODO: Implement Merkle tree update logic
        // This will be implemented in a separate library
    }
    
    /**
     * @dev Verifies the zero-knowledge proof
     * @param proof The proof to verify
     * @param commitment The commitment being proven
     * @param amount The amount being withdrawn
     */
    function _verifyProof(
        bytes calldata proof,
        bytes32 commitment,
        uint256 amount
    ) internal view returns (bool) {
        // Decode the proof into its components
        (uint[2] memory a, uint[2][2] memory b, uint[2] memory c) = abi.decode(proof, (uint[2], uint[2][2], uint[2]));
        
        // Verify the proof using the Groth16Verifier
        return verifier.verifyProof(a, b, c);
    }
}
 