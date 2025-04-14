// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PYUSD is ERC20, Ownable {
    constructor() ERC20("PayPal USD", "PYUSD") Ownable(msg.sender) {}

    // Function to mint new tokens (only owner can call this)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Function for testing - anyone can mint (only for testnet!)
    function testMint(uint256 amount) public {
        _mint(msg.sender, amount);
    }

    // Optional: Add decimals override if you want to match PYUSD's 6 decimals
    function decimals() public pure override returns (uint8) {
        return 6;
    }
} 