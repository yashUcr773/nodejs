/**
 * ============================================================
 * Browser Event Loop (V8 / Web Runtime)
 * ============================================================
 *
 * ! ⚠ IMPORTANT
 * ! - Run in browser (NOT nodejs)
 * ! - Use ESM (`"type": "module"` in package.json)
 * ! - No process.nextTick
 * ! - Behavior defined by HTML + ECMAScript specs
 *
 * ------------------------------------------------------------
 * HIGH-LEVEL MODEL
 * ------------------------------------------------------------
 *
 * 1. Synchronous execution
 *    - Call stack runs top → bottom
 *    - Blocks everything (timers, events, rendering)
 *    - Event loop does NOT start until stack is empty
 *
 * 2. Microtasks (single queue, spec-defined)
 *    - Promise.then / catch / finally
 *    - queueMicrotask
 *    - MutationObserver
 *
 *    Rules:
 *    ✔ Microtasks run immediately after the call stack clears
 *    ✔ Microtasks run after EVERY task
 *    ✔ Microtask queue is ALWAYS fully drained
 *
 * 3. Tasks (a.k.a. Macrotasks)
 *    - Executed one at a time
 *    - Each task → microtasks → rendering
 *
 *    Common task sources:
 *    - setTimeout
 *    - setInterval
 *    - MessageChannel
 *    - postMessage
 *    - UI events (click, input, scroll)
 *    - Network events
 *
 * 4. Rendering (browser-only step)
 *    - requestAnimationFrame callbacks
 *    - Layout
 *    - Paint
 *
 * ------------------------------------------------------------
 * EXECUTION ORDER (CANONICAL)
 * ------------------------------------------------------------
 *
 * [ Call Stack ]
 *        ↓
 * [ Microtasks (drained fully) ]
 *        ↓
 * [ One Task ]
 *        ↓
 * [ Microtasks (drained fully) ]
 *        ↓
 * [ requestAnimationFrame ]
 *        ↓
 * [ Layout / Paint ]
 *        ↓
 * [ Next Task ]
 *
 * ------------------------------------------------------------
 * CRITICAL RULES
 * ------------------------------------------------------------
 *
 * ✔ There is ONLY ONE microtask queue
 * ✔ No process.nextTick (Node-only concept)
 * ✔ Microtasks ALWAYS run before rendering
 * ✔ Long microtask chains can block rendering
 * ✔ Tasks do NOT have phases (unlike Node.js)
 *
 * ------------------------------------------------------------
 */

/**
 * ------------------------------------------------------------
 * ------------------------------------------------------------
 */

/* -----------------------------------------------------------
 * EXPERIMENT 1: Sync vs Promise vs queueMicrotask
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');

// // process.nextTick(() => {
// //   console.log('[process.nexttick] next tick queue');
// // });

// Promise.resolve().then(() => {
//   console.log('[Promise] microtask');
// });

// queueMicrotask(() => {
//   console.log('[queueMicrotask] same priority as Promise.then');
// });

// console.log('[Sync] End');

/* -----------------------------------------------------------
 * EXPERIMENT 2: Task vs Microtask ordering
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');

// setTimeout(() => {
//   console.log('[Task] setTimeout');
// }, 0);

// Promise.resolve().then(() => {
//   console.log('[Microtask] Promise');
// });

// console.log('[Sync] End');

/* -----------------------------------------------------------
 * EXPERIMENT 3: Microtasks always drain fully
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');

// Promise.resolve().then(() => {
//   console.log('[Microtask] 1.a');

//   Promise.resolve().then(() => {
//     console.log('[Microtask] 2');

//     Promise.resolve().then(() => {
//       console.log('[Microtask] 3');

//       Promise.resolve().then(() => {
//         console.log('[Microtask] 4');

//         Promise.resolve().then(() => {
//           console.log('[Microtask] 5');
//         });
//       });
//     });
//   });
// }).then(() => {
//   console.log('[Microtask] 1.b');
// }).then(() => {
//   console.log('[Microtask] 1.c');
// });


// setTimeout(() => {
//   console.log('[Task] setTimeout');
// }, 0);

// console.log('[Sync] End');

/* -----------------------------------------------------------
 * EXPERIMENT 4: Microtasks inside a task
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');
// setTimeout(() => {
//   console.log('[Task] outer setTimeout');

//   Promise.resolve().then(() => {
//     console.log('[Microtask] inside task');
//   });
// }, 0);
// console.log('[Sync] End');


/* -----------------------------------------------------------
 * EXPERIMENT 5: requestAnimationFrame vs setTimeout
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');
// requestAnimationFrame(() => {
//   console.log('[rAF] before paint');
// });

// setTimeout(() => {
//   console.log('[Task] setTimeout');
// }, 0);
// console.log('[Sync] End');


/* -----------------------------------------------------------
 * EXPERIMENT 6: Rendering blocked by microtasks
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');

// setTimeout(() => {
//   console.log('[Task] setTimeout');
// }, 0);
// requestAnimationFrame(() => {
//   console.log('[rAF] SHOULD run soon');
// });

// Promise.resolve().then(() => {
//   let start = performance.now();
//   console.log('[Microtask] long microtask started');
//   while (performance.now() - start < 3000) {
//     // block microtasks
//   }
//   console.log('[Microtask] long microtask finished');
// });
// console.log('[Sync] End');

/* -----------------------------------------------------------
 * EXPERIMENT 7: MessageChannel (task queue)
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');

// const channel = new MessageChannel();

// channel.port1.onmessage = () => {
//   console.log('[Task] MessageChannel');
// };

// channel.port2.postMessage(null);

// Promise.resolve().then(() => {
//   console.log('[Microtask] Promise');
// });
// console.log('[Sync] End');


/* -----------------------------------------------------------
 * EXPERIMENT 8: Infinite microtask starvation (browser)
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');

// function recursiveMicrotask(count = 0) {
//   if (count === 5) return;
//   queueMicrotask(() => recursiveMicrotask(count + 1));
//   console.log('[Microtask] count:', count);
// }

// recursiveMicrotask();

// setTimeout(() => {
//   console.log('[Task] setTimeout (delayed)');
// }, 0);
// console.log('[Sync] End');

/* -----------------------------------------------------------
 * EXPERIMENT 9: UI events are tasks
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');
// document.addEventListener('click', () => {
//   console.log('[Task] click handler');

//   Promise.resolve().then(() => {
//     console.log('[Microtask] inside click');
//   });
// });
// console.log('[Sync] End');


/* -----------------------------------------------------------
 * EXPERIMENT 10: Network callbacks are tasks
 * -----------------------------------------------------------
 */

// console.log('[Sync] Start');
// fetch('https://jsonplaceholder.typicode.com/todos/1')
//   .then(() => {
//     console.log('[Microtask] fetch .then');
//   });
// console.log('[Sync] End');

/* -----------------------------------------------------------
 * EXPERIMENT 11: Everything
 * -----------------------------------------------------------
 */

console.log('[Sync] Start');

setTimeout(() => {
  console.log('[Task] setTimeout 1');
}, 0);

Promise.resolve().then(() => {
  console.log('[Promise] microtask 1');
});

queueMicrotask(() => {
  console.log('[queueMicrotask] same priority as Promise.then 1');
});

setTimeout(() => {
  console.log('[Task] setTimeout 2');
}, 0);

requestAnimationFrame(() => {
  console.log('[rAF] raf 1');
});

setTimeout(() => {
    console.log('[Task] inner setTimeout 1');

  setTimeout(() => {
    console.log('[Task] setTimeout 3');
  }, 0);

  Promise.resolve().then(() => {
    console.log('[Promise] microtask 2');
  });

  queueMicrotask(() => {
    console.log('[queueMicrotask] same priority as Promise.then 2');
  });

  setTimeout(() => {
    console.log('[Task] setTimeout 4');
  }, 0);

  requestAnimationFrame(() => {
    console.log('[rAF] raf 2');
  });
}, 0)

document.addEventListener('click', () => {
  console.log('[Task] click handler');

  setTimeout(() => {
    console.log('[Task] setTimeout 5');
  }, 0);

  Promise.resolve().then(() => {
    console.log('[Promise] microtask 3');
  });

  queueMicrotask(() => {
    console.log('[queueMicrotask] same priority as Promise.then 3');
  });

  setTimeout(() => {
    console.log('[Task] setTimeout 6');
  }, 0);

  requestAnimationFrame(() => {
    console.log('[rAF] raf 3');
  });
});

fetch('https://jsonplaceholder.typicode.com/todos/1')
  .then(() => {
    console.log('[Microtask] fetch .then');

    setTimeout(() => {
      console.log('[Task] setTimeout 7');
    }, 0);

    Promise.resolve().then(() => {
      console.log('[Promise] microtask 4');
    });

    queueMicrotask(() => {
      console.log('[queueMicrotask] same priority as Promise.then 4');
    });

    setTimeout(() => {
      console.log('[Task] setTimeout 8');
    }, 0);

    requestAnimationFrame(() => {
      console.log('[rAF] raf 4');
    });
  });

console.log('[Sync] End');
