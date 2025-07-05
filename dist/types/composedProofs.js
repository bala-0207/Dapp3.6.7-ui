// Composed Proofs Type Definitions for ZK-PRET Compliance System
// Predefined template categories
export var TemplateCategory;
(function (TemplateCategory) {
    TemplateCategory["KYC_COMPLIANCE"] = "kyc-compliance";
    TemplateCategory["FINANCIAL_RISK"] = "financial-risk";
    TemplateCategory["BUSINESS_INTEGRITY"] = "business-integrity";
    TemplateCategory["REGULATORY_COMPLIANCE"] = "regulatory-compliance";
    TemplateCategory["CUSTOM"] = "custom";
})(TemplateCategory || (TemplateCategory = {}));
// Error types specific to composed proofs
export class ComposedProofError extends Error {
    code;
    componentId;
    details;
    constructor(message, code, componentId, details) {
        super(message);
        this.code = code;
        this.componentId = componentId;
        this.details = details;
        this.name = 'ComposedProofError';
    }
}
export class ComponentExecutionError extends ComposedProofError {
    originalError;
    constructor(message, componentId, originalError, details) {
        super(message, 'COMPONENT_EXECUTION_ERROR', componentId, details);
        this.originalError = originalError;
        this.name = 'ComponentExecutionError';
    }
}
export class DependencyError extends ComposedProofError {
    missingDependencies;
    constructor(message, componentId, missingDependencies, details) {
        super(message, 'DEPENDENCY_ERROR', componentId, details);
        this.missingDependencies = missingDependencies;
        this.name = 'DependencyError';
    }
}
export class AggregationError extends ComposedProofError {
    constructor(message, details) {
        super(message, 'AGGREGATION_ERROR', undefined, details);
        this.name = 'AggregationError';
    }
}
//# sourceMappingURL=composedProofs.js.map