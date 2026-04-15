const vscode = require('vscode');
const { LanguageClient } = require('vscode-languageclient/node');

let client;

async function setServerPath() {
    const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Choose interpreter binary path',
        filters: {
            'Executables': ['exe', 'bin', '']
        }
    });

    if (fileUri && fileUri[0]) {
        const newPath = fileUri[0].fsPath;

        await vscode.workspace.getConfiguration('funlang').update('serverPath', newPath, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`Path updated: ${newPath}`);
    }
}

async function startServer() {
    const config = vscode.workspace.getConfiguration('funlang');
    const serverPath = config.get('serverPath') || 'fun';

    console.log(`Starting FunLang LSP using path: ${serverPath}`);

    const serverOptions = {
        run: { command: serverPath, args: ['lsp', "--mode", "stdio"] },
        debug: { command: serverPath, args: ['lsp', "--mode", "stdio"] }
    };

    // const serverOptions = () => {
    //     const net = require('net');
    //     return new Promise((resolve) => {
    //         const socket = net.connect({ port: 5007 }, () => {
    //             resolve({ reader: socket, writer: socket });
    //         });
    //     });
    // };

    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'funlang' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.fun')
        }
    };

    client = new LanguageClient(
        'funlangLSP',
        'FunLang Language Server',
        serverOptions,
        clientOptions
    );

    try {
        await client.start();
        vscode.window.showInformationMessage('FunLang LSP Server started.');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to start FunLang LSP: ${error.message}`);
    }
}

async function restartServer() {
    if (client) {
        vscode.window.showInformationMessage('Restarting FunLang LSP Server...');
        await client.stop();
        client = undefined;
    }
    await startServer();
}

function activate(context) {
    console.log('Activating FunLang LSP...');

    const setPathCommand = vscode.commands.registerCommand('funlang.setServerPath', async () => {
        await setServerPath();
    });

    const restartCommand = vscode.commands.registerCommand('funlang.restartServer', async () => {
        await restartServer();
    });

    context.subscriptions.push(setPathCommand, restartCommand);

    const configListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('funlang.serverPath')) {
            vscode.window.showInformationMessage(
                'FunLang LSP configuration changed. Restart server?',
                'Yes', 'Later'
            ).then(selection => {
                if (selection === 'Yes') restartServer();
            });
        }
    });

    context.subscriptions.push(configListener);

    startServer();
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