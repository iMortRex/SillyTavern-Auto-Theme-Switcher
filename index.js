import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { executeSlashCommands } from "../../../slash-commands.js";

const extensionName = "auto-theme-switcher";

// 默认设置
const defaultSettings = {
    dark_theme: 'Dark',
    light_theme: 'Light',
    pre_switch_enabled: false,
    pre_dark_theme: 'Light',  // 切换到深色前的过渡主题
    pre_light_theme: 'Dark'   // 切换到浅色前的过渡主题
};

// 加载设置
function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    if (Object.keys(extension_settings[extensionName]).length === 0) {
        Object.assign(extension_settings[extensionName], defaultSettings);
    }
    
    // 兼容旧版本设置并补全缺失项
    if (!extension_settings[extensionName].hasOwnProperty('dark_theme')) {
        extension_settings[extensionName].dark_theme = defaultSettings.dark_theme;
    }
    if (!extension_settings[extensionName].hasOwnProperty('light_theme')) {
        extension_settings[extensionName].light_theme = defaultSettings.light_theme;
    }
    if (!extension_settings[extensionName].hasOwnProperty('pre_switch_enabled')) {
        extension_settings[extensionName].pre_switch_enabled = defaultSettings.pre_switch_enabled;
    }
    if (!extension_settings[extensionName].hasOwnProperty('pre_dark_theme')) {
        extension_settings[extensionName].pre_dark_theme = defaultSettings.pre_dark_theme;
    }
    if (!extension_settings[extensionName].hasOwnProperty('pre_light_theme')) {
        extension_settings[extensionName].pre_light_theme = defaultSettings.pre_light_theme;
    }
    
    // 清理旧的单一过渡主题字段
    delete extension_settings[extensionName].pre_switch_theme;
}

// 应用主题的核心逻辑
async function applyTheme(themeName) {
    if (!themeName || themeName.trim() === '') {
        console.warn('[AutoThemeSwitcher] 主题名为空，跳过执行');
        return;
    }
    console.log(`[AutoThemeSwitcher] 正在执行指令: /theme ${themeName}`);
    await executeSlashCommands(`/theme ${themeName}`);
}

// 检测系统当前是深色还是浅色，并应用对应主题
async function applyAutoTheme() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const settings = extension_settings[extensionName];
    const themeToApply = isDarkMode ? settings.dark_theme : settings.light_theme;
    const preThemeToApply = isDarkMode ? settings.pre_dark_theme : settings.pre_light_theme;
    
    // 如果开启了“先应用其他主题”
    if (settings.pre_switch_enabled && preThemeToApply && preThemeToApply.trim() !== '') {
        const preTheme = preThemeToApply.trim();
        
        // 只有当过渡主题和目标主题不一样时，才执行过渡
        if (preTheme !== themeToApply) {
            console.log(`[AutoThemeSwitcher] 先过渡应用主题: ${preTheme}`);
            await applyTheme(preTheme);
            
            // 稍作延迟，确保过渡主题的样式已经加载完毕，再应用目标主题
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    await applyTheme(themeToApply);
}

// 初始化扩展设置界面
function setupUI() {
    const settingsHtml = `
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>自动深浅色主题切换</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <div class="flex-container flexColumn">
                <div class="flex1">
                    <span class="note-link-span" title="当系统切换为深色模式时执行的/theme指令参数">
                        <label for="auto_theme_dark_input"><strong>深色模式主题名</strong></label>
                    </span>
                </div>
                <div class="flex1">
                    <input id="auto_theme_dark_input" class="text_pole" type="text" placeholder="例如: Dark" />
                </div>
            </div>
            <div class="flex-container flexColumn">
                <div class="flex1">
                    <span class="note-link-span" title="当系统切换为浅色模式时执行的/theme指令参数">
                        <label for="auto_theme_light_input"><strong>浅色模式主题名</strong></label>
                    </span>
                </div>
                <div class="flex1">
                    <input id="auto_theme_light_input" class="text_pole" type="text" placeholder="例如: Light" />
                </div>
            </div>
            <hr>
            <div class="flex-container">
                <div class="flex1">
                    <label class="checkbox_label" for="auto_theme_pre_switch_enabled" title="开启后，切换主题时会先应用一次对应的过渡主题，再应用目标主题。可解决部分样式不刷新的问题。">
                        <input type="checkbox" id="auto_theme_pre_switch_enabled" />
                        <span><strong>开启过渡主题</strong></span>
                    </label>
                </div>
            </div>
            
            <div id="auto_theme_pre_switch_wrapper" style="display:none; margin-top:10px;">
                <div class="flex-container flexColumn">
                    <div class="flex1">
                        <span class="note-link-span" title="切入深色模式时，先应用此主题">
                            <label for="auto_theme_pre_dark_input"><strong>深色过渡主题名</strong></label>
                        </span>
                    </div>
                    <div class="flex1">
                        <input id="auto_theme_pre_dark_input" class="text_pole" type="text" placeholder="例如: Light" />
                    </div>
                </div>
                <div class="flex-container flexColumn" style="margin-top:10px;">
                    <div class="flex1">
                        <span class="note-link-span" title="切入浅色模式时，先应用此主题">
                            <label for="auto_theme_pre_light_input"><strong>浅色过渡主题名</strong></label>
                        </span>
                    </div>
                    <div class="flex1">
                        <input id="auto_theme_pre_light_input" class="text_pole" type="text" placeholder="例如: Dark" />
                    </div>
                </div>
            </div>
            
            <hr>
            <div class="flex-container">
                <div id="auto_theme_apply_btn" class="menu_button" style="width: 100%; margin-top: 10px;">
                    <i class="fa-solid fa-rotate"></i>
                    <span>立即应用</span>
                </div>
            </div>
        </div>
    </div>`;

    $('#extensions_settings').append(settingsHtml);

    // 读取并设置当前保存的值
    $('#auto_theme_dark_input').val(extension_settings[extensionName].dark_theme);
    $('#auto_theme_light_input').val(extension_settings[extensionName].light_theme);
    $('#auto_theme_pre_switch_enabled').prop('checked', extension_settings[extensionName].pre_switch_enabled);
    $('#auto_theme_pre_dark_input').val(extension_settings[extensionName].pre_dark_theme);
    $('#auto_theme_pre_light_input').val(extension_settings[extensionName].pre_light_theme);

    // 根据开关状态显示/隐藏过渡主题输入框
    function togglePreSwitchVisibility() {
        if ($('#auto_theme_pre_switch_enabled').is(':checked')) {
            $('#auto_theme_pre_switch_wrapper').show();
        } else {
            $('#auto_theme_pre_switch_wrapper').hide();
        }
    }
    togglePreSwitchVisibility();

    // 绑定事件
    $('#auto_theme_dark_input').on('input', function() {
        extension_settings[extensionName].dark_theme = $(this).val().trim();
        saveSettingsDebounced();
    });

    $('#auto_theme_light_input').on('input', function() {
        extension_settings[extensionName].light_theme = $(this).val().trim();
        saveSettingsDebounced();
    });

    $('#auto_theme_pre_switch_enabled').on('change', function() {
        extension_settings[extensionName].pre_switch_enabled = $(this).is(':checked');
        saveSettingsDebounced();
        togglePreSwitchVisibility();
    });

    $('#auto_theme_pre_dark_input').on('input', function() {
        extension_settings[extensionName].pre_dark_theme = $(this).val().trim();
        saveSettingsDebounced();
    });

    $('#auto_theme_pre_light_input').on('input', function() {
        extension_settings[extensionName].pre_light_theme = $(this).val().trim();
        saveSettingsDebounced();
    });

    // 手动触发按钮
    $('#auto_theme_apply_btn').on('click', async function() {
        // 保存当前输入的值
        extension_settings[extensionName].dark_theme = $('#auto_theme_dark_input').val().trim();
        extension_settings[extensionName].light_theme = $('#auto_theme_light_input').val().trim();
        extension_settings[extensionName].pre_dark_theme = $('#auto_theme_pre_dark_input').val().trim();
        extension_settings[extensionName].pre_light_theme = $('#auto_theme_pre_light_input').val().trim();
        saveSettingsDebounced();
        
        await applyAutoTheme();
        toastr.success('已根据系统当前颜色模式应用主题');
    });
}

// 初始化系统颜色模式监听器
function initColorSchemeListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        console.log(`[AutoThemeSwitcher] 系统颜色模式已变更: ${e.matches ? '深色' : '浅色'}`);
        applyAutoTheme();
    });
}

// 扩展入口
jQuery(() => {
    loadSettings();
    setupUI();
    initColorSchemeListener();
    
    // 去除延迟，直接执行一次初始检测
    applyAutoTheme();
});