// 添加预览切换功能
// 编辑文本框显示/隐藏功能
const togglePreviewBtn = document.getElementById('toggle-preview-btn');
const noteContentTextarea = document.getElementById('note-content-textarea');
let isEditMode = false;

if (togglePreviewBtn && noteContentTextarea) {
    togglePreviewBtn.addEventListener('click', () => {
        isEditMode = !isEditMode;
        noteContentTextarea.classList.toggle('d-none', !isEditMode);
        
        togglePreviewBtn.innerHTML = isEditMode 
            ? '<i class="bi bi-eye-slash me-1"></i>隐藏编辑' 
            : '<i class="bi bi-pencil me-1"></i>编辑';
        
        if (!isEditMode) {
            window.renderPreview(noteContentTextarea.value);
        } else {
            noteContentTextarea.focus();
        }
    });
}
