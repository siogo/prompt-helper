/*
 * @Author: zhangzao
 * @Date: 2025-03-07 09:12:25
 * @LastEditors: zhangzao
 * @LastEditTime: 2025-03-07 09:16:11
 * @Description: 请填写简介
 * @FilePath: /model-prompt-helper/options/options.js
 */
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 获取表单数据
    const host = document.getElementById('hostInput').value.trim();
    const promptContent = document.getElementById('promptInput').value.trim();

    // 验证域名格式
    if (!host.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        alert('域名格式不正确！');
        return;
    }

    // 保存到存储
    const [stored] = await chrome.storage.local.get('customConfig');
    let customConfigs = stored.customConfig?.websites || [];
    customConfigs.push({ host, prompt: promptContent });

    await chrome.storage.local.set({
        customConfig: { websites: customConfigs },
    });

    // 重置表单并刷新配置列表
    document.getElementById('addForm').reset();
    displayConfigList();
});

// 显示已保存的配置
async function displayConfigList() {
    const [stored] = await chrome.storage.local.get('customConfig');
    const configListDiv = document.getElementById('configList');
    configListDiv.innerHTML = '';

    if (stored.customConfig?.websites?.length) {
        stored.customConfig.websites.forEach((cfg) => {
            const item = document.createElement('div');
            item.textContent = `域名: ${cfg.host}, 提示: ${cfg.prompt}`;
            configListDiv.appendChild(item);
        });
    } else {
        configListDiv.textContent = '暂无自定义配置';
    }
}

// 页面加载时显示现有配置
displayConfigList();
