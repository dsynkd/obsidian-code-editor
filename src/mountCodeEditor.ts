
import CodeFilesPlugin from "./main";
import * as monaco from 'monaco-editor'
import { genEditorSettings } from "./ObsidianUtils";
import { attachVimMode, MonacoVimAdapter, prepareMonacoHost } from "./monacoVim";


export class mountCodeEditor {
	contentEl: HTMLElement;
	value = "";
	monacoEditor: monaco.editor.IStandaloneCodeEditor;
	plugin: CodeFilesPlugin;
	private vimAdapter: MonacoVimAdapter | null = null;

	constructor(contentEl: HTMLElement, plugin: CodeFilesPlugin, code: string, language: string, miniMap: boolean = true, wordWrap: boolean = false) {
		this.contentEl = contentEl;
		this.plugin = plugin;
		this.value = code;

		let setting = genEditorSettings(this.plugin.settings, language, miniMap, wordWrap);
		const { host, statusBar } = prepareMonacoHost(contentEl, this.plugin.settings.vimMode);
		this.monacoEditor = monaco.editor.create(host, setting);
		this.monacoEditor.setValue(this.value);
		this.vimAdapter = attachVimMode(this.monacoEditor, statusBar);
	}

	getValue() {
		return this.monacoEditor.getValue();
	}

	dispose() {
		this.vimAdapter?.dispose();
		this.vimAdapter = null;
		this.monacoEditor.dispose();
	}

}
