import {stop} from "mongo-unit";

console.log('DB teardown');

export default async () => {
    const dbURL = await stop();
    console.log('DB stopped', dbURL);
}