export declare class ModeDetector {
    static detectMode(): {
        operation: string;
        environment: string;
        asyncEnabled: boolean;
        websockets: boolean;
        realImplementation: boolean;
        timestamp: string;
    };
    static isAsyncMode(): boolean;
    static isVercelEnvironment(): boolean;
    static getServerConfig(): {
        serverUrl: string;
        timeout: number;
        asyncEnabled: boolean;
        realImplementation: boolean;
    };
    static validateAsyncOnlyMode(): boolean;
    static isDemoMode(): boolean;
}
//# sourceMappingURL=mode-detector.d.ts.map