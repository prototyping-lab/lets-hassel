import * as vscode from "vscode";
import { loremIpsum } from "lorem-ipsum";

const fs = require("fs-extra");
const path = require("path");
const url = require("url");
const git = require("simple-git/promise");
const npm = require("npm-programmatic");
const mustache = require("mustache");

export function activate(context: vscode.ExtensionContext) {
    console.log(
        'Congratulations, your extension "lets-hassel-node-plugin" is now active!'
    );

    const workspaces = vscode.workspace.workspaceFolders;

    const workspace_path = workspaces ? workspaces[0].uri.fsPath : undefined;
    const extension_path = path.join(__dirname, "..");
    const templates_path = path.join(extension_path, "templates");

    let commandSetup = vscode.commands.registerCommand(
        "extension.setupNode",
        async () => {
            // make sure we really got a workspace
            if (workspace_path === undefined) {
                vscode.window.showErrorMessage(
                    "You have not yet opened a folder!"
                );
                return;
            }

            // show alert
            vscode.window.showInformationMessage("Setting up");

            // create src folder
            const src_dir = path.join(workspace_path, "src");
            if (!fs.existsSync(src_dir)) {
                fs.mkdirSync(src_dir);
            }

            // create empty index.js
            fs.closeSync(
                fs.openSync(path.join(workspace_path, "src", "index.js"), "w")
            );

            // ask for node version
            const nvm_version = await vscode.window.showInputBox({
                prompt: "Which Node.js version should be used?",
                placeHolder: "e.g. 13"
            });
            if (nvm_version === undefined) {
                vscode.window.showErrorMessage("Action canceled!");
                return;
            }

            // ask for author's name
            const author = await vscode.window.showInputBox({
                prompt: "Please enter the authors name."
            });
            if (author === undefined) {
                vscode.window.showErrorMessage("Action canceled!");
                return;
            }

            // create .nvmrc file
            fs.writeFileSync(
                path.join(workspace_path, ".nvmrc"),
                `v${nvm_version}`
            );

            // copy .gitignore template
            const cmd_templates = path.join(templates_path, "setupNode");
            fs.copySync(
                path.join(cmd_templates, "gitignore"),
                path.join(workspace_path, ".gitignore")
            );

            // create custom package.json (using the template file)
            const package_json = require(path.join(
                cmd_templates,
                "package.json"
            ));

            // set project name and author
            Object.assign(package_json, {
                name: path.basename(workspace_path),
                author
            });

            // write it to the target file
            fs.writeFileSync(
                path.join(workspace_path, "package.json"),
                JSON.stringify(package_json, null, 4)
            );

            // create custom eslint.json (using the template file)
            const eslintrc_json = require(path.join(
                cmd_templates,
                "eslintrc.json"
            ));

            // potentially insert some data  here ...

            // write it to the target file
            fs.writeFileSync(
                path.join(workspace_path, ".eslintrc.json"),
                JSON.stringify(eslintrc_json, null, 4)
            );

            // init git repo
            await git().init();

            // install eslint
            await npm.install(["eslint"], {
                cwd: workspace_path,
                saveDev: true
            });
        }
    );

    let commandloremIpsumWord = vscode.commands.registerCommand(
        "extension.loremIpsumWord",
        async () => {
            const count = await vscode.window.showInputBox({
                prompt: "How many words should be generated?"
            });
            if (String(count) === "undefined") {
                vscode.window.showErrorMessage("Action canceled!");
                return;
            }

            if (vscode.window.activeTextEditor) {
                let editor = vscode.window.activeTextEditor;
                let document = editor.document;
                let selection = editor.selection;

                // 1) Get the configured glob pattern value for the current file
                const format: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.format");
                const paragraphLowerBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.minSentencePerParagraph");
                const paragraphUpperBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.maxSentencePerParagraph");
                const sentenceLowerBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.minWordsPerSentence");
                const sentenceUpperBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.maxWordsPerSentence");

                const text = loremIpsum({
                    count: Number(count), // Number of "words", "sentences", or "paragraphs"
                    format: format, // "plain" or "html"
                    paragraphLowerBound: paragraphLowerBound, // Min. number of sentences per paragraph.
                    paragraphUpperBound: paragraphUpperBound, // Max. number of sentences per paragarph.
                    sentenceLowerBound: sentenceLowerBound, // Min. number of words per sentence.
                    sentenceUpperBound: sentenceUpperBound, // Max. number of words per sentence.
                    units: "words" // paragraph(s), "sentence(s)", or "word(s)"
                });

                editor.edit(editBuilder => {
                    if (editor.selection.isEmpty) {
                        // the Position object gives you the line and character where the cursor is
                        const position = editor.selection.active;
                        editBuilder.insert(position, text);
                    } else {
                        editBuilder.replace(selection, text);
                    }
                });
            }
        }
    );

    let commandloremIpsumSentence = vscode.commands.registerCommand(
        "extension.loremIpsumSentence",
        async () => {
            const count = await vscode.window.showInputBox({
                prompt: "How many sentences should be generated?"
            });
            if (String(count) === "undefined") {
                vscode.window.showErrorMessage("Action canceled!");
                return;
            }
            if (vscode.window.activeTextEditor) {
                let editor = vscode.window.activeTextEditor;
                let document = editor.document;
                let selection = editor.selection;

                // 1) Get the configured glob pattern value for the current file
                const format: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.format");
                const paragraphLowerBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.minSentencePerParagraph");
                const paragraphUpperBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.maxSentencePerParagraph");
                const sentenceLowerBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.minWordsPerSentence");
                const sentenceUpperBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.maxWordsPerSentence");

                const text = loremIpsum({
                    count: Number(count), // Number of "words", "sentences", or "paragraphs"
                    format: format, // "plain" or "html"
                    paragraphLowerBound: paragraphLowerBound, // Min. number of sentences per paragraph.
                    paragraphUpperBound: paragraphUpperBound, // Max. number of sentences per paragarph.
                    sentenceLowerBound: sentenceLowerBound, // Min. number of words per sentence.
                    sentenceUpperBound: sentenceUpperBound, // Max. number of words per sentence.
                    units: "sentences" // paragraph(s), "sentence(s)", or "word(s)"
                });

                editor.edit(editBuilder => {
                    if (editor.selection.isEmpty) {
                        // the Position object gives you the line and character where the cursor is
                        const position = editor.selection.active;
                        editBuilder.insert(position, text);
                    } else {
                        editBuilder.replace(selection, text);
                    }
                });
            }
        }
    );

    let commandloremIpsunParagraph = vscode.commands.registerCommand(
        "extension.loremIpsunParagraph",
        async () => {
            const count = await vscode.window.showInputBox({
                prompt: "How many paragraphs should be generated?"
            });
            if (String(count) === "undefined") {
                vscode.window.showErrorMessage("Action canceled!");
                return;
            }

            if (vscode.window.activeTextEditor) {
                let editor = vscode.window.activeTextEditor;
                let document = editor.document;
                let selection = editor.selection;

                // 1) Get the configured glob pattern value for the current file
                const format: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.format");
                const paragraphLowerBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.minSentencePerParagraph");
                const paragraphUpperBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.maxSentencePerParagraph");
                const sentenceLowerBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.minWordsPerSentence");
                const sentenceUpperBound: any = vscode.workspace
                    .getConfiguration("", document.uri)
                    .get("Let'sHassel.loremIpsum.maxWordsPerSentence");

                const text = loremIpsum({
                    count: Number(count), // Number of "words", "sentences", or "paragraphs"
                    format: format, // "plain" or "html"
                    paragraphLowerBound: paragraphLowerBound, // Min. number of sentences per paragraph.
                    paragraphUpperBound: paragraphUpperBound, // Max. number of sentences per paragarph.
                    sentenceLowerBound: sentenceLowerBound, // Min. number of words per sentence.
                    sentenceUpperBound: sentenceUpperBound, // Max. number of words per sentence.
                    units: "paragraphs" // paragraph(s), "sentence(s)", or "word(s)"
                });

                editor.edit(editBuilder => {
                    if (editor.selection.isEmpty) {
                        // the Position object gives you the line and character where the cursor is
                        const position = editor.selection.active;
                        editBuilder.insert(position, text);
                    } else {
                        editBuilder.replace(selection, text);
                    }
                });
            }
        }
    );

    let commandWssCreateFiles = vscode.commands.registerCommand(
        "extension.wssCreateFiles",
        async () => {
            // make sure we really got a workspace
            if (workspace_path === undefined) {
                vscode.window.showErrorMessage(
                    "You have not yet opened a folder!"
                );
                return;
            }

            // get the configured glob pattern value for the current file
            const filename = vscode.workspace
                .getConfiguration()
                .get("Let'sHassel.wss.filename");
            const filenumber: any = vscode.workspace
                .getConfiguration()
                .get("Let'sHassel.wss.filenumber");
            const title = vscode.workspace
                .getConfiguration()
                .get("Let'sHassel.wss.title");

            // template files
            const cmd_templates = path.join(templates_path, "wssCreateFiles");

            // create empty css file
            const style = `style${filenumber}.css`;
            fs.closeSync(fs.openSync(path.join(workspace_path, style), "w"));

            // create html from mustache template
            const html_template = fs.readFileSync(
                path.join(cmd_templates, "index.html"),
                "utf8"
            );

            console.log(html_template);

            const html_out = mustache.render(html_template, {
                title,
                style,
                content: ""
            });

            // create html file
            const html = `${filename}${filenumber}.html`;
            fs.writeFileSync(path.join(workspace_path, html), html_out);

            // increment filenumber
            await vscode.workspace
                .getConfiguration()
                .update(
                    "Let'sHassel.wss.filenumber",
                    filenumber + 1,
                    vscode.ConfigurationTarget.Global
                );

            // show the generated html
            const uri = url.pathToFileURL(path.join(workspace_path, html));
            const editor = await vscode.window.showTextDocument(
                vscode.Uri.parse(uri)
            );

            // jump right into the document
            const range = editor.document.lineAt(8).range;
            editor.selection = new vscode.Selection(range.end, range.end);

            // let the coding begin!
            vscode.window.showInformationMessage("Happy coding ...");

            // jump right into the window, onde it is available
            const subscription = vscode.window.onDidChangeActiveTextEditor(
                () => {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        subscription.dispose();
                    } else {
                        vscode.window.showInformationMessage("Hmpf !!!");
                    }
                }
            );
        }
    );

    context.subscriptions.push(
        commandSetup,
        commandloremIpsumWord,
        commandloremIpsumSentence,
        commandloremIpsunParagraph,
        commandWssCreateFiles
    );
}

export function deactivate() {}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
