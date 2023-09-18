import typia from 'typia';
import { type GoogleAccountRow, type GoogleDeletedOperationRow, type GoogleNonDeletedOperationRow, type GoogleOperationCategoryRow } from "../google/googleDataSchema";
import { type RowsType } from "../google/load";
import { type ClearReplyBody, type PutReplyBody } from "../google/store";
export const isGoogleNonDeletedOperationRow = (input: any): input is GoogleNonDeletedOperationRow => {
    return Array.isArray(input) && (8 <= input.length && 10 >= input.length && "string" === typeof input[0] && ("adjustment" === input[1] || "transfer" === input[1] || "income" === input[1] || "expense" === input[1]) && "number" === typeof input[2] && "number" === typeof input[3] && "number" === typeof input[4] && "string" === typeof input[5] && "string" === typeof input[6] && "number" === typeof input[7] && (undefined === input[8] || "string" === typeof input[8]) && (undefined === input[9] || "string" === typeof input[9]));
};
export const assertGoogleNonDeletedOperationRow = (input: any): GoogleNonDeletedOperationRow => {
    const __is = (input: any): input is GoogleNonDeletedOperationRow => {
        return Array.isArray(input) && (8 <= input.length && 10 >= input.length && "string" === typeof input[0] && ("adjustment" === input[1] || "transfer" === input[1] || "income" === input[1] || "expense" === input[1]) && "number" === typeof input[2] && "number" === typeof input[3] && "number" === typeof input[4] && "string" === typeof input[5] && "string" === typeof input[6] && "number" === typeof input[7] && (undefined === input[8] || "string" === typeof input[8]) && (undefined === input[9] || "string" === typeof input[9]));
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is GoogleNonDeletedOperationRow => {
            const $guard = (typia.createAssert as any).guard;
            return (Array.isArray(input) || $guard(true, {
                path: _path + "",
                expected: "GoogleNonDeletedOperationRow",
                value: input
            })) && ((8 <= input.length && 10 >= input.length || $guard(true, {
                path: _path + "",
                expected: "[string, (\"adjustment\" | \"expense\" | \"income\" | \"transfer\"), number, number, number, string, string, number, (string | undefined), (string | undefined)]",
                value: input
            })) && ("string" === typeof input[0] || $guard(true, {
                path: _path + "[0]",
                expected: "string",
                value: input[0]
            })) && ("adjustment" === input[1] || "transfer" === input[1] || "income" === input[1] || "expense" === input[1] || $guard(true, {
                path: _path + "[1]",
                expected: "(\"adjustment\" | \"expense\" | \"income\" | \"transfer\")",
                value: input[1]
            })) && ("number" === typeof input[2] || $guard(true, {
                path: _path + "[2]",
                expected: "number",
                value: input[2]
            })) && ("number" === typeof input[3] || $guard(true, {
                path: _path + "[3]",
                expected: "number",
                value: input[3]
            })) && ("number" === typeof input[4] || $guard(true, {
                path: _path + "[4]",
                expected: "number",
                value: input[4]
            })) && ("string" === typeof input[5] || $guard(true, {
                path: _path + "[5]",
                expected: "string",
                value: input[5]
            })) && ("string" === typeof input[6] || $guard(true, {
                path: _path + "[6]",
                expected: "string",
                value: input[6]
            })) && ("number" === typeof input[7] || $guard(true, {
                path: _path + "[7]",
                expected: "number",
                value: input[7]
            })) && (undefined === input[8] || "string" === typeof input[8] || $guard(true, {
                path: _path + "[8]",
                expected: "(string | undefined)",
                value: input[8]
            })) && (undefined === input[9] || "string" === typeof input[9] || $guard(true, {
                path: _path + "[9]",
                expected: "(string | undefined)",
                value: input[9]
            }))) || $guard(true, {
                path: _path + "",
                expected: "GoogleNonDeletedOperationRow",
                value: input
            });
        })(input, "$input", true);
    return input;
};
export const isGoogleDeletedOperationRow = (input: any): input is GoogleDeletedOperationRow => {
    return Array.isArray(input) && (input.length === 2 && "string" === typeof input[0] && "deleted" === input[1]);
};
export const isGoogleOperationCategoryRow = (input: any): input is GoogleOperationCategoryRow => {
    return Array.isArray(input) && (input.length === 3 && "string" === typeof input[0] && "string" === typeof input[1] && "number" === typeof input[2]);
};
export const isGoogleAccountRow = (input: any): input is GoogleAccountRow => {
    return Array.isArray(input) && (4 <= input.length && 5 >= input.length && "string" === typeof input[0] && "string" === typeof input[1] && "number" === typeof input[2] && ("yes" === input[3] || "no" === input[3]) && (undefined === input[4] || "yes" === input[4] || "no" === input[4]));
};
export const assertRowsType = (input: any): RowsType => {
    const __is = (input: any): input is RowsType => {
        const $io0 = (input: any): boolean => undefined === input.values || Array.isArray(input.values);
        return "object" === typeof input && null !== input && false === Array.isArray(input) && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is RowsType => {
            const $guard = (typia.createAssert as any).guard;
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => undefined === input.values || Array.isArray(input.values) || $guard(_exceptionable, {
                path: _path + ".values",
                expected: "(Array<unknown> | undefined)",
                value: input.values
            });
            return ("object" === typeof input && null !== input && false === Array.isArray(input) || $guard(true, {
                path: _path + "",
                expected: "RowsType",
                value: input
            })) && $ao0(input, _path + "", true) || $guard(true, {
                path: _path + "",
                expected: "RowsType",
                value: input
            });
        })(input, "$input", true);
    return input;
};
export const assertClearReplyBody = (input: any): ClearReplyBody => {
    const __is = (input: any): input is ClearReplyBody => {
        return "object" === typeof input && null !== input && ("string" === typeof (input as any).clearedRange && "string" === typeof (input as any).spreadsheetId);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is ClearReplyBody => {
            const $guard = (typia.createAssert as any).guard;
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.clearedRange || $guard(_exceptionable, {
                path: _path + ".clearedRange",
                expected: "string",
                value: input.clearedRange
            })) && ("string" === typeof input.spreadsheetId || $guard(_exceptionable, {
                path: _path + ".spreadsheetId",
                expected: "string",
                value: input.spreadsheetId
            }));
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "ClearReplyBody",
                value: input
            })) && $ao0(input, _path + "", true) || $guard(true, {
                path: _path + "",
                expected: "ClearReplyBody",
                value: input
            });
        })(input, "$input", true);
    return input;
};
export const assertPutReplyBody = (input: any): PutReplyBody => {
    const __is = (input: any): input is PutReplyBody => {
        return "object" === typeof input && null !== input && ("string" === typeof (input as any).spreadsheetId && ("number" === typeof (input as any).updatedCells && (Math.floor((input as any).updatedCells) === (input as any).updatedCells && 0 <= (input as any).updatedCells && (input as any).updatedCells <= 4294967295)) && ("number" === typeof (input as any).updatedColumns && (Math.floor((input as any).updatedColumns) === (input as any).updatedColumns && 0 <= (input as any).updatedColumns && (input as any).updatedColumns <= 4294967295)) && "string" === typeof (input as any).updatedRange && ("number" === typeof (input as any).updatedRows && (Math.floor((input as any).updatedRows) === (input as any).updatedRows && 0 <= (input as any).updatedRows && (input as any).updatedRows <= 4294967295)));
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is PutReplyBody => {
            const $guard = (typia.createAssert as any).guard;
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.spreadsheetId || $guard(_exceptionable, {
                path: _path + ".spreadsheetId",
                expected: "string",
                value: input.spreadsheetId
            })) && ("number" === typeof input.updatedCells && (Math.floor(input.updatedCells) === input.updatedCells && 0 <= input.updatedCells && input.updatedCells <= 4294967295 || $guard(_exceptionable, {
                path: _path + ".updatedCells",
                expected: "number & Type<\"uint32\">",
                value: input.updatedCells
            })) || $guard(_exceptionable, {
                path: _path + ".updatedCells",
                expected: "(number & Type<\"uint32\">)",
                value: input.updatedCells
            })) && ("number" === typeof input.updatedColumns && (Math.floor(input.updatedColumns) === input.updatedColumns && 0 <= input.updatedColumns && input.updatedColumns <= 4294967295 || $guard(_exceptionable, {
                path: _path + ".updatedColumns",
                expected: "number & Type<\"uint32\">",
                value: input.updatedColumns
            })) || $guard(_exceptionable, {
                path: _path + ".updatedColumns",
                expected: "(number & Type<\"uint32\">)",
                value: input.updatedColumns
            })) && ("string" === typeof input.updatedRange || $guard(_exceptionable, {
                path: _path + ".updatedRange",
                expected: "string",
                value: input.updatedRange
            })) && ("number" === typeof input.updatedRows && (Math.floor(input.updatedRows) === input.updatedRows && 0 <= input.updatedRows && input.updatedRows <= 4294967295 || $guard(_exceptionable, {
                path: _path + ".updatedRows",
                expected: "number & Type<\"uint32\">",
                value: input.updatedRows
            })) || $guard(_exceptionable, {
                path: _path + ".updatedRows",
                expected: "(number & Type<\"uint32\">)",
                value: input.updatedRows
            }));
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "PutReplyBody",
                value: input
            })) && $ao0(input, _path + "", true) || $guard(true, {
                path: _path + "",
                expected: "PutReplyBody",
                value: input
            });
        })(input, "$input", true);
    return input;
};
