export interface ClientConnectionStateModel {
    apiKeyValid: boolean;         // Local validation passed
    apiKeyAccepted: boolean;      // Remote 200 OK
    apiKeyIsGlobal: boolean;      // User is in deep shit
    corsEnabled: boolean;         // Optional as CORS is only required in browser
    userHasRequiredGroups: boolean;// Roles are Admin|Operators at the least.
    apiConnected: boolean;        // To track whether in general the API returned 200-OK responses
    websocketConnected: boolean;  // Websocket is in connected state
    websocketHealthy: boolean;    // We are receiving printer data
}