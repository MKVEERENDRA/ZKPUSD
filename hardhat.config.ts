import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    holesky: {
      url:"https://blockchain.googleapis.com/v1/projects/eternal-insight-454209-c0/locations/asia-east1/endpoints/ethereum-holesky/rpc?key=AIzaSyCfk2WrM1miNMxwNdlUB2_NzzO2XoYBA-Q" ,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config; 