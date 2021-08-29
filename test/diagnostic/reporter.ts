import type { DiagnosticReporterFactory } from "../../src/diagnostic/reporter";

let errored = false;

const reset = () => {
    errored = false;
};

export const createTestDiagnoticsReporter: DiagnosticReporterFactory = () => {
    reset();

    return {
        emit: jest.fn().mockImplementation(() => errored = true),
        report: jest.fn(),
        errored: () => errored
    };;
};