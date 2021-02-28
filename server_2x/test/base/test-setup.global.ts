import {start} from "mongo-unit";

export default async () => {
    console.log('DB warmup');
    const dbURL = await start();
    console.log('DB started', dbURL);
}