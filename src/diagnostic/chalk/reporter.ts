import chalk from "chalk";
import type { Diagnostic as Diagnostic, DiagnosticReporter } from '../reporter';
import { DiagnosticCategory } from '../reporter';

export const createChalkDirectDiagnosticReporter = (): DiagnosticReporter => new ChalkDirectDiagnosticReporter();

const colors: { [key in DiagnosticCategory]: string } = {
    [DiagnosticCategory.ERROR]: chalk.redBright('[ERROR]')
};

class ChalkDirectDiagnosticReporter implements DiagnosticReporter {
    private readonly diagnostics: Diagnostic[] = []

    emit(diagnostic: Diagnostic) {
        this.diagnostics.push(diagnostic);
        console.log(`${colors[diagnostic.category]}: ${diagnostic.message}`);
    };

    errored() {
        return this.diagnostics.some(d => d.category === DiagnosticCategory.ERROR);
    };
}