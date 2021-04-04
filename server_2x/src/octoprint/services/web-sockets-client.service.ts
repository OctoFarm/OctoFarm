import {Injectable} from "@nestjs/common";
import {ThrottleMessage} from "../dto/websocket-input/throttle.message";
import {AuthMessage} from "../dto/websocket-input/auth.message";

// import * as WebSocket from "ws";

@Injectable()
export class WebSocketsClientService {
    // https://stackoverflow.com/questions/61652247/connect-nestjs-to-a-websocket-server
    socket: any;

    constructor() {
        // this.ws.on("open", () => {
        //     this.ws.send(Math.random())
        // });
        //
        // this.ws.on("message", function (message) {
        //     console.log(message);
        // });
    }

    sendGeneric(payload: any) {

    }

    sendAuth(input: AuthMessage) {

    }

    sendThrottle(input: ThrottleMessage) {

    }
}