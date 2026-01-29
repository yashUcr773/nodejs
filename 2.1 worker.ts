import { parentPort } from "worker_threads";

parentPort!.on("message", () => {
    let j = 0
    for (let i = 0; i < 1e10; i++) {
        j++
    }
    parentPort!.postMessage("done");
});
