const createTaskQueue = require('../index');

const taskQueue = createTaskQueue({ capacity: 20, concurrency: 5 });

taskQueue.on('task_done', function (output, id) {
  console.log(`task id: ${id}, output: ${output}`);
});

taskQueue.on('hwm', () => console.log('HHH above high-water mark'));
taskQueue.on('lwm', () => console.log('LLL below low-water mark'));
taskQueue.on('task_failed', (err, id) => console.log(`task id: ${id}, ${err}`));

for (let i = 0, tid = 0; i < 40; ++i) {
  let success = false;
  ++tid;
  setTimeout(() => {
    success = taskQueue.enqueue({fn: asyncTask, args: [42], id: 'asyncTask-' + tid, timeout: 85});
    if (!success) console.log(`task ${tid} failed to add to the task queue.`);
  }, Math.floor(Math.random() * 20));

  ++tid;
  setTimeout(() => {
    success = taskQueue.enqueue({fn: syncTask, args: [2, 3], id: 'syncTask-' + tid});
    if (!success) console.log(`task ${tid} failed to add to the task queue.`);
  }, Math.floor(Math.random() * 20));
}

function asyncTask(value) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(value);
    }, Math.floor(Math.random() * 100));
  });
}

function syncTask(a, b) {
  for (let i=0; i<300000; i++) { let c = a * b * b; }
  return a + b;
}
