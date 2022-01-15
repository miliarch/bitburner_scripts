/** @param {NS} ns **/
// very much a work in progress
import {findHostsRecursive} from 'common/lib.js';
export async function main(ns) {
    var hostContractMap = {}
    var excludeHosts = ['home'].concat(ns.getPurchasedServers);
    for (var host of findHostsRecursive(ns, 'home', 30, excludeHosts)) {
        let contracts = ns.ls(host, 'contract')
        if (contracts.length > 0) {
            hostContractMap[host] = contracts
        }
    }
    var out_str = '\n'
    for (const [host, contracts] of Object.entries(hostContractMap)) {    
        //ns.codingcontract.attempt(answer, filename, host, opts)
        out_str = `\n${host}:\n`
        for (const filename of contracts) {
            let type = ns.codingcontract.getContractType(filename, host);
            let data = ns.codingcontract.getData(filename, host);
            let description = ns.codingcontract.getDescription(filename, host);
            let triesRemaining = ns.codingcontract.getNumTriesRemaining(filename, host);
            out_str += `\tfilename: ${filename}, type: ${type}, tries remaining: ${triesRemaining}`;
            if (type == 'Minimum Path Sum in a Triangle') {
                var answer = minPathSumInTriangle(data);
                var result = ns.codingcontract.attempt(answer, filename, host, true);
                out_str += `\n\tAttempted result: ${result} (${answer})`;
                ns.tprint(`${out_str}\n\t`, data);
            } else if (type == 'Generate IP Addresses') {
                var answer = generateIPAddresses(data);
                var result = ns.codingcontract.attempt(answer, filename, host, true);
                out_str += `\n\tAttempted result: ${result} (${answer})`;
                ns.tprint(`${out_str}\n\t`, data);
            } else {
                ns.tprint(`${out_str}\n\t`, data);
            }
        }
    }
}

function minPathSumInTriangle(data=[[9],[5,9],[4,4,1]]) {
    var testAnswer = 18  // 9 + 5 + 4
    var sum = data[0][0];  // tip starts sum
    var lastIndex = 0;
    for (var i = 1; i < data.length; i++) {
        var cell = data[i].slice(lastIndex, lastIndex + 2);
        var addend = Math.min(cell[0], cell[1]);
        lastIndex = cell.indexOf(addend);
        sum += addend
    }
    return parseInt(sum);
}

function generateIPAddresses(data='1291031519') {
    // shamelessly taken from https://github.com/danielyxie/bitburner/blob/aad4024e0f4c330e14f4f16b4071152e6f89de04/src/data/codingcontracttypes.ts#L402
    var ips = []
    for (let a = 1; a <= 3; ++a) {
        for (let b = 1; b <= 3; ++b) {
            for (let c = 1; c <= 3; ++c) {
                for (let d = 1; d <= 3; ++d) {
                    let octetA = parseInt(data.substring(0, a), 10);
                    let octetB = parseInt(data.substring(a, a + b), 10);
                    let octetC = parseInt(data.substring(a + b, a + b + c), 10);
                    let octetD = parseInt(data.substring(a + b + c, a + b + c + d), 10);
                    if (octetA <= 255 && octetB <= 255 && octetC <= 255 && octetD <= 255) {
                        let ip = [octetA.toString(), octetB.toString(), octetC.toString(), octetD.toString()].join('.');
                        if (ip.length == data.length + 3) {
                            ips.push(ip);
                        }
                    }
                }
            }
        }
    }
    return [...new Set(ips)];
}
