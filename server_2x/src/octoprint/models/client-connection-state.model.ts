export interface ClientConnectionStateModel {
    apiKeyValid: boolean;         // Local validation passed
    apiKeyAccepted: boolean;      // Remote 200 OK
    apiKeyIsGlobal: boolean;      // User is in deep shit
    corsEnabled: boolean;         // Optional as CORS is only required in browser
    userHasRequiredRoles: boolean;// Roles are Admin|Operators at the least.
    websocketConnected: boolean;  // Websocket is in connected state
    websocketHealthy: boolean;    // We are receiving printer data
}