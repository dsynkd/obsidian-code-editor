import { App, PluginSettingTab, Setting } from "obsidian";
import CodeFilesPlugin from "./main";

export class CodeFilesSettingsTab extends PluginSettingTab {
	plugin: CodeFilesPlugin;

	constructor(app: App, plugin: CodeFilesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		let fontSizeText: HTMLDivElement;
		new Setting(containerEl)
			.setName("Font size")
			.setDesc(
				'Set the font size of the code editor.You can also use "ctrl + mouse wheel" to zoom in and out of the code editor.',
			)
			.addSlider(slider => slider
				.setLimits(5, 30, 1)
				.setValue(this.plugin.settings.fontSize)
				.onChange(async (value) => {
					fontSizeText.innerText = " " + value.toString();
					this.plugin.settings.fontSize = value;
					this.plugin.saveSettings();
				}))
			.settingEl.createDiv('', (el) => {
				fontSizeText = el;
				el.style.minWidth = "2.3em";
				el.style.textAlign = "right";
				el.innerText = " " + this.plugin.settings.fontSize.toString();
			});

		new Setting(containerEl)
			.setName("Font ligatures")
			.setDesc("Editor will show font ligatures.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.fontLigatures)
				.onChange(async (value) => {
					this.plugin.settings.fontLigatures = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Add context menu")
			.setDesc(
				'Add "Create Code File" and "Open in Code Editor" to the file menu.',
			)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.addContextMenu)
				.onChange(async (value) => {
					this.plugin.settings.addContextMenu = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Word wrap")
			.setDesc("Editor will wrap long lines.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.wordWrap)
				.onChange(async (value) => {
					this.plugin.settings.wordWrap = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Minimap")
			.setDesc("Editor will show a minimap.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.minimap)
				.onChange(async (value) => {
					this.plugin.settings.minimap = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Line numbers")
			.setDesc("Show line numbers in the code editor.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.lineNumbers)
				.onChange(async (value) => {
					this.plugin.settings.lineNumbers = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName("Code block folding")
			.setDesc("Editor will support code block folding.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.folding)
				.onChange(async (value) => {
					this.plugin.settings.folding = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Vim mode")
			.setDesc(
				"Use Vim keybindings in the Monaco editor (normal/insert/visual). A small status line shows the current mode. Reopen editors for the change to apply.",
			)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.vimMode)
				.onChange(async (value) => {
					this.plugin.settings.vimMode = value;
					await this.plugin.saveSettings();
				}));


	}
}
