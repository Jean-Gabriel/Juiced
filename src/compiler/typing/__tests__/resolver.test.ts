import { createTypeResolver } from "../resolver";
import { createTypeContext } from "../context";
import { CompilationHelper } from "../../../../test/compiler/helper";
import { createTestDiagnoticsReporter } from "../../../../test/diagnostic/reporter";

describe('Typechecker', () => {
    it('can invoke a function declared before and after invocator', () => {
        expectTypechecking(`
            returns_bool = fun (): bool {
                true;
            }

            a_bool = const returns_bool();
        `).succeeds();

        expectTypechecking(`
            a_bool = const returns_bool();

            returns_bool = fun (): bool {
                true;
            }
        `).succeeds();
    });

    it('can invoke a function with parameters', () => {
        expectTypechecking(`
            add = fun (a: int, b: int): int {
                a + b;
            }

            sum = const add(1, 2);
        `).succeeds();
    });

    it('cannot invoke a function with invalid number of parameters', () => {
        expectTypechecking(`
            add = fun (a: int, b: int): int {
                a + b;
            }

            sum = const add(1);
        `).errors(1);

        expectTypechecking(`
            add = fun (a: int, b: int): int {
                a + b;
            }

            sum = const add(1, 2, 3);
        `).errors(1);
    });

    it('cannot invoke a function with invalid parameters type', () => {
        expectTypechecking(`
            add = fun (a: int, b: int): int {
                a + b;
            }

            sum = const add(false, 1.0);
        `).errors(1);
    });

    it('cannot invoke a non-existent function ', () => {
        expectTypechecking(`
            var = const nonexistent();
        `).errors(1);
    });

    it('functions returns expression type must match their specified type', () => {
        expectTypechecking(`
            returns_bool = fun (): bool {
                true;
            }
        `).succeeds();

        expectTypechecking(`
            returns_bool = fun (): bool {
                1.0;
            }
        `).errors(1);
    });

    it('variable declarations in functions can refer to a variable of a higher scope', () => {
        expectTypechecking(`
            in_a_higher_scope = const 1.0;
            returns_higher_scope_val = fun (): float {
                in_a_higher_scope;
            }
        `).succeeds();
    });

    it('variable declarations in a lower scope cannot be accessed in a higher scope', () => {
        expectTypechecking(`
            function = fun (): float {
                lower_scope_val = const 1.0;
                1.0;
            }

            error = const lower_scope_val; 
        `).errors(1);
    });

    it('variable declarations should not reference undeclared variable', () => {
        expectTypechecking(`
            errors = const does_not_exists + 1; 
        `).errors(1);

        expectTypechecking(`
            references_undeclared_variable = fun (): float {
                errors = const does_not_exists;
                1.0;
            }
        `).errors(1);
    });

    it('expressions should use values or other expressions of same type', () => {
        expectTypechecking(`
            function = fun (float_val: float): float {
                other_float_val = const 1.0;

                float_val + other_float_val;
            }
        `).succeeds();

        expectTypechecking(`
            function = fun (float_val: float): float {
                int_val = const 1;
                bool_val = const false;

                float_val + bool_val + int_val;
            }
        `).errors(1);
    });

    it('shoud report every error it encounters', () => {
        expectTypechecking(`
            error = const does_not_exists;

            invalid_return_type = fun (): int {
                true;
            }
        `).errors(2);
    });

    const expectTypechecking = (module: string) => {
        const { tokenize, parse } = CompilationHelper;

        const ast = parse(tokenize(module));

        const reporter = createTestDiagnoticsReporter();
        const typechecker = createTypeResolver({
            createDiagnosticReporter: () => reporter,
            createTypeContext,
        });

        return {
            succeeds: () => {
                typechecker.resolve(ast);
                expect(reporter.errored()).toBeFalsy();
            },
            errors: (numberOfErrors: number) => {
                expect(() => typechecker.resolve(ast)).toThrowError();

                expect(reporter.errored()).toBeTruthy();
                expect(reporter.emit).toHaveBeenCalledTimes(numberOfErrors);
            }
        };
    };
});