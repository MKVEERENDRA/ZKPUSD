pragma circom 2.0.0;

include "./lib/poseidon.circom";

template Withdraw() {
    // Public inputs
    signal input commitment;
    signal input nullifier;
    signal input recipient;
    signal input timestamp;

    // Private inputs
    signal input secret;

    // Compute commitment hash
    component commitmentHash = Poseidon(2);
    commitmentHash.inputs[0] <== nullifier;
    commitmentHash.inputs[1] <== secret;

    // Verify commitment matches
    commitmentHash.out <== commitment;
}

component main = Withdraw(); 