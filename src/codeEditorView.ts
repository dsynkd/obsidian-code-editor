
import { TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { viewType } from "./common";
import CodeFilesPlugin from "./main";
import * as monaco from 'monaco-editor'
import { getLanguage, genEditorSettings } from "./ObsidianUtils";
import { attachVimMode, MonacoVimAdapter, prepareMonacoHost } from "./monacoVim";


export class CodeEditorView extends TextFileView {

	value = "";
	monacoEditor: monaco.editor.IStandaloneCodeEditor;
	private vimAdapter: MonacoVimAdapter | null = null;


	constructor(leaf: WorkspaceLeaf, private plugin: CodeFilesPlugin) {
		super(leaf);
	}

	/*
	execute order: onOpen -> onLoadFile -> setViewData -> onUnloadFile -> onClose
	*/
	async onOpen() {
		await super.onOpen();
	}

	async onLoadFile(file: TFile) {

		let setting = genEditorSettings(this.plugin.settings, this.file?.extension ?? "");
		const { host, statusBar } = prepareMonacoHost(this.contentEl, this.plugin.settings.vimMode);
		this.monacoEditor = monaco.editor.create(host, setting);
		this.vimAdapter = attachVimMode(this.monacoEditor, statusBar);

		this.monacoEditor.onDidChangeModelContent(() => {
			this.requestSave();
		});

		this.addCtrlKeyWheelEvents();
		this.addKeyEvents();

		// const model = this.monacoEditor.getModel();
		// monaco.editor.setModelLanguage(model, this.getLanguage());
		await super.onLoadFile(file);
	}

	async onUnloadFile(file: TFile) {
		window.removeEventListener('keydown', this.keyHandle, true);
		await super.onUnloadFile(file);
		this.vimAdapter?.dispose();
		this.vimAdapter = null;
		this.monacoEditor.dispose();
	}

	async onClose() {
		await super.onClose();
	}

	onResize() {
		this.monacoEditor.layout();
	}

	getViewType(): string {
		return viewType;
	}

	getContext(file?: TFile) {
		return file?.path ?? this.file?.path;
	}



	getViewData = () => {
		return this.monacoEditor.getValue();
	}

	setViewData = (data: string, clear: boolean) => {
		if (clear) {
			this.monacoEditor.getModel()?.setValue(data);
		} else {
			this.monacoEditor.setValue(data);
		}
	}
	clear = () => {
		this.monacoEditor.setValue('');
	}

	private addKeyEvents = () => {
		window.addEventListener('keydown', this.keyHandle, true);
	}

	private addCtrlKeyWheelEvents = () => {
		this.containerEl.addEventListener('wheel', this.mousewheelHandle, true);

	}

	/*
	修复不支持 `ctrl + 按键`快捷键的问题
	原因是obsidian在app.js中增加了全局的keydown并且useCapture为true，猜测可能是为了支持快捷键就把阻止了子元素的事件的处理了
	*/
	private keyHandle = (event: KeyboardEvent) => {
		if (!this.monacoEditor.hasTextFocus())
			return;

		if (event.altKey) {
			if (event.key === 'z') {
				this.plugin.settings.wordWrap = !this.plugin.settings.wordWrap;
				this.plugin.saveSettings();
				this.monacoEditor.updateOptions({
					wordWrap: this.plugin.settings.wordWrap ? "on" : "off",
				})

			}
		}

		if (this.plugin.settings.vimMode) {
			return;
		}

		const ctrlMap = new Map<string, string>([
			['f', 'actions.find'],
			['h', 'editor.action.startFindReplaceAction'],
			['/', 'editor.action.commentLine'],
			['Enter', 'editor.action.insertLineAfter'],
			['[', 'editor.action.outdentLines'],
			[']', 'editor.action.indentLines'],
			['d', 'editor.action.copyLinesDownAction'],
			['v', 'paste'],
		]);
		if (event.ctrlKey) {
			const triggerName = ctrlMap.get(event.key);
			if (triggerName) {
				event.preventDefault();
				event.stopPropagation();
				if (triggerName === 'paste') {
					navigator.clipboard.readText().then((clipboard) => {
						this.monacoEditor.trigger('source', triggerName, {text: clipboard });
					})
				}
				else {
					this.monacoEditor.trigger('source', triggerName, null);
				}
			}
		}

	}

	private mousewheelHandle = (event: WheelEvent) => {
		if (event.ctrlKey) {
			let delta = 0 < event.deltaY ? 1 : -1;
			this.plugin.settings.fontSize += delta;
			this.plugin.saveSettings();
			this.monacoEditor.updateOptions({
				fontSize: this.plugin.settings.fontSize,
			})
			// Stop event propagation, so that the editor doesn't scroll
			// scroll is monaco-editor's default behavior
			event.stopPropagation();
		}
	}




}
