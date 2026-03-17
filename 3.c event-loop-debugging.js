// npx autocannon -c 100 -d 30 http://localhost:3000

const http = require('http');
const { monitorEventLoopDelay, performance } = require('perf_hooks');

const PORT = 3000;

/* ---------------- Event Loop Delay ---------------- */
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

/* ---------------- Throughput Counter ---------------- */
let requests = 0;
setInterval(() => {
    console.log('--- METRICS ---');
    console.log({
        rps: requests,
        eventLoopLagMeanMs: (h.mean / 1e6).toFixed(2),
        eventLoopLagP99Ms: (h.percentile(99) / 1e6).toFixed(2),
        elu: performance.eventLoopUtilization().utilization.toFixed(2),
        memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    });
    requests = 0;
}, 2000);

/* ---------------- HTTP Server ---------------- */
const server = http.createServer((req, res) => {
    // console.log("🚀 ~ req:", req.url)
    requests++;

    // Simulate "small but frequent" blocking
    const start = Date.now();
    while (Date.now() - start < 8) { } // 8ms CPU block

    res.end('ok');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
