pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

template WithdrawCircuit() {
    // Public inputs
    signal input currentTimestamp;
    signal input commitment;
    
    // Private inputs
    signal input amount;
    signal input secret;
    signal input depositTimestamp;
    
    // Constants
    var TWO_HOURS = 7200; // 2 hours in seconds
    
    // Verify the commitment
    component hasher = Poseidon(3);
    hasher.inputs[0] <== amount;
    hasher.inputs[1] <== secret;
    hasher.inputs[2] <== depositTimestamp;
    
    // Check if commitment matches
    commitment === hasher.out;
    
    // Verify time window (within 2 hours)
    component timeCheck = LessThan(252);
    signal timeDiff <== currentTimestamp - depositTimestamp;
    timeCheck.in[0] <== timeDiff;
    timeCheck.in[1] <== TWO_HOURS;
    timeCheck.out === 1;
}

component main = WithdrawCircuit(); 