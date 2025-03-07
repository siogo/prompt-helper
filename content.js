/*
 * @Author: Siogo
 * @Date: 2024-03-07
 * @Description: Content script for Model Prompt Helper
 */

// 使用 XMLHTTPRequest 替代 fetch
async function fetchManifestConfig() {
    return new Promise((resolve, reject) => {
        try {
            const configUrl = chrome.runtime.getURL(
                'assets/defaultConfig.json'
            );

            // 添加文件系统检查
            console.log('扩展程序完整诊断信息:', {
                extensionId: chrome.runtime.id,
                configUrl: configUrl,
                manifest: chrome.runtime.getManifest(),
                permissions: chrome.runtime.getManifest().permissions,
                webAccessibleResources:
                    chrome.runtime.getManifest().web_accessible_resources,
                currentUrl: window.location.href,
                currentOrigin: window.location.origin,
                // 尝试列出可用的资源
                availableResources:
                    chrome.runtime.getManifest().web_accessible_resources?.[0]
                        ?.resources,
            });

            // 检查文件路径
            if (!configUrl) {
                throw new Error('无法生成配置文件URL');
            }

            const xhr = new XMLHttpRequest();
            xhr.open('GET', configUrl);

            // 添加更多请求头信息
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            // 添加请求状态监听器
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        try {
                            const parsedConfig = JSON.parse(xhr.responseText);
                            console.log('成功获取配置:', parsedConfig);
                            resolve(parsedConfig);
                        } catch (e) {
                            reject(
                                new Error(
                                    `JSON 解析失败: ${e.message}，响应内容为: ${xhr.responseText}`
                                )
                            );
                        }
                    } else {
                        reject(
                            new Error(
                                `请求失败，状态码: ${xhr.status}，原因: ${xhr.statusText}`
                            )
                        );
                    }
                }
            };

            // 详细错误处理
            xhr.onerror = (err) => {
                const diagnosticInfo = {
                    error: err,
                    extensionId: chrome.runtime.id,
                    url: configUrl,
                    readyState: xhr.readyState,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    manifestInfo:
                        chrome.runtime.getManifest().web_accessible_resources,
                    // 添加更多诊断信息
                    location: window.location.href,
                    origin: window.location.origin,
                    isExtensionContext: chrome.runtime
                        .getURL('')
                        .startsWith(window.location.origin),
                };
                console.error('请求诊断信息:', diagnosticInfo);

                reject(
                    new Error(
                        `配置文件访问失败。请确保：\n` +
                            `1. manifest.json 中已配置 web_accessible_resources\n` +
                            `2. assets/defaultConfig.json 文件存在于扩展目录中\n` +
                            `3. 文件路径正确（区分大小写）\n` +
                            `4. 扩展程序已重新加载\n` +
                            `详细错误: ${err.type}\n` +
                            `状态: ${xhr.status}\n` +
                            `URL: ${configUrl}`
                    )
                );
            };

            // 添加超时处理（如3秒）
            xhr.timeout = 3000;
            xhr.ontimeout = () => {
                reject(new Error('请求超时'));
            };

            // 发送请求
            console.log(
                '正在尝试请求配置文件:',
                chrome.runtime.getURL('assets/defaultConfig.json')
            );
            xhr.send();
        } catch (error) {
            console.error('初始化失败:', {
                错误信息: error.message,
                错误类型: error.name,
                错误堆栈: error.stack,
                发生位置: '内容脚本初始化过程',
                时间戳: new Date().toISOString()
            });
            
            // 向用户显示友好的错误提示
            chrome.runtime.sendMessage({
                action: 'showError',
                error: {
                    title: '初始化失败',
                    message: `扩展初始化失败，请刷新页面重试。\n具体错误：${error.message}`,
                    type: 'error'
                }
            });
            reject(error);
        }
    });
}

// 获取当前标签页信息
function getTabDetails() {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage(
                { action: 'getTabId' },
                function (response) {
                    if (chrome.runtime.lastError) {
                        console.error(
                            '获取标签页ID失败:',
                            chrome.runtime.lastError
                        );
                        reject(chrome.runtime.lastError);
                        return;
                    }
                    resolve({ tabId: response.tabId });
                }
            );
        } catch (error) {
            console.error('获取标签页详情失败:', error);
            reject(error);
        }
    });
}

async function initialize() {
    try {
        console.log('开始初始化...');
        console.log('扩展程序状态:', {
            id: chrome.runtime.id,
            manifest: chrome.runtime.getManifest(),
        });
        const config = await fetchManifestConfig();
        if (!config || !config.websites) {
            throw new Error('配置无效: 缺少必要的配置数据');
        }

        console.log('获取到配置:', config);
        const hostRegexs = config.websites.map(
            (w) => new RegExp(`^${w.host.replace(/\./g, '\\.')}$`)
        );
        const currentHost = new URL(document.location).hostname;

        const isMatch = config.websites.some((w) => {
            return hostRegexs.some((regex) => {
                return (
                    regex.test(currentHost) ||
                    currentHost.endsWith(`.${w.host}`)
                );
            });
        });

        if (isMatch) {
            chrome.runtime.sendMessage({
                action: 'showPageAction',
                host: currentHost,
            });
        }
    } catch (error) {
        console.error('初始化失败:', {
            错误信息: error.message,
            错误类型: error.name,
            错误堆栈: error.stack,
            发生位置: '内容脚本初始化过程',
            时间戳: new Date().toISOString()
        });
        
        // 向用户显示友好的错误提示
        chrome.runtime.sendMessage({
            action: 'showError',
            error: {
                title: '初始化失败',
                message: `扩展初始化失败，请刷新页面重试。\n具体错误：${error.message}`,
                type: 'error'
            }
        });
    }
}

initialize();

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'insertPrompt') {
        insertPromptToActiveElement(request.prompt);
        sendResponse({ status: 'success' });
    }
});

// 将提示词插入到当前活动的输入框
function insertPromptToActiveElement(prompt) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        activeElement.value = text.substring(0, start) + prompt + text.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd = start + prompt.length;
        activeElement.focus();
    }
}
