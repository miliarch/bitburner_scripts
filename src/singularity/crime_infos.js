/** @param {NS} ns **/
export async function main(ns) {
    ns.tail()
    const crimeNames = [
        'Shoplift',
        'Rob store',
        'Mug someone',
        'Larceny',
        'Deal Drugs',
        'Bond Forgery',
        'Traffick illegal Arms',
        'Homicide',
        'Grand theft Auto',
        'Kidnap and Ransom',
        'Assassinate',
        'Heist'
    ]
    var crimes = []
    // build crime object
    for (let name of crimeNames) {
        var crime = {}
        crime['name'] = name;
        crime['chance'] = ns.getCrimeChance(name);
        crime['stats'] = ns.getCrimeStats(name);
        crimes.push(crime);
    }
    // verbose crime stats
    for (let crime of crimes) {
        var out_str = `${crime.name} (${crime.chance}): `;
        ns.print(out_str, crime.stats);
    }
    // raw money per second detail
    for (let crime of crimes) {
        var out_str = `${crime.name}: \$${ns.nFormat(crime.stats.money / (crime.stats.time / 1000), '0.00a')}/s`;
        ns.print(out_str);
    }
}