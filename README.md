# funlang

A toy functional programming language built with Go. Inspired by "Writing An Interpreter In Go", but extend with types.

[Читать на русском языке](./README.ru.md)

## Key Features
- **Interpreter**: Fast execution with Tail Call Optimization (TCO).
- **LSP Support**: Smart autocompletion, go-to-definition, and hover information.
- **VS Code Extension**: Integration with LSP server.
- **Formatter**: Built-in code style enforcement.

## Installation
1. Download the binary from [Releases](https://github.com/PrsMik/funlang/releases).
2. Install the VS Code extension (`.vsix`) from this repo.
3. Set the path to the interpreter in VS Code settings.

## Quick Start
```funlang
let add: fn(int, int) -> int = fn(a, b) {
    return a + b;
};

let res: int = puts(add(5, 10)); 
```