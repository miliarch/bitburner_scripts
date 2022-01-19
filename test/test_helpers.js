export class ns {
    static sleep = async function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static toast = function(...args) { console.log('ns.toast: ', ...args) };
    static tprint = function(...args) { console.log('ns.tprint: ', ...args) };
    static print = function(...args) { console.log('ns.print: ', ...args) };
}
