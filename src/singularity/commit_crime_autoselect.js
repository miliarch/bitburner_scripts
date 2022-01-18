/** @param {NS} ns **/
// Function library for cross-script use
import { writeMessageToPort } from '/common/lib.js';
import { getCrimes, calcSecondsPerKarma } from '/singularity/lib.js'

export async function main(ns) {
    let portNum = ns.args[0] ? ns.args[0] : 0;
    let operationTag = ns.args[1] ? ns.args[1] : '';
    let broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;

    let crimes = getCrimes(ns);
    let crimeName = crimes.sort(function(a, b) {
        // sort by fastest karma gain divided by success chance
        let secondsPerKarmaA = calcSecondsPerKarma(a) / a.chance;
        let secondsPerKarmaB = calcSecondsPerKarma(b) / b.chance;
        if (secondsPerKarmaA < secondsPerKarmaB) {
            return -1;
        }
        if (secondsPerKarmaA > secondsPerKarmaB) {
            return 1;
        }
    }).shift().name;
    
    let result = ns.commitCrime(crimeName);
    if (broadcastPort) {
        var message = {
            'operation': 'commit_crime_autoselect',
            'result': [true, crimeName],
            'duration': result,
            'tag': operationTag
        };
        await writeMessageToPort(ns, broadcastPort, message);
    }
}
