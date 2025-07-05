export interface ProofComponent {
    id: string;
    toolName: string;
    parameters: any;
    dependencies?: string[];
    optional?: boolean;
    timeout?: number;
    cacheKey?: string;
}
export interface CompositionTemplate {
    id: string;
    name: string;
    description: string;
    version: string;
    components: ProofComponent[];
    aggregationLogic: AggregationLogic;
    metadata?: {
        category: string;
        tags: string[];
        author?: string;
        created: string;
        updated?: string;
    };
}
export interface AggregationLogic {
    type: 'ALL_REQUIRED' | 'MAJORITY' | 'WEIGHTED' | 'CUSTOM';
    threshold?: number;
    weights?: Record<string, number>;
    customLogic?: string;
}
export interface ComposedProofRequest {
    templateId?: string;
    customComposition?: {
        components: ProofComponent[];
        aggregationLogic: AggregationLogic;
    };
    globalParameters?: any;
    executionOptions?: {
        maxParallelism?: number;
        timeout?: number;
        enableCaching?: boolean;
        retryPolicy?: RetryPolicy;
    };
    requestId?: string;
}
export interface RetryPolicy {
    maxRetries: number;
    backoffStrategy: 'FIXED' | 'LINEAR' | 'EXPONENTIAL';
    backoffDelay: number;
    retryableErrors?: string[];
}
export interface ComposedProofResult {
    success: boolean;
    requestId: string;
    templateId?: string;
    executionId: string;
    overallVerdict: 'PASS' | 'FAIL' | 'PARTIAL' | 'ERROR';
    componentResults: ComponentResult[];
    aggregatedResult: {
        totalComponents: number;
        passedComponents: number;
        failedComponents: number;
        skippedComponents: number;
        aggregationScore?: number;
    };
    executionMetrics: {
        startTime: string;
        endTime: string;
        totalExecutionTime: string;
        parallelExecutions: number;
        cacheHits: number;
        retries: number;
    };
    metadata?: any;
    auditTrail: AuditEntry[];
}
export interface ComponentResult {
    componentId: string;
    toolName: string;
    status: 'PASS' | 'FAIL' | 'SKIPPED' | 'ERROR' | 'TIMEOUT';
    zkProofGenerated: boolean;
    executionTime: string;
    output?: string;
    error?: string;
    dependencies?: string[];
    cacheHit?: boolean;
    retryCount?: number;
    timestamp: string;
}
export interface AuditEntry {
    timestamp: string;
    action: string;
    componentId?: string;
    details: any;
    level: 'INFO' | 'WARN' | 'ERROR';
}
export interface ComposedProofExecution {
    id: string;
    requestId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    templateId?: string;
    components: ProofComponent[];
    progress: {
        total: number;
        completed: number;
        failed: number;
        running: number;
        pending: number;
    };
    results: ComponentResult[];
    startTime: string;
    estimatedCompletion?: string;
    currentPhase: string;
}
export interface ProofCache {
    cacheKey: string;
    result: ComponentResult;
    timestamp: string;
    expiresAt: string;
    hits: number;
}
export declare enum TemplateCategory {
    KYC_COMPLIANCE = "kyc-compliance",
    FINANCIAL_RISK = "financial-risk",
    BUSINESS_INTEGRITY = "business-integrity",
    REGULATORY_COMPLIANCE = "regulatory-compliance",
    CUSTOM = "custom"
}
export interface BuiltInTemplates {
    FULL_KYC: CompositionTemplate;
    FINANCIAL_RISK_ASSESSMENT: CompositionTemplate;
    BUSINESS_INTEGRITY_CHECK: CompositionTemplate;
    COMPREHENSIVE_COMPLIANCE: CompositionTemplate;
}
export interface ComposedProofExecutionResponse {
    success: boolean;
    executionId: string;
    requestId: string;
    status: string;
    estimatedCompletion?: string;
    progressUrl: string;
    resultUrl: string;
}
export interface ComposedProofStatusResponse {
    executionId: string;
    status: string;
    progress: {
        percentage: number;
        currentPhase: string;
        completedComponents: string[];
        runningComponents: string[];
        failedComponents: string[];
    };
    estimatedCompletion?: string;
    partialResults?: ComponentResult[];
}
export interface TemplateListResponse {
    templates: CompositionTemplate[];
    categories: string[];
    total: number;
}
export declare class ComposedProofError extends Error {
    code: string;
    componentId?: string | undefined;
    details?: any | undefined;
    constructor(message: string, code: string, componentId?: string | undefined, details?: any | undefined);
}
export declare class ComponentExecutionError extends ComposedProofError {
    originalError?: Error | undefined;
    constructor(message: string, componentId: string, originalError?: Error | undefined, details?: any);
}
export declare class DependencyError extends ComposedProofError {
    missingDependencies: string[];
    constructor(message: string, componentId: string, missingDependencies: string[], details?: any);
}
export declare class AggregationError extends ComposedProofError {
    constructor(message: string, details?: any);
}
//# sourceMappingURL=composedProofs.d.ts.map