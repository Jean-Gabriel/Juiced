let errored = false;
const reporter = {
    emit: jest.fn().mockImplementation(() => errored = true),
    report: jest.fn(),
    errored: () => errored
};

const reset = () => {
    errored = false;
};

export const createTestDiagnoticsReporter = () => {
    reset();

    return reporter;
};