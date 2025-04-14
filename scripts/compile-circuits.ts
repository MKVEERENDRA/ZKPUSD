import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const circuitPath = path.join(__dirname, "..", "contracts", "circuits", "withdraw.circom")
  const buildDir = path.join(__dirname, "..", "build", "circuits")

  try {
    // Create build directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, "..", "build"))) {
      fs.mkdirSync(path.join(__dirname, "..", "build"))
    }
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir)
    }

    console.log("Compiling withdraw.circom...")
    
    // Compile the circuit
    execSync(`circom ${circuitPath} --r1cs --wasm --sym -o ${buildDir}`, { stdio: 'inherit' })

    console.log("Circuit compilation completed successfully!")
  } catch (error) {
    console.error("Error during circuit compilation:", error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}) 