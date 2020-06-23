import { spawn, Thread, Worker } from "threads"

async function main() {
    const add = await spawn(new Worker("./workers/add"))
    const sum = await add(2, 3)

    console.log(`2 + 3 = ${sum}`)

    await Thread.terminate(add)
}

main().catch(console.error)