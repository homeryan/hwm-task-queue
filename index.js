const co = require('co');
const events = require('events');

const DEFAULT_CAPACITY = 100;
const DEFAULT_CONCURRENCY = 10;
const DEFAULT_HWM = 0.8;
const DEFAULT_LWM = 0.6;

/*
 * Events: hwm, lwm, task_done, task_failed
 */

class HWMTaskQueue extends events.EventEmitter {
  constructor(options) {
    super();
    const opts = Object.assign({
      capacity: DEFAULT_CAPACITY,
      concurrency: DEFAULT_CONCURRENCY,
      hwm: DEFAULT_HWM,
      lwm: DEFAULT_LWM
    }, options);
    this._capacity = opts.capacity;
    this._hwm = Math.floor(this._capacity * opts.hwm);
    this._lwm = Math.floor(this._capacity * opts.lwm);
    this._concurrency = opts.concurrency;
    this._activeTasks = 0;
    this._taskQueue = [];
  }

  /* Push a task into task queue
   *
   * task parameter is a Javascript object
   *  task.fn: function to execute
   *  task.args: an Array of parameters of task.fn
   *  this: context of the task function
   *  id: a string to identify the task
   *  timeoutPromise: timeoutPromise in ms
   *
   * When it comes to passing arguments to a function invocation, JavaScript is eager,
   * it evaluates all of the expressions, and it does so whether the value of the
   * expression is used or not.
   */
  enqueue(task) {
    // Capacity check.
    if (this._taskQueue.length > this._capacity) return false;

    // High-water mark check.
    if (this._taskQueue.length >= this._hwm) { this.emit('hwm'); }

    // Concurrency check.
    if (this._activeTasks >= this._concurrency) { return this._taskQueue.push(task); }

    this._nextTask(task);
    return true;
  }

  _nextTask(task) {
    const self = this;
    ++self._activeTasks;

    const taskToRun = Object.assign({
      fn: Function.prototype,
      this: null,
      args: [],
      id: '',
      timeout: -1
    }, task);

    co(function *(){
      try {
        let output;
        if (taskToRun.timeout < 0) {
          output = yield Promise.resolve(taskToRun.fn.apply(taskToRun.this, taskToRun.args));
        } else {
          output = yield Promise.race([
            Promise.resolve(taskToRun.fn.apply(taskToRun.this, taskToRun.args)),
            timeoutPromise(taskToRun.timeout)
          ]);
        }
        setImmediate(() => self.emit('task_done', output, taskToRun.id));
      } catch (err) {
        setImmediate(() => self.emit('task_failed', err, taskToRun.id));
      }
      --self._activeTasks;
      if (self._taskQueue.length > 0) {
        // Low-water mark check.
        if (self._taskQueue.length - 1 === self._lwm) setImmediate(() => self.emit('lwm'));
        // Execute the next task.
        const nextTask = self._taskQueue.shift();
        nextTask && setImmediate(() => self._nextTask(nextTask));
      }
    }).catch(err => {
      console.error(err);
      setImmediate(() => self.emit('task_failed', err, taskToRun.id));
    });
  }
}

function timeoutPromise(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject( 'task timeout' );
    }, ms);
  });
}

module.exports = function createTaskQueue(options) { return new HWMTaskQueue(options); };