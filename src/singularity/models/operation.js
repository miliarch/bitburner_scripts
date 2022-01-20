/** @param {NS} ns **/

export class Operation {
    constructor(ns, name, scriptName, sourcePort, destinationPort,
                blocking=true, prependArgs=[], appendArgs=[]) {
        // required
        this.name = name;
        this.scriptName = scriptName;
        this.sourcePort = sourcePort;
        this.destinationPort = destinationPort;

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

    isValid() {
        // a lazy check that all required properties are non-null
        let properties = [
            this.tag,
            this.createdAt,
            this.name,
            this.scriptName,
            this.sourcePort,
            this.destinationPort,
            this.status,
        ]
        for (let property of properties) {
            if (!property) {
                return false;
            }
        }
        return true;
    }
}
