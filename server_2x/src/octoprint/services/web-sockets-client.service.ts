import {Injectable} from "@nestjs/common";
// import * as WebSocket from "ws";

@Injectable()
export class WebSocketsClientService {
    // https://stackoverflow.com/questions/61652247/connect-nestjs-to-a-websocket-server
    // wss://echo.websocket.org is a test websocket server
    // private ws = new WebSocket("wss://echo.websocket.org");

    constructor() {
        // this.ws.on("open", () => {
        //     this.ws.send(Math.random())
        // });
        //
        // this.ws.on("message", function (message) {
        //     console.log(message);
        // });
    }

    // send(data: any) {
    //     this.ws.send(data);
    // }
    //
    // onMessage(handler: () => void) {
    //     // ...
    // }

    // ...
}