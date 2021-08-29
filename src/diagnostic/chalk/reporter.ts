import chalk from "chalk";
import type { Diagnostic as Diagnostic, DiagnosticReporter, DiagnosticReporterFactory } from '../reporter';
import { DiagnosticCategory } from '../reporter';

export const createChalkDiagnosticReporter: DiagnosticReporterFactory = (): DiagnosticReporter => new ChalkDiagnosticReporter();

const colors: { [key in DiagnosticCategory]: string } = {
    [DiagnosticCategory.ERROR]: chalk.redBright('[ERROR]')
};

class ChalkDiagnosticReporter implements DiagnosticReporter {
    private readonly diagnostics: Diagnostic[] = []

    emit(diagnostic: Diagnostic) {
        this.diagnostics.push(diagnostic);
    };

    report() {
        if(!this.diagnostics.length) {
            return;
        }

        console.log(`Encoutered ${chalk.red(this.diagnostics.length)} errors.\n`);
        this.diagnostics.forEach(diagnostic => console.log(`${colors[diagnostic.category]}: ${diagnostic.message}`));
    }

    errored() {
        return this.diagnostics.some(d => d.category === DiagnosticCategory.ERROR);
    };
}