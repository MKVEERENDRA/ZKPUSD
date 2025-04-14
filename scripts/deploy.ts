import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("1. Deploying PYUSD token...");
  const PYUSD = await ethers.getContractFactory("PYUSD");
  const pyusd = await PYUSD.deploy();
  await pyusd.waitForDeployment();
  const pyusdAddress = await pyusd.getAddress();
  console.log(`PYUSD deployed to: ${pyusdAddress}`);

  console.log("\n2. Deploying Groth16Verifier...");
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`Groth16Verifier deployed to: ${verifierAddress}`);

  console.log("\n3. Deploying ZKPYUSDPool...");
  const ZKPYUSDPool = await ethers.getContractFactory("ZKPYUSDPool");
  const pool = await ZKPYUSDPool.deploy(pyusdAddress, verifierAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log(`ZKPYUSDPool deployed to: ${poolAddress}`);

  // For testing: Mint some tokens to the deployer
  console.log("\n4. Minting test tokens...");
  const [deployer] = await ethers.getSigners();
  const mintAmount = ethers.parseUnits("1000000", 6); // 1 million PYUSD (6 decimals)
  await pyusd.testMint(mintAmount);
  console.log(`Minted ${ethers.formatUnits(mintAmount, 6)} PYUSD to ${deployer.address}`);

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`PYUSD: ${pyusdAddress}`);
  console.log(`Groth16Verifier: ${verifierAddress}`);
  console.log(`ZKPYUSDPool: ${poolAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 