# hwm-task-queue

### A task queue with high-water mark and low-water mark event.

This module implements a Javascript task queue that emits 'hwm' and 'lwm' events. To use this task queue, first we create a task queue, and then enqueue tasks into it. If the number of tasks in the queue is greater than high-water mark, an 'hwm' event will be emitted. If the number of tasks drop below low-water mark, an 'lwm' event will be emitted. If the task queue is full, enqueue will fail and return false, and the task will be dropped.

## Features

- Simple interface
- Support synchronous and ES2015 Promise based asynchronous tasks
- Customizable task queue
- Customizable tasks with timeout option

## Install

```
npm install hwm-task-queue
```

## API

### `createTaskQueue(task_queue_options)`

Task queue options are:
```js
{ 
  capacity: 100,      // Task queue capacity (default=100) 
  concurrency: 10,    // Maximum number of concurrent tasks (default=10)
  hwm: 0.8,           // High-water mark ratio, a number between 0 and 1 (default=0.8)
  lwm: 0.6            // High-water mark ratio, a number between 0 and 1 (default=0.6)
}
```

### `taskQueue.enqueue(task_options)`

Task options are:
```js
{
  fn: taskFunction,   // A function that performs a task (default=Function.prototype) 
  args: [arg1, arg2], // Arguments of fn (default=[])
  id: 'task_1',       // A string identifying the task (default='')
  this: context,      // Call-site this binding (default=null)
  timeout: 100        // Task timeout in ms, -1 means never timeout (default=-1) 
}
```

## Events:

### `taskQueue.on('hwm', function() { ... })`
Emitted when tasks in the task queue reach the high-water mark specified in createTaskQueue options.

### `taskQueue.on('lwm', function() { ... })`
Emitted when tasks in the task queue drop below the ligh-water mark specified in createTaskQueue options.

### `taskQueue.on('task_done', function(value, task_id) { ... })`
Emitted when a task is finished. The return value of the task function or resolved value of the task Promise along with task id can be accessed in the callback function.

### `taskQueue.on('task_failed', function(err, task_id) { ... })`
Emitted when a task failed. The error object and task id can be accessed in the callback function.

## Examples:

### Example of creating a task queue:
```js
const createTaskQueue = require('hwm-task-queue');

const taskQueue = createTaskQueue({ 
  capacity: 20,   // This task queue holds at most 20 tasks. 
  concurrency: 5, // Maximum 5 concurrent tasks.
  hwm: 0.8,       // When task queue is 80% full, or there are 20*0.8 tasks in the 
                  // queue, it will emit an 'hwm' event.
  lwm: 0.6        // When tasks in the queue drop below 60% of queue capacity, or
                  // 20*0.6 tasks, an 'lwm' event will be emitted.
});
```
### Example of adding tasks to a task queue:
```js
// An asynchronous task function that returns an ES2015 Promise.
function asyncTask(value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(value);
    }, Math.floor(Math.random() * 100));
  });
}

// A synchronous task function.
function syncTask(a, b) {
  return a + b;
}

let success;
// Add an asynchronous task to the task queue. If successful, it will return true.
// Otherwise it will return false, indicating that the task queue is full.
success = taskQueue.enqueue({
  fn: asyncTask, 
  args: [42], 
  id: 'async_task', 
  timeout: 50     // There is a 50% chance this task will timeout.
});

success = taskQueue.enqueue({
  fn: syncTask,
  args: [40, 2],
  id: 'sync_task'
});
```
### Example of handling the task queue events:
```js
taskQueue.on('hwm', () => console.log('above high-water mark'));

taskQueue.on('lwm', () => console.log('below low-water mark'));

taskQueue.on('task_done', 
  (output, id) => console.log(`task id: ${id}, output: ${output}`));

taskQueue.on('task_failed', 
  (err, id) => console.log(`task id: ${id}, ${err}`));
```

###See example/example.js for task queue in action.

## License

MIT © 2016-2017 [Hong Yan](https://github.com/homeryan).