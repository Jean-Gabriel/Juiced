export enum DiagnosticCategory {
    ERROR = 'ERROR'
}

export type Diagnostic = {
    message: string
    category: DiagnosticCategory
}

export type DiagnosticReporterFactory = () => DiagnosticReporter

export interface DiagnosticReporter {
    emit: (diagnostic: Diagnostic) => void
    report: () => void;
    errored: () => boolean
}