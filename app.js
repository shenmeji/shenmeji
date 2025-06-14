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
        notes = notesData ? JSON.parse(notesData) : [{ id: 1, title: '欢迎使用', content: '这是链式笔记系统！\n\n- 点击侧边栏右侧的 « 按钮可以收起它。\n- 点击屏幕左侧的 » 按钮可以把它叫出来。\n- 链接语法是 [[ID]] 或 [[标题]]。'}];
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

    function displayNote(id) {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        currentNoteId = id;
        welcomeView.classList.replace('d-flex', 'd-none');
        editorView.classList.replace('d-none', 'd-flex');
        noteTitleInput.value = note.title;
        noteContentTextarea.value = note.content;
        document.getElementById('note-id-input').value = note.id;
        renderPreview(note.content);
        renderNoteList(searchInput.value);
        saveNoteBtn.disabled = true;
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
        // 设置新笔记ID输入框的值
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
            const newId = parseInt(document.getElementById('note-id-input').value, 10);
            if (!isValidNoteId(newId, currentNoteId)) {
                alert('ID必须是唯一的正整数');
                return;
            }

            // 如果ID发生变化，更新所有引用链接
            if (newId !== note.id) {
                updateNoteLinks(note.id, newId);
                note.id = newId;
                currentNoteId = newId;
            }

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

    function init() {
        loadNotes();
        initSidebarState();
        renderNoteList();
    }
    init();
});