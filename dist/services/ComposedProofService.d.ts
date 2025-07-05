import { ComposedProofRequest, ComposedProofResult, ComposedProofExecution, CompositionTemplate } from '../types/composedProofs.js';
declare class ComposedProofService {
    private executions;
    private cache;
    private templates;
    constructor();
    private initializeBuiltInTemplates;
    private startCacheCleanup;
    executeComposedProof(request: ComposedProofRequest): Promise<ComposedProofResult>;
    private validateDependencies;
    private checkCircularDependencies;
    private executeComponents;
    private executeComponent;
    private interpolateCacheKey;
    private calculateBackoffDelay;
    private aggregateResults;
    private countParallelExecutions;
    getTemplates(): CompositionTemplate[];
    getTemplate(templateId: string): CompositionTemplate | undefined;
    addTemplate(template: CompositionTemplate): void;
    private validateTemplate;
    getExecution(executionId: string): ComposedProofExecution | undefined;
    getCacheStats(): {
        size: number;
        hits: number;
        entries: any[];
    };
    clearCache(): void;
}
export declare const composedProofService: ComposedProofService;
export {};
//# sourceMappingURL=ComposedProofService.d.ts.map