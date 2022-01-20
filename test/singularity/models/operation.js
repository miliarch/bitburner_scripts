import { Operation } from '../../../src/singularity/models/operation.js';
import { ns } from '../../test_helpers.js'

// test vars
let operation_name = 'test_operation';
let operation_scriptName = '/some/script.js';
let operation_sourcePort = 1;
let operation_destinationPort = 2;
let blocking = false;
let prependArgs = ['just', 'some', 'args'];
let appendArgs = ['some', 'more', 'args'];
console.assert(operation_name == 'test_operation', 'operation_name', operation_name);
console.assert(operation_scriptName == '/some/script.js', 'operation_scriptName', operation_scriptName);
console.assert(operation_sourcePort == 1, 'operation_sourcePort', operation_sourcePort);
console.assert(operation_sourcePort == 1, 'operation_sourcePort', operation_sourcePort);
console.assert(operation_sourcePort == 1, 'operation_sourcePort', operation_sourcePort);
console.assert(operation_destinationPort == 2, 'operation_destinationPort', operation_destinationPort);
console.assert(blocking == false, 'blocking', blocking);
console.assert(prependArgs[0] == 'just' && prependArgs[1] == 'some' && prependArgs[2] == 'args', 'prependArgs', prependArgs);
console.assert(appendArgs[0] == 'some' && appendArgs[1] == 'more' && appendArgs[2] == 'args', 'appendArgs', appendArgs);

// test default instantiation
var time;
time = Date.now()
let defaultOperation = new Operation(ns, operation_name, operation_scriptName, operation_sourcePort, operation_destinationPort);
console.assert(defaultOperation.tag, 'defaultOperation.tag exists');
console.assert(typeof(defaultOperation.tag) == 'string', 'defaultOperation.tag is string', defaultOperation.tag, typeof(defaultOperation.tag));
console.assert(defaultOperation.tag.startsWith('_') && defaultOperation.tag.length == 10, 'defaultOperation.tag matches expectations', defaultOperation.tag);
console.assert(defaultOperation.createdAt, 'defaultOperation.createdAt exists');
console.assert(typeof(defaultOperation.createdAt) == 'number', 'defaultOperation.createdAt is number', defaultOperation.createdAt, typeof(defaultOperation.createdAt));
console.assert(time - defaultOperation.createdAt < 100, 'defaultOperation.createdAt is unix timestamp', defaultOperation.createdAt);
console.assert(defaultOperation.result == null, 'defaultOperation.result is null', defaultOperation.result);
console.assert(defaultOperation.startedAt == null, 'defaultOperation.startedAt is null', defaultOperation.startedAt);
console.assert(defaultOperation.endedAt == null, 'defaultOperation.endedAt is null', defaultOperation.endedAt);
console.assert(defaultOperation.nextAt == null, 'defaultOperation.nextAt is null', defaultOperation.nextAt);
console.assert(defaultOperation.status, 'defaultOperation.status exists');
console.assert(typeof(defaultOperation.status) == 'string', 'defaultOperation.status is string', defaultOperation.status, typeof(defaultOperation.status))
console.assert(defaultOperation.status == 'new', 'defaultOperation.status matches', defaultOperation.status);

// test minimum input
let minimumInputOperation = new Operation(ns, operation_name, operation_scriptName, operation_sourcePort, operation_destinationPort);
console.assert(minimumInputOperation.name, 'minimumInputOperation.name exists');
console.assert(typeof(minimumInputOperation.name == 'string'), 'minimumInputOperation.name is string', minimumInputOperation.name, typeof(minimumInputOperation.name));
console.assert(minimumInputOperation.name == operation_name, 'minimumInputOperation.name matches', minimumInputOperation.name);
console.assert(minimumInputOperation.scriptName, 'minimumInputOperation.scriptName exists');
console.assert(typeof(minimumInputOperation.scriptName == 'string'), 'minimumInputOperation.scriptName is string', minimumInputOperation.scriptName, typeof(minimumInputOperation.scriptName));
console.assert(minimumInputOperation.scriptName == operation_scriptName, 'minimumInputOperation.scriptName matches', minimumInputOperation.scriptName);
console.assert(minimumInputOperation.sourcePort, 'minimumInputOperation.sourcePort exists');
console.assert(typeof(minimumInputOperation.sourcePort == 'number'), 'minimumInputOperation.sourcePort is number', minimumInputOperation.sourcePort, typeof(minimumInputOperation.sourcePort));
console.assert(minimumInputOperation.sourcePort == operation_sourcePort, 'minimumInputOperation.sourcePort matches', minimumInputOperation.sourcePort);
console.assert(minimumInputOperation.destinationPort, 'minimumInputOperation.destinationPort exists');
console.assert(typeof(minimumInputOperation.destinationPort == 'number'), 'minimumInputOperation.destinationPort is number', minimumInputOperation.destinationPort, typeof(minimumInputOperation.destinationPort));
console.assert(minimumInputOperation.destinationPort == operation_destinationPort, 'minimumInputOperation.destinationPort matches', minimumInputOperation.destinationPort);

// test optional input
let optionalInputOperation = new Operation(ns, operation_name, operation_scriptName, operation_sourcePort, operation_destinationPort, blocking, prependArgs, appendArgs);
console.assert(optionalInputOperation.blocking == false, 'optionalInputOperation.blocking is false');
console.assert(optionalInputOperation.prependArgs, 'optionalInputOperation.prependArgs exists');
console.assert(typeof(optionalInputOperation.prependArgs == 'object'), 'optionalInputOperation.prependArgs is object', optionalInputOperation.prependArgs, typeof(optionalInputOperation.prependArgs));
console.assert(optionalInputOperation.prependArgs.constructor === Array, 'optionalInputOperation.prependArgs is Array', optionalInputOperation.prependArgs, typeof(optionalInputOperation.prependArgs));
console.assert(optionalInputOperation.prependArgs[0] == prependArgs[0] && optionalInputOperation.prependArgs[1] == prependArgs[1] && optionalInputOperation.prependArgs[2] == prependArgs[2], 'optionalInputOperation.appendArgs values match', optionalInputOperation.prependArgs);
console.assert(optionalInputOperation.appendArgs, 'optionalInputOperation.appendArgs exists');
console.assert(typeof(optionalInputOperation.appendArgs == 'object'), 'optionalInputOperation.appendArgs is object', optionalInputOperation.appendArgs, typeof(optionalInputOperation.appendArgs));
console.assert(optionalInputOperation.appendArgs.constructor === Array, 'optionalInputOperation.appendArgs is Array', optionalInputOperation.appendArgs, typeof(optionalInputOperation.appendArgs));
console.assert(optionalInputOperation.appendArgs[0] == appendArgs[0] && optionalInputOperation.appendArgs[1] == appendArgs[1] && optionalInputOperation.appendArgs[2] == appendArgs[2], 'optionalInputOperation.appendArgs values match', optionalInputOperation.appendArgs);

// test date methods
let dateMethodsOperation = new Operation(ns, operation_name, operation_scriptName, operation_sourcePort, operation_destinationPort);
let delay = 30000

time = Date.now();
dateMethodsOperation.start();
console.assert(dateMethodsOperation.startedAt, 'dateMethodsOperation.startedAt exists');
console.assert(typeof(dateMethodsOperation.startedAt) == 'number', 'dateMethodsOperation.startedAt is number', dateMethodsOperation.startedAt, typeof(dateMethodsOperation.startedAt));
console.assert(time - dateMethodsOperation.startedAt < 100, 'dateMethodsOperation.startedAt is unix timestamp', dateMethodsOperation.startedAt, time);
console.assert(dateMethodsOperation.status, 'dateMethodsOperation.status exists');
console.assert(typeof(dateMethodsOperation.status == 'string'), 'dateMethodsOperation.status is string', dateMethodsOperation.status, typeof(dateMethodsOperation.status));
console.assert(dateMethodsOperation.status == 'in progress', 'dateMethodsOperation.status matches', dateMethodsOperation.status);

time = Date.now();
dateMethodsOperation.end();
console.assert(dateMethodsOperation.endedAt, 'dateMethodsOperation.endedAt exists');
console.assert(typeof(dateMethodsOperation.endedAt) == 'number', 'dateMethodsOperation.endedAt is number', dateMethodsOperation.endedAt, typeof(dateMethodsOperation.endedAt));
console.assert(time - dateMethodsOperation.endedAt < 100, 'dateMethodsOperation.endedAt is unix timestamp', dateMethodsOperation.endedAt, time);
console.assert(typeof(dateMethodsOperation.status == 'string'), 'dateMethodsOperation.status is string', dateMethodsOperation.status, typeof(dateMethodsOperation.status));
console.assert(dateMethodsOperation.status == 'complete', 'dateMethodsOperation.status matches', dateMethodsOperation.status);

time = Date.now();
dateMethodsOperation.next(delay);
console.assert(dateMethodsOperation.nextAt, 'dateMethodsOperation.nextAt exists');
console.assert(typeof(dateMethodsOperation.nextAt) == 'number', 'dateMethodsOperation.nextAt is number', dateMethodsOperation.nextAt, typeof(dateMethodsOperation.nextAt));
console.assert(time - dateMethodsOperation.nextAt - delay < 100, 'dateMethodsOperation.nextAt is unix timestamp', dateMethodsOperation.nextAt, time);

// test isValid

let validOperation = new Operation(ns, operation_name, operation_scriptName, operation_sourcePort, operation_destinationPort);
console.assert(validOperation.isValid() == true, "validOperation.isValid is true", validOperation.isValid());

let invalidOperation = new Operation(ns, operation_name, operation_scriptName, operation_sourcePort, operation_destinationPort);
invalidOperation.name = null;
console.assert(invalidOperation.isValid() == false, "validOperation.isValid is true", invalidOperation.isValid(), invalidOperation);
