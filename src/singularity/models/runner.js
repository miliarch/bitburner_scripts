/** @param {NS} ns **/

export class Runner {
    constructor(ns, operations=[]) {
        this.ns = ns
        this.operations = operations
        this.interval = 1000;
        this.online = true;
    }

    start() {
        this.operationLoop();
    }

    stop() {
        this.online = false
    }

    operationLoop() {
        this.online = true;
        while (this.online) {
            if (this.operations.length > 0) {
                this.busy = true;
                // TODO: Process operations
            } else {
                this.busy = false;
            }
            await this.ns.sleep(this.interval)
        }
    }
}
