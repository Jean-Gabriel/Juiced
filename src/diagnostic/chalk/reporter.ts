import chalk from "chalk";
import type { Diagnostic as Diagnostic, DiagnosticReporter } from '../reporter';
import { DiagnosticCategory } from '../reporter';

export const createChalkDiagnosticReporter = (): DiagnosticReporter => new ChalkDiagnosticReporter();

const colors: { [key in DiagnosticCategory]: string } = {
    [DiagnosticCategory.INFO]: chalk.blueBright('[INFO]'),
    [DiagnosticCategory.ERROR]: chalk.redBright('[ERROR]')
};

class ChalkDiagnosticReporter implements DiagnosticReporter {
    private readonly diagnostics: Diagnostic[] = []

    emit(diagnostic: Diagnostic) {
        this.diagnostics.push(diagnostic);
        console.log(`${colors[diagnostic.category]}: ${diagnostic.message}`);
    };

    errored() {
        return this.diagnostics.some(d => d.category === DiagnosticCategory.ERROR);
    };
}