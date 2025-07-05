export interface ModeStatus {
    currentMode: 'stdio' | 'http';
    preferredMode: 'stdio' | 'http' | 'auto';
    httpServerAvailable: boolean;
    stdioAvailable: boolean;
    autoSwitchEnabled: boolean;
    lastModeSwitch?: Date;
    connectionHealth: {
        httpServer: 'connected' | 'disconnected' | 'error';
        stdio: 'available' | 'unavailable';
    };
}
export declare class ModeManager {
    private currentMode;
    private preferredMode;
    private autoSwitchEnabled;
    private disableAutoFallback;
    private httpServerUrl;
    private healthCheckInterval?;
    private lastModeSwitch?;
    private modeChangeCallbacks;
    constructor();
    initialize(): Promise<void>;
    detectBestMode(): Promise<'stdio' | 'http'>;
    isHttpServerAvailable(): Promise<boolean>;
    isStdioAvailable(): Promise<boolean>;
    switchMode(newMode: 'stdio' | 'http', reason?: string): Promise<boolean>;
    startHealthMonitoring(): void;
    stopHealthMonitoring(): void;
    private performHealthCheck;
    getStatus(): Promise<ModeStatus>;
    forceMode(mode: 'stdio' | 'http' | 'auto'): Promise<boolean>;
    getCurrentMode(): 'stdio' | 'http';
    onModeChange(callback: (mode: 'stdio' | 'http') => void): void;
    destroy(): void;
}
export declare const modeManager: ModeManager;
//# sourceMappingURL=modeManager.d.ts.map