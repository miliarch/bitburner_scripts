import { Operation } from '../../../src/singularity/models/operation.js';
import { ns } from '../../test_helpers.js'

// test vars
let operation_name = 'test_operation';
let operation_scriptName = '/some/script';
let operation_port = 1;
let blocking = false;
let prependArgs = ['just', 'some', 'args'];
let appendArgs = ['some', 'more', 'args'];
console.assert(operation_name == 'test_operation', 'operation_name', operation_name);
console.assert(operation_scriptName == '/some/script', 'operation_scriptName', operation_scriptName);
console.assert(operation_port == 1, 'operation_port', operation_port);
console.assert(blocking == false, 'blocking', blocking);
console.assert(prependArgs[0] == 'just' && prependArgs[1] == 'some' && prependArgs[2] == 'args', 'prependArgs', prependArgs);
console.assert(appendArgs[0] == 'some' && appendArgs[1] == 'more' && appendArgs[2] == 'args', 'appendArgs', appendArgs);

// test default instantiation
var time;
time = Date.now()
let defaultOperation = new Operation(ns, operation_name, operation_scriptName, operation_port);
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
let minimumInputOperation = new Operation(ns, operation_name, operation_scriptName, operation_port);
console.assert(minimumInputOperation.name, 'minimumInputOperation.name exists');
console.assert(typeof(minimumInputOperation.name == 'string'), 'minimumInputOperation.name is string', minimumInputOperation.name, typeof(minimumInputOperation.name));
console.assert(minimumInputOperation.name == operation_name, 'minimumInputOperation.name matches', minimumInputOperation.name);
console.assert(minimumInputOperation.scriptName, 'minimumInputOperation.scriptName exists');
console.assert(typeof(minimumInputOperation.scriptName == 'string'), 'minimumInputOperation.scriptName is string', minimumInputOperation.scriptName, typeof(minimumInputOperation.scriptName));
console.assert(minimumInputOperation.scriptName == operation_scriptName, 'minimumInputOperation.scriptName matches', minimumInputOperation.scriptName);
console.assert(minimumInputOperation.port, 'minimumInputOperation.port exists');
console.assert(typeof(minimumInputOperation.port == 'number'), 'minimumInputOperation.port is number', minimumInputOperation.port, typeof(minimumInputOperation.port));
console.assert(minimumInputOperation.port == operation_port, 'minimumInputOperation.port matches', minimumInputOperation.port);

// test optional input
let optionalInputOperation = new Operation(ns, operation_name, operation_scriptName, operation_port, blocking, prependArgs, appendArgs);
console.assert(optionalInputOperation.blocking == false, 'optionalInputOperation.blocking is false');
console.assert(optionalInputOperation.prependArgs, 'optionalInputOperation.prependArgs exists');
console.assert(typeof(optionalInputOperation.prependArgs == 'object'), 'optionalInputOperation.prependArgs is object', optionalInputOperation.prependArgs, typeof(optionalInputOperation.prependArgs));
console.assert(optionalInputOperation.prependArgs.constructor === Array, 'optionalInputOperation.prependArgs is Array', optionalInputOperation.prependArgs, typeof(optionalInputOperation.prependArgs));
console.assert(optionalInputOperation.prependArgs[0] == prependArgs[0] && optionalInputOperation.prependArgs[1] == prependArgs[1] && optionalInputOperation.prependArgs[2] == prependArgs[2], 'optionalInputOperation.appendArgs values match', optionalInputOperation.prependArgs);
console.assert(optionalInputOperation.appendArgs, 'optionalInputOperation.appendArgs exists');
console.assert(typeof(optionalInputOperation.appendArgs == 'object'), 'optionalInputOperation.appendArgs is object', optionalInputOperation.appendArgs, typeof(optionalInputOperation.appendArgs));
console.assert(optionalInputOperation.appendArgs.constructor === Array, 'optionalInputOperation.appendArgs is Array', optionalInputOperation.appendArgs, typeof(optionalInputOperation.appendArgs));
console.assert(optionalInputOperation.appendArgs[0] == appendArgs[0] && optionalInputOperation.appendArgs[1] == appendArgs[1] && optionalInputOperation.appendArgs[2] == appendArgs[2], 'optionalInputOperation.appendArgs values match', optionalInputOperation.appendArgs);

// test methods
let methodsOperation = new Operation(ns, operation_name, operation_scriptName, operation_port);
let delay = 30000

time = Date.now();
methodsOperation.start();
console.assert(methodsOperation.startedAt, 'methodsOperation.startedAt exists');
console.assert(typeof(methodsOperation.startedAt) == 'number', 'methodsOperation.startedAt is number', methodsOperation.startedAt, typeof(methodsOperation.startedAt));
console.assert(time - methodsOperation.startedAt < 100, 'methodsOperation.startedAt is unix timestamp', methodsOperation.startedAt, time);
console.assert(methodsOperation.status, 'methodsOperation.status exists');
console.assert(typeof(methodsOperation.status == 'string'), 'methodsOperation.status is string', methodsOperation.status, typeof(methodsOperation.status));
console.assert(methodsOperation.status == 'in progress', 'methodsOperation.status matches', methodsOperation.status);

time = Date.now();
methodsOperation.end();
console.assert(methodsOperation.endedAt, 'methodsOperation.endedAt exists');
console.assert(typeof(methodsOperation.endedAt) == 'number', 'methodsOperation.endedAt is number', methodsOperation.endedAt, typeof(methodsOperation.endedAt));
console.assert(time - methodsOperation.endedAt < 100, 'methodsOperation.endedAt is unix timestamp', methodsOperation.endedAt, time);
console.assert(typeof(methodsOperation.status == 'string'), 'methodsOperation.status is string', methodsOperation.status, typeof(methodsOperation.status));
console.assert(methodsOperation.status == 'complete', 'methodsOperation.status matches', methodsOperation.status);

time = Date.now();
methodsOperation.next(delay);
console.assert(methodsOperation.nextAt, 'methodsOperation.nextAt exists');
console.assert(typeof(methodsOperation.nextAt) == 'number', 'methodsOperation.nextAt is number', methodsOperation.nextAt, typeof(methodsOperation.nextAt));
console.assert(time - methodsOperation.nextAt - delay < 100, 'methodsOperation.nextAt is unix timestamp', methodsOperation.nextAt, time);
