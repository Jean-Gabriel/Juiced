export enum DiagnosticCategory {
    INFO = 'INFO',
    ERROR = 'ERROR'
}

export type Diagnostic = {
    message: string
    category: DiagnosticCategory
}

export interface DiagnosticReporter {
    emit: (diagnostic: Diagnostic) => void
    errored: () => boolean
}