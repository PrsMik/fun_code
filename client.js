const vscode = require('vscode');
const { LanguageClient } = require('vscode-languageclient/node');
const net = require('net');
const child_process = require('child_process');

let client;
let serverProcess;

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
    const serverPortStr = config.get('serverPort') || '127.0.0.1:5007';

    const [host, port] = serverPortStr.split(':');

    console.log(`Starting FunLang LSP using path: ${serverPath}`);

    const serverOptions = () => {
        return new Promise((resolve, reject) => {
            serverProcess = child_process.spawn(serverPath, [
                'lsp',
                '--mode', 'tcp',
                '--port', serverPortStr
            ]);

            serverProcess.stderr.on('data', (data) => {
                console.error(`LSP Server Error: ${data}`);
            });

            setTimeout(() => {
                const socket = net.connect({ host: host, port: parseInt(port) }, () => {
                    resolve({
                        reader: socket,
                        writer: socket
                    });
                });

                socket.on('error', (err) => {
                    reject(err);
                });
            }, 500);
        });
    };

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
        if (e.affectsConfiguration('funlang.serverPath') || e.affectsConfiguration('funlang.serverPort')) {
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

async function restartServer() {
    if (client) {
        vscode.window.showInformationMessage('Restarting FunLang LSP Server...');
        await client.stop();
        client = undefined;
    }

    if (serverProcess) {
        serverProcess.kill();
        serverProcess = undefined;
    }
    await startServer();
}

function deactivate() {
    if (serverProcess) serverProcess.kill();
    return client ? client.stop() : undefined;
}

module.exports = {
    activate,
    deactivate
};