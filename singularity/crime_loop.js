/** @param {NS} ns **/
export async function main(ns) {
    const crimeName = ns.args[0] ? ns.args[0] : 'Homicide';
    const interval = 1000;
    var crimeTime = interval;
    while (true) {
        ns.tail();
        if (!ns.isBusy()) {
            crimeTime = ns.commitCrime(crimeName);
            if (!crimeTime || typeof(crimeTime) != "number") {
                crimeTime = interval;
            }
        }
        await ns.sleep(crimeTime);
    }
}