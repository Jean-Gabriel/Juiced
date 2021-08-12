let errored = false;

const reset = () => {
    errored = false;
};

export const createTestDiagnoticsReporter = () => {
    reset();

    return {
        emit: jest.fn().mockImplementation(() => errored = true),
        report: jest.fn(),
        errored: () => errored
    };;
};