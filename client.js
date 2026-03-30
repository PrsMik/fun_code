const vscode = require('vscode');
const { LanguageClient } = require('vscode-languageclient/node');

let client;

function activate(context) {
    console.log('Activating FunLang LSP...');

    const serverCommand = 'D:\\Repo\\funlang\\fun.exe';

    const serverOptions = {
        run: { command: serverCommand, args: ['lsp'] },
        debug: { command: serverCommand, args: ['lsp'] }
    };

    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'funlang' }]
    };

    // Создаем LSP клиента
    client = new LanguageClient(
        'funlangLSP',
        'FunLang Language Server',
        serverOptions,
        clientOptions
    );

    // Запускаем клиента
    client.start();
}

function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

module.exports = {
    activate,
    deactivate
};