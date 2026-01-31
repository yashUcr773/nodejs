/**
 * ============================================================
 * Node.js Event Loop — Practical & Accurate Mental Model
 * ============================================================
 *
 * ! ⚠ IMPORTANT
 * ! - Run in Node.js (NOT browser)
 * ! - Use CommonJS (`"type": "commonjs"` in package.json)
 *
 * ------------------------------------------------------------
 * HIGH-LEVEL MODEL
 * ------------------------------------------------------------
 *
 * 1. Synchronous execution
 *    - Call stack runs top → bottom
 *    - Event loop does NOT start until stack is empty
 *
 * 2. Microtasks (run immediately after stack & after EVERY callback)
 *    - process.nextTick   (Node-only, highest priority)
 *    - Promise microtasks (Promise.then, queueMicrotask)
 *
 * 3. Event loop phases (each has its own queue)
 *
 *    1️⃣ Timers phase
 *       - setTimeout
 *       - setInterval
 *
 *    2️⃣ Poll phase
 *       - I/O callbacks (fs, net, dns, crypto*)
 *       - If poll queue empty → may move to Check
 *
 *    3️⃣ Check phase
 *       - setImmediate
 *
 *    4️⃣ Close callbacks
 *       - socket.close, server.close, etc.
 *
 * ------------------------------------------------------------
 * CRITICAL RULES
 * ------------------------------------------------------------
 *
 * ✔ Call stack must be empty before event loop starts
 * ✔ After EVERY callback:
 *     → process.nextTick queue is fully drained
 *     → Promise microtask queue is fully drained
 * ✔ process.nextTick can STARVE the event loop
 * ✔ Phases compete — microtasks do NOT
 *
 * ------------------------------------------------------------
 */

/**
 * ------------------------------------------------------------
 * ------------------------------------------------------------
 */

/* -----------------------------------------------------------
 * EXPERIMENT 1: Sync vs nextTick vs Promise
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');

// process.nextTick(() => {
//   console.log('[nextTick] runs before Promise microtasks');
// });

// Promise.resolve().then(() => {
//   console.log('[Promise] microtask runs after nextTick');
// });

// queueMicrotask(() => {
//   console.log('[queueMicrotask] same priority as Promise.then');
// });

// console.log('[Sync] End');


/* -----------------------------------------------------------
 * EXPERIMENT 2: Top-level ordering
 * Timers vs Check vs Microtasks
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');

// setTimeout(() => {
//       console.log('[Timer] setTimeout(0) callback');
// }, 0);

// setImmediate(() => {
//       console.log('[Check] setImmediate callback');
// });

// process.nextTick(() => {
//       console.log('[nextTick] runs before Promise microtasks');
// });

// Promise.resolve().then(() => {
//       console.log('[Promise] microtask');
// });

// console.log('[Sync] End');


/* -----------------------------------------------------------
 * EXPERIMENT 3: Microtasks inside a timer callback
 * -----------------------------------------------------------
 */

// setTimeout(() => {
//   console.log('[Timer] outer setTimeout');

//   process.nextTick(() => {
//     console.log('[nextTick] inside timer');
//   });

//   Promise.resolve().then(() => {
//     console.log('[Promise] inside timer');
//   });
// }, 0);


/* -----------------------------------------------------------
 * EXPERIMENT 4: Why nextTick is dangerous (starvation)
 * -----------------------------------------------------------
 */

// function recursiveNextTick(count = 0) {
//   if (count === 10) return;
//   process.nextTick(() => recursiveNextTick(count + 1));
//   console.log('[nextTick] recursion count:', count);
// }

// recursiveNextTick();

// setTimeout(() => {
//   console.log('[Timer] THIS RUNS VERY LATE (or never if infinite)');
// }, 0);


/* -----------------------------------------------------------
 * EXPERIMENT 5: setTimeout vs setImmediate INSIDE I/O
 * -----------------------------------------------------------
 *
 * Inside I/O callbacks:
 *   setImmediate usually runs BEFORE setTimeout(0)
 *
 */

// const fs = require('fs');

// fs.readFile('./data/name.txt', () => {
//   console.log('[Poll] fs.readFile callback');

//   setTimeout(() => {
//     console.log('[Timer] setTimeout inside I/O');
//   }, 0);

//   setImmediate(() => {
//     console.log('[Check] setImmediate inside I/O');
//   });
// });

/* -----------------------------------------------------------
 * EXPERIMENT 6: crypto.pbkdf2 (Thread pool → Poll phase)
 * -----------------------------------------------------------
 *
 * crypto.pbkdf2 runs in libuv thread pool.
 * When finished, callback is queued in Poll phase.
 *
 */

const crypto = require('crypto');

console.log('\n=== EXPERIMENT 8: crypto.pbkdf2 ===');

console.log('[Sync] Start');

crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
  console.log('[Poll] crypto.pbkdf2 callback');

  process.nextTick(() => {
    console.log('[nextTick] inside crypto');
  });

  Promise.resolve().then(() => {
    console.log('[Promise] inside crypto');
  });

  setImmediate(() => {
    console.log('[Check] setImmediate inside crypto');
  });

  setTimeout(() => {
    console.log('[Timer] setTimeout(0) inside crypto');
  }, 0);
});

setImmediate(() => {
  console.log('[Check] setImmediate');
});

setTimeout(() => {
  console.log('[Timer] setTimeout(0)');
}, 0);

console.log('[Sync] End');