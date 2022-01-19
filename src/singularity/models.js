/** @param {NS} ns **/
// Singularity models

import { ns } from "../../test/test_helpers";

export class Operation {
    constructor(ns, name, scriptName, port, blocking=true, prependArgs=[], appendArgs=[]) {
        // required
        this.name = name;
        this.scriptName = scriptName;
        this.port = port;

        // optional w/ defaults
        this.blocking = blocking;
        this.prependArgs = prependArgs;
        this.appendArgs = appendArgs;

        // autogen
        this.tag = this.generateTag();
        this.createdAt = this.getTime();

        // deferred
        this.result = null;
        this.startedAt = null;
        this.endedAt = null;
        this.nextAt = null;
        this.status = 'new';
    }

    generateTag() {
        /* Generate pseudo-random string - used to identify messages
        source: https://www.codegrepper.com/code-examples/javascript/how+to+generate+random+id+in+javascript
        */
       return '_' + Math.random().toString(36).substr(2, 9);
    }

    getTime(duration=0) {
        // return current time plus any given duration
        return Date.now() + duration;
    }

    start() {
        // record current time as start time and update related properties
        let time = this.getTime();
        this.startedAt = time;
        this.status = 'in progress';
        return time;
    }

    end() {
        // record current time as end time and update related properties
        let time = this.getTime();
        this.endedAt = time;
        this.status = 'complete';
        return time;
    }

    next(duration) {
        // record current time plus duration as next estimated operation time
        let time = this.getTime(duration);
        this.nextAt = time;
        return time;
    }
}

export class Runner {
    constructor(ns, operations=[]) {
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
            await ns.sleep(this.interval)
        }
    }
}

