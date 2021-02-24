export interface ClientConnectionStateModel {
    apiKeyProvided: boolean;      // Key is truthy
    apiKeyValid: boolean;         // Local validation passed
    apiKeyAccepted: boolean;      // Remote 200 OK
    apiKeyIsGlobal: boolean;      // User is in deep shit
    userHasRequiredRoles: boolean;// Roles are Admin|Operators at the least.
    corsEnabled: boolean;         // Optional as CORS is only required in browser
    websocketConnected: boolean;  // Websocket is in connected state
    websocketHealthy: boolean;    // We are receiving printer data
}