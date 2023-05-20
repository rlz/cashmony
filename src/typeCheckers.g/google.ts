import typia from 'typia';
import { type GoogleOpsDeletedRow, type GoogleOpsExtRow, type GoogleOpsInitRow } from "../google/googleDataSchema";
import { type RowsType } from "../google/loadOperations";
import { type PutReplyBody, type ClearReplyBody } from "../google/storeOperations";
export const isGoogleOpsInitRow = (input: any): input is GoogleOpsInitRow => {
    return Array.isArray(input) && (8 <= input.length && 10 >= input.length && "string" === typeof input[0] && ("adjustment" === input[1] || "transfer" === input[1] || "income" === input[1] || "expense" === input[1]) && "number" === typeof input[2] && "number" === typeof input[3] && "number" === typeof input[4] && "string" === typeof input[5] && "string" === typeof input[6] && "number" === typeof input[7] && (undefined === input[8] || "string" === typeof input[8]) && (undefined === input[9] || "string" === typeof input[9]));
};
export const assertGoogleOpsInitRow = (input: any): GoogleOpsInitRow => {
    const $guard = (typia.createAssert as any).guard;
    const __is = (input: any): input is GoogleOpsInitRow => {
        return Array.isArray(input) && (8 <= input.length && 10 >= input.length && "string" === typeof input[0] && ("adjustment" === input[1] || "transfer" === input[1] || "income" === input[1] || "expense" === input[1]) && "number" === typeof input[2] && "number" === typeof input[3] && "number" === typeof input[4] && "string" === typeof input[5] && "string" === typeof input[6] && "number" === typeof input[7] && (undefined === input[8] || "string" === typeof input[8]) && (undefined === input[9] || "string" === typeof input[9]));
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is GoogleOpsInitRow => {
            return (Array.isArray(input) || $guard(true, {
                path: _path + "",
                expected: "[string, (\"adjustment\" | \"expense\" | \"income\" | \"transfer\"), number, number, number, string, string, number, (string | undefined), (string | undefined)]",
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
            })));
        })(input, "$input", true);
    return input;
};
export const isGoogleOpsDeletedRow = (input: any): input is GoogleOpsDeletedRow => {
    return Array.isArray(input) && (input.length === 2 && "string" === typeof input[0] && "deleted" === input[1]);
};
export const assertGoogleOpsExtRow = (input: any): GoogleOpsExtRow => {
    const $guard = (typia.createAssert as any).guard;
    const __is = (input: any): input is GoogleOpsExtRow => {
        return Array.isArray(input) && (input.length === 8 && "string" === typeof input[0] && "" === input[1] && "" === input[2] && "" === input[3] && "" === input[4] && "" === input[5] && "string" === typeof input[6] && "number" === typeof input[7]);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is GoogleOpsExtRow => {
            return (Array.isArray(input) || $guard(true, {
                path: _path + "",
                expected: "[string, \"\", \"\", \"\", \"\", \"\", string, number]",
                value: input
            })) && ((input.length === 8 || $guard(true, {
                path: _path + "",
                expected: "[string, \"\", \"\", \"\", \"\", \"\", string, number]",
                value: input
            })) && ("string" === typeof input[0] || $guard(true, {
                path: _path + "[0]",
                expected: "string",
                value: input[0]
            })) && ("" === input[1] || $guard(true, {
                path: _path + "[1]",
                expected: "\"\"",
                value: input[1]
            })) && ("" === input[2] || $guard(true, {
                path: _path + "[2]",
                expected: "\"\"",
                value: input[2]
            })) && ("" === input[3] || $guard(true, {
                path: _path + "[3]",
                expected: "\"\"",
                value: input[3]
            })) && ("" === input[4] || $guard(true, {
                path: _path + "[4]",
                expected: "\"\"",
                value: input[4]
            })) && ("" === input[5] || $guard(true, {
                path: _path + "[5]",
                expected: "\"\"",
                value: input[5]
            })) && ("string" === typeof input[6] || $guard(true, {
                path: _path + "[6]",
                expected: "string",
                value: input[6]
            })) && ("number" === typeof input[7] || $guard(true, {
                path: _path + "[7]",
                expected: "number",
                value: input[7]
            })));
        })(input, "$input", true);
    return input;
};
export const assertRowsType = (input: any): RowsType => {
    const $guard = (typia.createAssert as any).guard;
    const __is = (input: any): input is RowsType => {
        const $io0 = (input: any): boolean => Array.isArray(input.values);
        return "object" === typeof input && null !== input && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is RowsType => {
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => Array.isArray(input.values) || $guard(_exceptionable, {
                path: _path + ".values",
                expected: "Array<any>",
                value: input.values
            });
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "RowsType",
                value: input
            })) && $ao0(input, _path + "", true);
        })(input, "$input", true);
    return input;
};
export const assertClearReplyBody = (input: any): ClearReplyBody => {
    const $guard = (typia.createAssert as any).guard;
    const __is = (input: any): input is ClearReplyBody => {
        return "object" === typeof input && null !== input && ("string" === typeof input.clearedRange && "string" === typeof input.spreadsheetId);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is ClearReplyBody => {
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
            })) && $ao0(input, _path + "", true);
        })(input, "$input", true);
    return input;
};
export const assertPutReplyBody = (input: any): PutReplyBody => {
    const $guard = (typia.createAssert as any).guard;
    const __is = (input: any): input is PutReplyBody => {
        const $io0 = (input: any): boolean => "string" === typeof input.spreadsheetId && ("number" === typeof input.updatedCells && parseInt(input.updatedCells) === input.updatedCells && 0 <= input.updatedCells) && ("number" === typeof input.updatedColumns && parseInt(input.updatedColumns) === input.updatedColumns && 0 <= input.updatedColumns) && "string" === typeof input.updatedRange && ("number" === typeof input.updatedRows && parseInt(input.updatedRows) === input.updatedRows && 0 <= input.updatedRows);
        return "object" === typeof input && null !== input && $io0(input);
    };
    if (false === __is(input))
        ((input: any, _path: string, _exceptionable: boolean = true): input is PutReplyBody => {
            const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.spreadsheetId || $guard(_exceptionable, {
                path: _path + ".spreadsheetId",
                expected: "string",
                value: input.spreadsheetId
            })) && ("number" === typeof input.updatedCells && (parseInt(input.updatedCells) === input.updatedCells || $guard(_exceptionable, {
                path: _path + ".updatedCells",
                expected: "number (@type uint)",
                value: input.updatedCells
            })) && (0 <= input.updatedCells || $guard(_exceptionable, {
                path: _path + ".updatedCells",
                expected: "number (@type uint)",
                value: input.updatedCells
            })) || $guard(_exceptionable, {
                path: _path + ".updatedCells",
                expected: "number",
                value: input.updatedCells
            })) && ("number" === typeof input.updatedColumns && (parseInt(input.updatedColumns) === input.updatedColumns || $guard(_exceptionable, {
                path: _path + ".updatedColumns",
                expected: "number (@type uint)",
                value: input.updatedColumns
            })) && (0 <= input.updatedColumns || $guard(_exceptionable, {
                path: _path + ".updatedColumns",
                expected: "number (@type uint)",
                value: input.updatedColumns
            })) || $guard(_exceptionable, {
                path: _path + ".updatedColumns",
                expected: "number",
                value: input.updatedColumns
            })) && ("string" === typeof input.updatedRange || $guard(_exceptionable, {
                path: _path + ".updatedRange",
                expected: "string",
                value: input.updatedRange
            })) && ("number" === typeof input.updatedRows && (parseInt(input.updatedRows) === input.updatedRows || $guard(_exceptionable, {
                path: _path + ".updatedRows",
                expected: "number (@type uint)",
                value: input.updatedRows
            })) && (0 <= input.updatedRows || $guard(_exceptionable, {
                path: _path + ".updatedRows",
                expected: "number (@type uint)",
                value: input.updatedRows
            })) || $guard(_exceptionable, {
                path: _path + ".updatedRows",
                expected: "number",
                value: input.updatedRows
            }));
            return ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "PutReplyBody",
                value: input
            })) && $ao0(input, _path + "", true);
        })(input, "$input", true);
    return input;
};
