/*
 * @Author: Siogo
 * @Date: 2024-03-07
 * @Description: Background script for Model Prompt Helper
 */

// 扩展安装或更新时的初始化
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // 首次安装时加载默认配置
        const defaultConfig = await fetch(chrome.runtime.getURL('assets/defaultConfig.json'))
            .then(response => response.json())
            .catch(() => ({ items: [] }));

        await chrome.storage.local.set({
            customConfig: defaultConfig
        });
        
        console.log('Extension installed and initialized with default config');
    }
});

// 可以添加更多后台功能，如：
// - 数据同步
// - 定期备份
// - 快捷键支持等
