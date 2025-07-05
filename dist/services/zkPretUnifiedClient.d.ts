import type { ToolExecutionResult, ServerStatus } from '../types/index.js';
declare class ZKPretUnifiedClient {
    private httpClient?;
    private config;
    private initialized;
    private currentMode;
    constructor();
    initialize(): Promise<void>;
    healthCheck(): Promise<{
        connected: boolean;
        status?: any;
    }>;
    httpHealthCheck(): Promise<{
        connected: boolean;
        status?: any;
    }>;
    stdioHealthCheck(): Promise<{
        connected: boolean;
        status?: any;
    }>;
    listTools(): Promise<string[]>;
    getStdioTools(): string[];
    executeTool(toolName: string, parameters?: any): Promise<ToolExecutionResult>;
    executeHttpTool(toolName: string, parameters?: any): Promise<any>;
    executeStdioTool(toolName: string, parameters?: any): Promise<any>;
    executePreCompiledScript(scriptFile: string, parameters?: any, toolName?: string): Promise<any>;
    buildProject(): Promise<boolean>;
    executeJavaScriptFile(scriptPath: string, parameters?: any, toolName?: string): Promise<any>;
    extractExecutionMetrics(output: string): any;
    prepareScriptArgs(parameters: any, toolName?: string): string[];
    getServerUrl(): string;
    getServerStatus(): Promise<ServerStatus>;
}
export declare const zkPretUnifiedClient: ZKPretUnifiedClient;
export {};
//# sourceMappingURL=zkPretUnifiedClient.d.ts.map