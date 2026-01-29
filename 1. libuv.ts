import express from "express";
import fs from "fs";
import crypto from "crypto";

const app = express();

const now = () => new Date().toISOString();

/**
 * FAST / BASELINE ENDPOINT
 * -----------------------
 * This route does almost nothing.
 * It immediately responds.
 *
 * ✔ Runs on the main event loop
 * ✔ Non-blocking
 * ✔ Can handle thousands of concurrent requests
 */
app.get("/slow/base", (req, res) => {
    const before = now()
    console.log(`[${before}] /base start`);
    res.send("base done");
    console.log(`[${now()}] /base end`);
});

/**
 * CPU-BLOCKING ENDPOINT
 * --------------------
 * This loop runs on the MAIN THREAD.
 * Node.js has a single JS thread.
 *
 * ❌ Blocks the event loop
 * ❌ Prevents ALL other requests from being processed
 * ❌ libuv CANNOT help here
 */
app.get("/slow/blocking", (req, res) => {
    console.log(`[${now()}] /blocking start`);

    let j = 0;
    for (let i = 0; i < 5e9; i++) {
        j++;
    }

    console.log(`[${now()}] /blocking end`);
    res.send("blocking done");
});

/**
 * FILE SYSTEM (ASYNC) ENDPOINT
 * ---------------------------
 * fs.createReadStream is async.
 *
 * ✔ The actual file IO is handled by libuv's thread pool
 * ✔ Main event loop is NOT blocked
 * ✔ Other requests can be served while file is read
 */
app.get("/slow/fs", (req, res) => {
    console.log(`[${now()}] /fs start`);

    let size = 0;
    fs.createReadStream("./data/lorem-ipsum.txt", { highWaterMark: 1000 })
        .on("data", (chunk) => {
            size += chunk.length;
        })
        .on("end", () => {
            console.log(`[${now()}] /fs end`);
            res.send(`fs done: ${size}`);
        });
});

/**
 * THREAD POOL DEMO (crypto)
 * Each request uses libuv thread pool
 */
app.get("/slow/crypto", (req, res) => {
    console.log(`[${now()}] /crypto start`);
    crypto.pbkdf2("pass", "salt", 2147483645, 64, "sha512", () => {
        console.log(`[${now()}] /crypto end`);
        res.send("crypto done");
    });
});

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
