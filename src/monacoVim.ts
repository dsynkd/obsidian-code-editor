import * as monaco from "monaco-editor";
import { initVimMode } from "monaco-vim";

export type MonacoVimAdapter = NonNullable<ReturnType<typeof initVimMode>>;

export function prepareMonacoHost(
	contentEl: HTMLElement,
	vimMode: boolean
): { host: HTMLElement; statusBar: HTMLElement | null } {
	if (!vimMode) {
		return { host: contentEl, statusBar: null };
	}
	contentEl.replaceChildren();
	contentEl.style.display = "flex";
	contentEl.style.flexDirection = "column";
	contentEl.style.height = "100%";
	const host = document.createElement("div");
	host.className = "vscode-editor-monaco-host";
	host.style.flex = "1";
	host.style.minHeight = "0";
	host.style.minWidth = "0";
	const statusBar = document.createElement("div");
	statusBar.className = "vscode-editor-vim-status";
	contentEl.appendChild(host);
	contentEl.appendChild(statusBar);
	return { host, statusBar };
}

export function attachVimMode(
	editor: monaco.editor.IStandaloneCodeEditor,
	statusBar: HTMLElement | null
): MonacoVimAdapter | null {
	if (!statusBar) return null;
	return initVimMode(editor, statusBar);
}
