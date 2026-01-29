import express from "express";
import { Worker } from "worker_threads";

const app = express();

// Timestamp helper for logs
const now = () => new Date().toISOString();

/**
 * BASELINE ROUTE
 * --------------
 * Fast, non-blocking.
 * Used to verify event loop responsiveness.
 */
app.get("/slow/base", (req, res) => {
    const before = now();
    console.log(`[${before}] /base start`);

    res.send("base done");

    console.log(`[${now()}] /base end`);
});

/**
 * CPU BLOCKING (MAIN THREAD)
 * -------------------------
 * This loop runs on the main JS thread.
 * It blocks the event loop completely.
 *
 * ❌ All other requests stall until finished
 */
app.get("/slow/blocking", (req, res) => {
    console.log(`[${now()}] /blocking start`);

    let j = 0;
    for (let i = 0; i < 1e10; i++) {
        j++;
    }

    console.log(`[${now()}] /blocking end`);
    res.send("blocking done");
});

/**
 * CPU BLOCKING (WORKER THREAD)
 * ---------------------------
 * Same kind of work, but moved to a worker.
 *
 * ✔ Main thread remains responsive
 * ✔ Worker has its own event loop
 */
app.get("/slow/worker/blocking", (req, res) => {
    const start = Date.now();
    console.log(`[${now()}] /blocking worker start`);

    // New worker is spawned for THIS request
    const worker = new Worker("./2.1 worker.ts");

    // Trigger work in the worker
    worker.postMessage({});

    // Receive message from worker
    worker.on("message", (msg) => {
        console.log("🚀 worker msg:", msg);

        worker.terminate(); // cleanup thread
        res.send(`done in ${Date.now() - start}ms`);
    });

    worker.on("error", (err: any) => {
        res.status(500).send(err.message);
    });

    // IMPORTANT: this logs immediately
    console.log(`[${now()}] /blocking worker end`);
});

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
