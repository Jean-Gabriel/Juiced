export enum DiagnosticCategory {
    ERROR = 'ERROR'
}

export type  ErrorDiagnostic = {
    category: DiagnosticCategory.ERROR
    message: string
}

export type Diagnostic = ErrorDiagnostic

export const diagnostic = {
    error: (message: string): ErrorDiagnostic => ({ category: DiagnosticCategory.ERROR, message })
};

export type DiagnosticReporterFactory = () => DiagnosticReporter

export interface DiagnosticReporter {
    emit: (diagnostic: Diagnostic) => void
    report: () => void;
    errored: () => boolean
}