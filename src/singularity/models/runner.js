/** @param {NS} ns **/

export class Runner {
    stopRunnerOperationName = 'control_runner_stop';

    constructor(ns, listeningPort) {
        this.ns = ns
        this.listeningPort = listeningPort
        this.operations = []
        this.interval = 1000;
        this.online = false;
        this.busy = false;
        this.resetLoopCount();
        this.resetOperationCount();
    }

    incrementLoopCount = function() { this.loopCount += 1; }
    incrementOperationCount = function() { this.operationCount += 1; }
    resetLoopCount = function() { this.loopCount = 0; }
    resetOperationCount = function() { this.operationCount = 0; }
    pickNextOperation = function() { return this.operations.sort((a, b) => a.createdAt > b.createdAt ? 1 : -1).pop(); }

    async start() {
        this.online = true;
        await this.programLoop();
    }

    stop() {
        this.cleanup();
        this.busy = false;
        this.online = false;
    }

    cleanup() {
        // cleanup routine
        // probably push remaining operations back to source and say sorry (possibly unnecessary)
        return false
    }

    insertOperation(operation) {
        this.operations.push(operation);
    }

    async programLoop() {
        while (this.online) {
            await this.processOperation();
            await this.ns.sleep(this.interval)
        }
        this.resetLoopCount();
    }

    async processSynchronousOperation(operation) {
        // todo
        return false
    }

    processAsynchronousOperation(operation) {
        // todo
        return false
    }

    async processOperation() {
        if (this.operations.length > 0) {
            this.busy = true;
            this.incrementLoopCount();
            this.incrementOperationCount();
            let operation = this.pickNextOperation();
            if (operation.name == this.stopRunnerOperationName) {
                this.stop();
                return false;
            } else if (operation.blocking) {
                await this.processSynchronousOperation(operation);
            } else {
                this.processAsynchronousOperation(operation);
            }
            this.busy = false;
        }
    }
}
