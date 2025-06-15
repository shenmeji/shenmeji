document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const hideSidebarBtn = document.getElementById('hide-sidebar-btn');
    const showSidebarBtn = document.getElementById('show-sidebar-btn');
    const noteList = document.getElementById('note-list');
    const searchInput = document.getElementById('search-input');
    const newNoteBtn = document.getElementById('new-note-btn');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const deleteNoteBtn = document.getElementById('delete-note-btn');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteContentTextarea = document.getElementById('note-content-textarea');
    const notePreview = document.getElementById('note-preview');
    const welcomeView = document.getElementById('welcome-view');
    const editorView = document.getElementById('editor-view');
    const currentNoteIdSpan = document.getElementById('current-note-id');

    let notes = [];
    let currentNoteId = null;

    function loadNotes() {
        const notesData = localStorage.getItem('chain-notes-data-bs');
        notes = notesData ? JSON.parse(notesData) : [{ id: 1, title: '欢迎使用', content: '什么记除了支持markdown，还是一个链式笔记系统！\n\n- 点击侧边栏右侧的 « 按钮可以收起它。\n- 点击屏幕左侧的 » 按钮可以把它叫出来。\n- 链接语法是 [[ID]] 或 [[标题]]。'}];
    }

    function saveNotes() {
        localStorage.setItem('chain-notes-data-bs', JSON.stringify(notes));
    }

    function toggleSidebar() {
        const isCollapsed = body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed);
    }

    function initSidebarState() {
        const savedState = localStorage.getItem('sidebar-collapsed');
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (savedState === null && isMobile) {
            body.classList.add('sidebar-collapsed');
            localStorage.setItem('sidebar-collapsed', 'true');
        } else if (savedState === 'true') {
            body.classList.add('sidebar-collapsed');
        }
    }

    function renderNoteList(filter = '') {
        noteList.innerHTML = '';
        const sortedNotes = [...notes].sort((a, b) => a.id - b.id);
        const filteredNotes = filter ? sortedNotes.filter(n => 
            n.title.toLowerCase().includes(filter.toLowerCase()) || 
            n.content.toLowerCase().includes(filter.toLowerCase())
        ) : sortedNotes;

        if (filteredNotes.length === 0) {
            noteList.innerHTML = '<li class="list-group-item text-center text-muted">没有匹配的笔记</li>';
            return;
        }

        filteredNotes.forEach(note => {
            const li = document.createElement('li');
            li.dataset.id = note.id;
            li.className = `list-group-item list-group-item-action border-0 ${note.id === currentNoteId ? 'active' : ''}`;
            li.textContent = `[${note.id}] ${note.title}`;
            li.addEventListener('click', () => displayNote(note.id));
            noteList.appendChild(li);
        });
    }

    function renderPreview(content) {
        // 先渲染Markdown内容
        let htmlContent = marked.parse(content);
        
        // 然后处理笔记链接
        const linkRegex = /\[\[(.*?)\]\]/g;
        htmlContent = htmlContent.replace(linkRegex, (match, linkTarget) => {
            linkTarget = linkTarget.trim();
            const targetNote = notes.find(n => String(n.id) === linkTarget || n.title.toLowerCase() === linkTarget.toLowerCase());
            return targetNote ? 
                `<a class="note-link" data-link-id="${targetNote.id}">${match}</a>` : 
                `<span class="note-link-broken">${match}</span>`;
        });
        notePreview.innerHTML = htmlContent;
    }

    // 初始化预览/编辑状态
    let isEditMode = false;
    
    function toggleEditMode() {
        isEditMode = !isEditMode;
        noteContentTextarea.classList.toggle('d-none', !isEditMode);
        
        // 更新按钮文本
        togglePreviewBtn.innerHTML = isEditMode 
            ? '<i class="bi bi-eye-slash me-1"></i>隐藏编辑' 
            : '<i class="bi bi-pencil me-1"></i>编辑';
        
        if (!isEditMode) {
            renderPreview(noteContentTextarea.value);
        } else {
            noteContentTextarea.focus();
        }
    }

    // 修改displayNote函数，默认显示预览
    function displayNote(id) {
        const note = notes.find(n => n.id === id);
        if (!note) return;
        
        currentNoteId = id;
        welcomeView.classList.replace('d-flex', 'd-none');
        editorView.classList.replace('d-none', 'd-flex');
        noteTitleInput.value = note.title;
        noteContentTextarea.value = note.content;
        document.getElementById('current-note-id').textContent = note.id;
        
        // 默认显示预览
        isEditMode = false;
        noteContentTextarea.classList.add('d-none');
        renderPreview(note.content);
        
        // 更新按钮状态
        togglePreviewBtn.innerHTML = '<i class="bi bi-pencil me-1"></i>编辑';
        
        // 高亮当前选中的笔记
        const noteItems = document.querySelectorAll('#note-list .list-group-item');
        noteItems.forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.id) === id);
        });
    }

    hideSidebarBtn.addEventListener('click', toggleSidebar);
    showSidebarBtn.addEventListener('click', toggleSidebar);
    searchInput.addEventListener('input', () => renderNoteList(searchInput.value));

    function updateNoteLinks(oldId, newId) {
        // 修复正则表达式转义问题
        const regex = new RegExp(`\\[\\[${oldId}\\]\\]`, 'g');
        notes.forEach(note => {
            note.content = note.content.replace(regex, `[[${newId}]]`);
        });
    }

    newNoteBtn.addEventListener('click', () => {
        const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
        const newNote = { id: newId, title: '未命名笔记', content: '' };
        notes.push(newNote);
        saveNotes();
        displayNote(newId);
        
        // 直接显示编辑框并进入编辑模式
        const noteContentTextarea = document.getElementById('note-content-textarea');
        if(noteContentTextarea) {
            noteContentTextarea.classList.remove('d-none');
            noteContentTextarea.focus();
        }
        
        document.getElementById('note-id-input').value = newId;
        renderNoteList();
        noteTitleInput.focus();
    });

    function isValidNoteId(newId, currentId) {
        const parsedId = parseInt(newId, 10);
        if (isNaN(parsedId) || parsedId < 1) return false;
        return !notes.some(note => note.id === parsedId && note.id !== currentId);
    }

    saveNoteBtn.addEventListener('click', () => {
        if (!currentNoteId) return;
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            note.title = noteTitleInput.value.trim() || '未命名笔记';
            note.content = noteContentTextarea.value;
            saveNotes();
            renderNoteList(searchInput.value);
            renderPreview(note.content);
            saveNoteBtn.disabled = true;
            saveNoteBtn.innerHTML = '<i class="bi bi-check-all me-1"></i>已保存!';
            setTimeout(() => { saveNoteBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>保存'; }, 1500);
        }
    });

    // 修改编号功能
    const editIdBtn = document.getElementById('edit-id-btn');
    editIdBtn.addEventListener('click', () => {
        if (!currentNoteId) return;
        
        const newId = prompt('请输入新的笔记编号 (正整数):', currentNoteId);
        if (newId === null) return; // 用户点击取消
        
        if (!newId || isNaN(newId) || parseInt(newId) <= 0) {
            alert('请输入有效的正整数编号！');
            return;
        }
        
        const idExists = notes.some(n => n.id === parseInt(newId));
        if (idExists) {
            alert('该编号已存在，请使用其他编号！');
            return;
        }
        
        const oldId = currentNoteId;
        const note = notes.find(n => n.id === oldId);
        note.id = parseInt(newId);
        currentNoteId = note.id;
        
        // 更新所有引用该ID的笔记链接
        notes.forEach(n => {
            n.content = n.content.replace(new RegExp(`\\[\\[${oldId}\\]\\]`, 'g'), `[[${newId}]]`);
        });
        
        saveNotes();
        renderNoteList();
        document.getElementById('current-note-id').textContent = newId;
        alert('编号修改成功！');
    });

    deleteNoteBtn.addEventListener('click', () => {
        if (!currentNoteId || window.prompt(`确定要删除这篇笔记吗？\n笔记ID: ${currentNoteId}\n标题: ${noteTitleInput.value}\n\n请输入 "删除" 来确认。`) !== '删除') return;

        notes = notes.filter(n => n.id !== currentNoteId);
        saveNotes();
        currentNoteId = null;
        editorView.classList.replace('d-flex', 'd-none');
        welcomeView.classList.replace('d-none', 'd-flex');
        renderNoteList();
    });

    noteTitleInput.addEventListener('input', () => { saveNoteBtn.disabled = false; });
    noteContentTextarea.addEventListener('input', () => {
        saveNoteBtn.disabled = false;
        renderPreview(noteContentTextarea.value);
    });

    notePreview.addEventListener('click', (e) => {
        if (e.target.classList.contains('note-link')) {
            const linkId = parseInt(e.target.dataset.linkId, 10);
            if (linkId) displayNote(linkId);
        }
    });

    // ID修改模态框相关功能
    function initIdEditModal() {
    const modal = new bootstrap.Modal(document.getElementById('idEditModal'));
    const editIdBtn = document.getElementById('edit-id-btn');
    const currentNoteIdEl = document.getElementById('current-note-id');
    const newNoteIdInput = document.getElementById('new-note-id');
    const idErrorMessage = document.getElementById('id-error-message');
    const confirmIdChangeBtn = document.getElementById('confirm-id-change');
    
    // 打开模态框并设置当前ID
    editIdBtn.addEventListener('click', () => {
    if (currentNoteId) {
      const currentNote = notes.find(n => n.id === currentNoteId);
      currentNoteIdEl.textContent = currentNote.id;
      newNoteIdInput.value = currentNote.id;
      idErrorMessage.classList.add('d-none');
      modal.show();
    }
    });
    
    // 确认修改ID
    confirmIdChangeBtn.addEventListener('click', async () => {
    const newId = parseInt(newNoteIdInput.value);
    const oldId = currentNote.id;
    
    // 验证ID
    if (!isValidNoteId(newId, oldId)) {
    idErrorMessage.textContent = 'ID必须是唯一的正整数';
    idErrorMessage.classList.remove('d-none');
    return;
    }
    
    try {
    // 更新ID和相关链接
    await updateNoteId(oldId, newId);
    modal.hide();
    // 刷新笔记列表和当前显示
    displayNotes();
    displayNote(newId);
    showMessage('笔记ID已成功更新');
    } catch (error) {
    idErrorMessage.textContent = error.message;
    idErrorMessage.classList.remove('d-none');
    }
    });
    }
    
    // 验证笔记ID是否有效
    function isValidNoteId(newId, oldId = null) {
    if (isNaN(newId) || newId < 1 || !Number.isInteger(newId)) {
    return false;
    }
    
    const notes = getNotes();
    return !notes.some(note => note.id === newId && note.id !== oldId);
    }
    
    // 更新笔记ID
    function updateNoteId(oldId, newId) {
    return new Promise((resolve, reject) => {
    try {
    let notes = getNotes();
    const noteIndex = notes.findIndex(note => note.id === oldId);
    
    if (noteIndex === -1) {
    reject(new Error('未找到该笔记'));
    return;
    }
    
    // 更新当前笔记ID
    notes[noteIndex].id = newId;
    saveNotes(notes);
    
    // 更新所有引用该ID的笔记链接
    updateNoteLinks(oldId, newId);
    
    resolve();
    } catch (error) {
    reject(error);
    }
    });
    }
    
    // 更新所有引用旧ID的笔记链接
    function updateNoteLinks(oldId, newId) {
    let notes = getNotes();
    const oldIdStr = `[[${oldId}]]`;
    const newIdStr = `[[${newId}]]`;
    const oldIdRegex = new RegExp(`\[\[${oldId}\]\]`, 'g');
    
    notes = notes.map(note => {
    if (note.content.includes(oldIdStr)) {
    return {
    ...note,
    content: note.content.replace(oldIdRegex, newIdStr)
    };
    }
    return note;
    });
    
    saveNotes(notes);
    }

    function init() {
        loadNotes();
        initSidebarState();
        renderNoteList();
    }
    init();
});
togglePreviewBtn.addEventListener('click', toggleEditMode);