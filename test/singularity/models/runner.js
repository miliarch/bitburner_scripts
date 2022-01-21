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

// test processOperation
let processOperationRunner = new Runner(ns, 1);
processOperationRunner.insertOperation(operation1);
await processOperationRunner.processOperation();
console.assert(processOperationRunner.loopCount == 1, 'processOperationRunner.loopCount is 1', processOperationRunner.loopCount);
console.assert(processOperationRunner.operationCount == 1, 'processOperationRunner.operationCount is 1', processOperationRunner.operationCount);
console.assert(processOperationRunner.operations.length == 0, 'processOperationRunner.operations.length is 0', processOperationRunner.operations.length, processOperationRunner.operations)

processOperationRunner.resetOperationCount();
processOperationRunner.resetLoopCount();
console.assert(processOperationRunner.loopCount == 0, 'processOperationRunner.loopCount is 0', processOperationRunner.loopCount);
console.assert(processOperationRunner.operationCount == 0, 'processOperationRunner.operationCount is 0', processOperationRunner.operationCount);

processOperationRunner.insertOperation(operation1);
processOperationRunner.insertOperation(stopRunnerOperation);
processOperationRunner.insertOperation(operation2);
await processOperationRunner.processOperation();
console.assert(processOperationRunner.loopCount == 1, 'processOperationRunner.loopCount is 1', processOperationRunner.loopCount);
console.assert(processOperationRunner.operationCount == 1, 'processOperationRunner.operationCount is 1', processOperationRunner.operationCount);
console.assert(processOperationRunner.operations.length == 2, 'processOperationRunner.operations.length is 2', processOperationRunner.operations.length, processOperationRunner.operations)

// test programLoop (TODO: consider cleanup() once implemented - this result will change)
let programLoopRunner = new Runner(ns, 1);
programLoopRunner.insertOperation(operation1);
programLoopRunner.insertOperation(stopRunnerOperation);
programLoopRunner.insertOperation(operation2);
await programLoopRunner.start()
console.assert(programLoopRunner.loopCount == 0, 'programLoopRunner.loopCount is 2', programLoopRunner.loopCount, '\n', programLoopRunner);
console.assert(programLoopRunner.operationCount == 2, 'programLoopRunner.operationCount is 2', programLoopRunner.operationCount);
console.assert(programLoopRunner.operations.length == 1, 'programLoopRunner.operations.length is 1', programLoopRunner.operations.length, programLoopRunner.operations)
