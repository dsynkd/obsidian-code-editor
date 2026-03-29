import { Plugin } from "obsidian";
import * as monaco from "monaco-editor";
import { DEFAULT_SETTINGS, EditorSettings } from "./common";
import { getMonacoBaseTheme } from "./ObsidianUtils";
import { CodeEditorView } from "./codeEditorView";
import { CreateCodeFileModal } from "./createCodeFileModal";
import { CodeFilesSettingsTab } from "./codeFilesSettingsTab";
import { viewType } from "./common";
import { FenceEditModal } from "./fenceEditModal";
import { FenceEditContext } from "./fenceEditContext";
import { mountCodeEditor } from "./mountCodeEditor";

declare module "obsidian" {
	interface Workspace {
		on(
			name: "hover-link",
			callback: (e: MouseEvent) => any,
			ctx?: any,
		): EventRef;
	}
}


export default class CodeFilesPlugin extends Plugin {
	settings: EditorSettings;

	observer: MutationObserver;

	public hover: {
		linkText: string;
		sourcePath: string;
		event: MouseEvent;
	} = {
			linkText: "",
			sourcePath: "",
			event: new MouseEvent(""),
		};

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				monaco.editor.setTheme(getMonacoBaseTheme());
			}),
		);

		this.registerView(viewType, leaf => new CodeEditorView(leaf, this));

		try {
			this.registerExtensions(this.settings.extensions, viewType);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			new Notification("Code Editor plugin error", {
				body: `${message}\nThere may already be other plugins registered with the same file extension. Please change the extension in the settings of the Code Editor plugin or disable conflicting plugins.`,
			});
		}


		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item
						.setTitle("Create Code File")
						.setIcon("file-json")
						.onClick(async () => {
							new CreateCodeFileModal(this, file).open();
						});
				});
			})
		);

		this.addRibbonIcon("file-json", "Create Code File", () => {
			new CreateCodeFileModal(this).open();
		});

		this.addCommand({
			id: 'create',
			name: 'Create new code file',
			callback: () => {
				new CreateCodeFileModal(this).open();
			}
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu) => {
				if (!FenceEditContext.create(this).isInFence()) {
					return;
				}
				menu.addItem((item) => {
					item.setTitle("Edit code block in Code Editor")
						.setIcon("code")
						.onClick(() => {
							FenceEditModal.openOnCurrentCode(this);
						});
				});
			})
		);



		//internal links
		this.observer = new MutationObserver(async (mutation) => {
			if (mutation.length !== 1) return;
			if (mutation[0].addedNodes.length !== 1) return;
			if (this.hover.linkText === null) return;
			//@ts-ignore
			if (mutation[0].addedNodes[0].className !== "popover hover-popover") return;
			const file = this.app.metadataCache.getFirstLinkpathDest(this.hover.linkText, this.hover.sourcePath);
			if (!file) return;
			// check file.extension in this.settings.extensions array
			let valid = this.settings.extensions.includes(file.extension);
			if (valid === false) return;
			const fileContent = await this.app.vault.read(file);

			const node: Node = mutation[0].addedNodes[0];
			const contentEl = createDiv();
			new mountCodeEditor(
				contentEl,
				this,
				fileContent,
				file.extension,
				false,
				true
			);

			let w = 700;
			let h = 500;
			let gep = 10;
			if (node instanceof HTMLDivElement) {
				let x = this.hover.event.clientX;
				let y = this.hover.event.clientY;
				let target = this.hover.event.target as HTMLElement;
				let targetRect = target.getBoundingClientRect();
				let targetTop = targetRect.top;
				let targetBottom = targetRect.bottom;
				let targeRight = targetRect.right
				node.style.position = "absolute";
				node.style.left = `${x + gep}px`;

				let spaceBelow = window.innerHeight - y - gep * 3;
				let spaceAbove = y - gep * 3;
				if (spaceBelow > h) {
					node.style.top = `${targetBottom + gep}px`;
				} else if (spaceAbove > h) {
					node.style.top = `${targetTop - h - gep}px`;
				} else {
					node.style.top = `${targetTop - (h / 2) - gep}px`;
					node.style.left = `${targeRight + gep * 2}px`;
				}
			}

			contentEl.setCssProps({
				"width": `${w}px`,
				"height": `${h}px`,
				"padding-top": "10px",
				"padding-bottom": "10px",
			});

			node.empty();
			node.appendChild(contentEl);

		});

		this.registerEvent(this.app.workspace.on("hover-link", async (event: any) => {
			const linkText: string = event.linktext;
			const sourcePath: string = event.sourcePath;
			if (!linkText || !sourcePath) return;
			this.hover.linkText = linkText;
			this.hover.sourcePath = sourcePath;
			this.hover.event = event.event;
		}));

		this.observer.observe(document, { childList: true, subtree: true });

		this.addSettingTab(new CodeFilesSettingsTab(this.app, this));
	}

	onunload() {
		this.observer.disconnect();
	}



	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}
