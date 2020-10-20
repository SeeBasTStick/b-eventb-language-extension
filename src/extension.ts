import {
	workspace,
	ExtensionContext,
	window,
	TextEditor,
	StatusBarAlignment,
	OutputChannel
} from 'vscode';


import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	StreamInfo
} from 'vscode-languageclient';

import * as net from 'net';

import * as path from 'path'
import { spawn, spawnSync } from 'child_process';


let client: LanguageClient;
let debugChannle: OutputChannel = null;

export function activate(context: ExtensionContext) {

	const serverHome = context.asAbsolutePath(path.join('node_modules', 'b-language-server', 'build', 'libs', 'b-language-server-all.jar'))
	const javaHome: string = workspace.getConfiguration("common").get("javaHome")


	//Start the server
	// comment the two lines (and the closing brackets) if you want to run a server by hand -> for developing
	let prc = spawn(javaHome, ['-jar', serverHome])

	prc.stdout.on('data', function (data) {

		let connectionInfo = {
			port: 55555,
		}



		let serverOptions: ServerOptions = () => {
			let socket = net.connect(connectionInfo);
			let result: StreamInfo = {
				writer: socket,
				reader: socket
			};
			return Promise.resolve(result);
		}



		if (debugChannle == null) {
			debugChannle = window.createOutputChannel("ProB language server")
		}


		//debugChannle.appendLine("fs exits " + fs.existsSync(serverHome))
		// Options to control the language client
		let clientOptions: LanguageClientOptions = {
			// Register the server for B files
			documentSelector: [{ scheme: 'file', language: 'classicalb' }, { scheme: 'file', language: 'rmchAddOn' }],
			synchronize: {
				// Notify the server about file changes to '.clientrc files contained in the workspace
				fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
			},
			outputChannel: debugChannle,

		}

		// Create the language client and start the client.
		client = new LanguageClient('languageServer', 'languageServer', serverOptions, clientOptions)

		let item = window.createStatusBarItem(StatusBarAlignment.Right, Number.MIN_VALUE);

		debugChannle.appendLine("starting server: " + javaHome + " -jar " + serverHome)



		item.text = 'Starting ProB LSP...';
		toggleItem(window.activeTextEditor, item);

		// Start the clienServert. This will also launch the server
		let disposable = client.start();
		context.subscriptions.push(disposable);

		console.log( workspace.getConfiguration())
		console.log( workspace.getConfiguration("languageServer"))
		

		const debugMode: Boolean = workspace.getConfiguration("languageServer").get("debugMode")
		if (!debugMode) {
			debugChannle.hide()
		} else {
			debugChannle.show()
		}



		window.onDidOpenTerminal(() => {
			showDebugMessages(debugChannle)
		})

	})

}

function showDebugMessages(debugChannle: OutputChannel) {
	const debugMode: Boolean = workspace.getConfiguration("languageServer").get("debugMode")
	if (debugMode) {
		debugChannle.show()
	}
}


export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}


function toggleItem(editor: TextEditor, item) {
	if (editor && editor.document &&
		(editor.document.languageId === 'B')) {
		item.show();
	} else {
		item.hide();
	}
}




