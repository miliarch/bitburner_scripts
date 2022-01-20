import { Operation } from '../../../src/singularity/models/operation.js';
import { Runner } from '../../../src/singularity/models/runner.js';
import { ns } from '../../test_helpers.js'

// setup operations - stagger creation times
let operation1 = new Operation(ns, 'test', '/some/script.js', 1, 2);
await ns.sleep(1000);
let stopRunnerOperation = new Operation(ns, 'control_runner_stop', '/some/script', 1, 2);
await ns.sleep(1000);
let operation2 = new Operation(ns, '/some/script.js', 1, 2);


// test default instantiation

// test minimum input

// test optional input

// test processOperations
let processOperationsRunner = new Runner(ns, 1);
processOperationsRunner.insertOperation(operation1);
await processOperationsRunner.processOperations();
console.assert(processOperationsRunner.loopCount == 1, 'processOperationsRunner.loopCount is 1', processOperationsRunner.loopCount);
console.assert(processOperationsRunner.operationCount == 1, 'processOperationsRunner.operationCount is 1', processOperationsRunner.operationCount);
console.assert(processOperationsRunner.operations.length == 0, 'processOperationsRunner.operations.length is 0', processOperationsRunner.operations.length, processOperationsRunner.operations)

processOperationsRunner.resetOperationCount();
processOperationsRunner.resetLoopCount();
console.assert(processOperationsRunner.loopCount == 0, 'processOperationsRunner.loopCount is 0', processOperationsRunner.loopCount);
console.assert(processOperationsRunner.operationCount == 0, 'processOperationsRunner.operationCount is 0', processOperationsRunner.operationCount);

processOperationsRunner.insertOperation(operation1);
processOperationsRunner.insertOperation(stopRunnerOperation);
processOperationsRunner.insertOperation(operation2);
await processOperationsRunner.processOperations();
console.assert(processOperationsRunner.loopCount == 1, 'processOperationsRunner.loopCount is 1', processOperationsRunner.loopCount);
console.assert(processOperationsRunner.operationCount == 1, 'processOperationsRunner.operationCount is 1', processOperationsRunner.operationCount);
console.assert(processOperationsRunner.operations.length == 2, 'processOperationsRunner.operations.length is 2', processOperationsRunner.operations.length, processOperationsRunner.operations)

// test programLoop (TODO: consider cleanup() once implemented - this result will change)
let programLoopRunner = new Runner(ns, 1);
programLoopRunner.insertOperation(operation1);
programLoopRunner.insertOperation(stopRunnerOperation);
programLoopRunner.insertOperation(operation2);
await programLoopRunner.start()
console.assert(programLoopRunner.loopCount == 0, 'programLoopRunner.loopCount is 2', programLoopRunner.loopCount, '\n', programLoopRunner);
console.assert(programLoopRunner.operationCount == 2, 'programLoopRunner.operationCount is 2', programLoopRunner.operationCount);
console.assert(programLoopRunner.operations.length == 1, 'programLoopRunner.operations.length is 1', programLoopRunner.operations.length, programLoopRunner.operations)
