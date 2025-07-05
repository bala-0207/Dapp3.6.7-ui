import type { BlockchainState, StateComparison, ToolExecutionResult } from '../types/index.js';
declare class BlockchainStateService {
    /**
     * Mock function to simulate querying current blockchain state
     * In a real implementation, this would connect to the MINA blockchain
     * and query the GLEIFEnhancedVerifierSmartContractWithSign state
     */
    getCurrentState(): Promise<BlockchainState>;
    /**
     * Mock function to simulate querying blockchain state after GLEIF verification
     * In a real implementation, this would query the updated contract state
     */
    getPostExecutionState(beforeState: BlockchainState): Promise<BlockchainState>;
    /**
     * Compare two blockchain states and identify changes
     */
    compareStates(before: BlockchainState, after: BlockchainState): StateComparison;
    /**
     * Execute GLEIF verification with state tracking
     */
    executeWithStateTracking(toolName: string, parameters: any, executeTool: (toolName: string, parameters: any) => Promise<ToolExecutionResult>): Promise<{
        result: ToolExecutionResult;
        stateComparison: StateComparison;
    }>;
    /**
     * Format state for display in UI
     */
    formatStateForDisplay(state: BlockchainState): Record<string, any>;
    /**
     * Helper function to truncate long hashes for display
     */
    private truncateHash;
    /**
     * Helper function to truncate addresses for display
     */
    private truncateAddress;
    /**
     * Simulate blockchain query delay for realistic UX
     */
    private simulateBlockchainDelay;
}
export declare const blockchainStateService: BlockchainStateService;
export {};
//# sourceMappingURL=blockchainStateService.d.ts.map