import type * as monacoNs from "monaco-editor";

// A self-contained Verilog/SystemVerilog Monarch tokenizer + language
// configuration, registered under the id `stivium-verilog`.
//
// Why this exists here and not in `src/lsp/registry.ts`: the main Monaco
// editor currently registers "verilog" as a language id (see
// `getLanguage()` in `src/utils/editor.ts`) but — as inspection of this
// codebase showed — never actually calls `setMonarchTokensProvider` for
// it, so `.v`/`.sv` files in the editor itself render as plain
// (unhighlighted) text today. Fixing that editor-wide is a separate,
// pre-existing gap outside this feature's scope (see the AI workspace
// patch guide's "Out of scope" note). This module instead registers its
// *own* language id purely so `monaco.editor.colorize()` — used only by
// AI chat code blocks — has real Verilog/SystemVerilog tokenization to
// call into, without touching the shared editor language registry that
// every other Stivium file depends on.
const LANGUAGE_ID = "stivium-verilog";

let registered = false;

const KEYWORDS = [
  // Module/port structure
  "module",
  "endmodule",
  "macromodule",
  "primitive",
  "endprimitive",
  "interface",
  "endinterface",
  "program",
  "endprogram",
  "package",
  "endpackage",
  "input",
  "output",
  "inout",
  "ref",
  // Data types
  "wire",
  "reg",
  "logic",
  "bit",
  "byte",
  "shortint",
  "int",
  "longint",
  "integer",
  "time",
  "real",
  "realtime",
  "shortreal",
  "signed",
  "unsigned",
  "genvar",
  "string",
  "void",
  "chandle",
  "event",
  "struct",
  "union",
  "typedef",
  "enum",
  "packed",
  "tri",
  "tri0",
  "tri1",
  "wand",
  "wor",
  "supply0",
  "supply1",
  // Procedural
  "always",
  "always_comb",
  "always_ff",
  "always_latch",
  "initial",
  "final",
  "assign",
  "force",
  "release",
  "deassign",
  "begin",
  "end",
  "fork",
  "join",
  "join_any",
  "join_none",
  "if",
  "else",
  "case",
  "casez",
  "casex",
  "endcase",
  "default",
  "for",
  "while",
  "do",
  "repeat",
  "forever",
  "foreach",
  "break",
  "continue",
  "return",
  "function",
  "endfunction",
  "task",
  "endtask",
  "automatic",
  "static",
  "parameter",
  "localparam",
  "specparam",
  "defparam",
  "generate",
  "endgenerate",
  "genvar",
  "class",
  "endclass",
  "extends",
  "implements",
  "virtual",
  "pure",
  "new",
  "this",
  "super",
  "local",
  "protected",
  "public",
  "posedge",
  "negedge",
  "edge",
  "wait",
  "wait_order",
  "unique",
  "unique0",
  "priority",
  "inside",
  "dist",
  "assert",
  "assume",
  "cover",
  "restrict",
  "property",
  "endproperty",
  "sequence",
  "endsequence",
  "clocking",
  "endclocking",
  "modport",
  "import",
  "export",
  "context",
  "pure",
  "instance",
  "bind",
  "config",
  "endconfig",
  "constraint",
  "randomize",
  "rand",
  "randc",
  "solve",
  "before",
];

const OPERATORS = [
  "=",
  "+",
  "-",
  "*",
  "/",
  "%",
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "&&",
  "||",
  "!",
  "&",
  "|",
  "^",
  "~",
  "~&",
  "~|",
  "~^",
  "^~",
  "<<",
  ">>",
  "<<<",
  ">>>",
  "?",
  ":",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "&=",
  "|=",
  "^=",
  "<<=",
  ">>=",
  "++",
  "--",
  "->",
  "<->",
];

function ensureVerilogLanguageRegistered(monaco: typeof monacoNs): void {
  if (registered) return;
  registered = true;

  const exists = monaco.languages
    .getLanguages()
    .some((entry) => entry.id === LANGUAGE_ID);
  if (exists) return;

  monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: [],
    aliases: ["Verilog", "SystemVerilog"],
  });

  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, {
    comments: { lineComment: "//", blockComment: ["/*", "*/"] },
    brackets: [
      ["begin", "end"],
      ["(", ")"],
      ["[", "]"],
      ["{", "}"],
    ],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: "{", close: "}" },
      { open: '"', close: '"' },
    ],
  });

  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, {
    defaultToken: "",
    tokenPostfix: ".sv",
    keywords: KEYWORDS,
    operators: OPERATORS,
    symbols: /[=><!~?:&|+\-*/^%]+/,

    tokenizer: {
      root: [
        // Compiler directives: `timescale, `define, `include, `ifdef, ...
        [/`[a-zA-Z_]\w*/, "keyword.directive"],

        // Identifiers / keywords
        [
          /[a-zA-Z_$][\w$]*/,
          { cases: { "@keywords": "keyword", "@default": "identifier" } },
        ],

        { include: "@whitespace" },

        // Sized numeric literals: 8'hFF, 4'b1010, 16'd255, '0, '1, 'x, 'z
        [/\d*'[sS]?[bBoOdDhH][0-9a-fA-Fx_zZ?]+/, "number.hex"],
        [/\d+\.\d+([eE][-+]?\d+)?/, "number.float"],
        [/\d+/, "number"],

        // Strings
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

        [/[{}()[\]]/, "@brackets"],
        [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],
      ],

      whitespace: [
        [/[ \t\r\n]+/, ""],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"],
      ],

      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],

      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],
    },
  });
}

/**
 * Maps a fenced-code-block language tag (as written by the model, e.g.
 * "verilog", "sv", "systemverilog", "js") to a Monaco language id that
 * `monaco.editor.colorize()` can tokenize. Registers the Verilog
 * tokenizer lazily, on first use, rather than at module load — colorize
 * calls only ever happen once a code fence actually closes, so there's
 * no cost paid unless the AI panel is used and Verilog is actually the
 * language in a response.
 */
export function resolveColorizeLanguage(
  monaco: typeof monacoNs,
  rawLang: string,
): string {
  const normalized = rawLang.trim().toLowerCase();

  if (
    normalized === "verilog" ||
    normalized === "systemverilog" ||
    normalized === "sv" ||
    normalized === "v"
  ) {
    ensureVerilogLanguageRegistered(monaco);
    return LANGUAGE_ID;
  }

  if (!normalized) return "plaintext";

  const aliasMap: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    tsx: "typescript",
    jsx: "javascript",
    py: "python",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    yml: "yaml",
    md: "markdown",
    rs: "rust",
    c: "cpp",
    "c++": "cpp",
    "objective-c": "objective-c",
  };
  const candidate = aliasMap[normalized] ?? normalized;

  const known = monaco.languages
    .getLanguages()
    .some((entry) => entry.id === candidate);
  return known ? candidate : "plaintext";
}
