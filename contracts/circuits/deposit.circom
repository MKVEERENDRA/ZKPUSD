pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template DepositCircuit() {
    // Public inputs
    signal input amount;
    signal input timestamp;
    
    // Private inputs
    signal input secret;
    
    // Output
    signal output commitment;
    
    // Generate commitment using Poseidon hash
    component hasher = Poseidon(3);
    hasher.inputs[0] <== amount;
    hasher.inputs[1] <== secret;
    hasher.inputs[2] <== timestamp;
    
    commitment <== hasher.out;
}

component main = DepositCircuit();