// 初始化数据存储的键名
const STORAGE_KEY = 'customConfig';

// 获取DOM元素
const listContainer = document.getElementById('listContainer');
const addButton = document.getElementById('addButton');
const addItemInputContainer = document.getElementById('addItemInputContainer');
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const notification = document.getElementById('notification');

// 获取按钮元素
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');

// 页面加载时加载数据
document.addEventListener('DOMContentLoaded', async () => {
    const items = await getStoredItems();
    renderList(items);
});

// 添加按钮事件监听器
addButton.addEventListener('click', showAddForm);
saveButton.addEventListener('click', saveItem);
cancelButton.addEventListener('click', cancelAdd);

// 导航切换
document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        // 更新标签页状态
        document
            .querySelectorAll('.nav-tab')
            .forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        // 更新页面显示
        const targetPage = tab.dataset.page;
        document
            .querySelectorAll('.page')
            .forEach((page) => page.classList.remove('active'));
        document.getElementById(`${targetPage}Page`).classList.add('active');

        // 如果切换到首页，重新加载列表
        if (targetPage === 'home') {
            getStoredItems().then((items) => renderList(items));
        }
    });
});

function showAddForm() {
    addButton.style.display = 'none';
    addItemInputContainer.style.display = 'block';
    titleInput.focus();
}

function cancelAdd() {
    addItemInputContainer.style.display = 'none';
    addButton.style.display = 'block';
    titleInput.value = '';
    contentInput.value = '';
}

async function saveItem() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        showNotification('标题和内容不能为空！', 'error');
        return;
    }

    const items = await getStoredItems();
    items.unshift({ title, content }); // 添加到列表开头

    await updateStorage(items);
    renderList(items);

    // 重置表单并隐藏
    titleInput.value = '';
    contentInput.value = '';
    addItemInputContainer.style.display = 'none';
    addButton.style.display = 'block';

    showNotification('保存成功！');
}

function renderList(items = []) {
    listContainer.innerHTML = '';
    items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'list-item';

        // 创建标题区域
        const headerElement = document.createElement('div');
        headerElement.className = 'list-item-header';

        // 创建标题文本
        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title;

        // 创建操作按钮区域
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'list-item-actions';

        // 创建复制按钮
        const copyButton = document.createElement('span');
        copyButton.textContent = '复制';
        copyButton.addEventListener('click', (e) => copyContent(e, index));

        // 创建删除按钮
        const deleteButton = document.createElement('span');
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', (e) => deleteItem(e, index));

        // 创建内容区域
        const contentDiv = document.createElement('div');
        contentDiv.className = 'list-item-content';
        contentDiv.textContent = item.content;

        // 组装DOM
        actionsDiv.appendChild(copyButton);
        actionsDiv.appendChild(deleteButton);
        headerElement.appendChild(titleSpan);
        headerElement.appendChild(actionsDiv);
        itemElement.appendChild(headerElement);
        itemElement.appendChild(contentDiv);

        // 添加展开/收起事件监听
        headerElement.addEventListener('click', () => toggleItem(index));

        listContainer.appendChild(itemElement);
    });
}

function toggleItem(index) {
    const items = document.querySelectorAll('.list-item');
    items[index].classList.toggle('expanded');
}

async function copyContent(event, index) {
    event.stopPropagation();
    const items = await getStoredItems();
    const content = items[index].content;
    await navigator.clipboard.writeText(content);
    showNotification('已复制到剪贴板！');
}

async function deleteItem(event, index) {
    event.stopPropagation();

    // 创建确认弹窗
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'delete-confirm';
    confirmDialog.innerHTML = `
        <div>确定要删除这条提示词吗？</div>
        <div class="buttons">
            <button onclick="this.parentElement.parentElement.remove()">取消</button>
            <button class="confirm" onclick="confirmDelete(${index})">删除</button>
        </div>
    `;
    document.body.appendChild(confirmDialog);
}

async function confirmDelete(index) {
    const items = await getStoredItems();
    items.splice(index, 1);
    await updateStorage(items);
    renderList(items);
    showNotification('删除成功！');

    // 移除确认弹窗
    const dialog = document.querySelector('.delete-confirm');
    if (dialog) dialog.remove();
}

// 从存储中读取数据
async function getStoredItems() {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        return (result[STORAGE_KEY] || {}).items || [];
    } catch (error) {
        console.error('读取存储数据失败:', error);
        return [];
    }
}

// 更新存储数据
async function updateStorage(items) {
    try {
        await chrome.storage.local.set({
            [STORAGE_KEY]: { items },
        });
    } catch (error) {
        console.error('更新存储数据失败:', error);
        showNotification('保存失败，请重试', 'error');
    }
}

function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.style.opacity = 1;
    notification.style.background = type === 'error' ? '#dc3545' : '#28a745';

    setTimeout(() => {
        notification.style.opacity = 0;
    }, 2000);
}
