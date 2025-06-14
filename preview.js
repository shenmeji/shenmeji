// 添加预览切换功能
const togglePreviewBtn = document.getElementById('toggle-preview-btn');
const previewContainer = document.getElementById('preview-container');
const noteContentTextarea = document.getElementById('note-content-textarea');
let isPreviewVisible = false;

if (togglePreviewBtn && previewContainer) {
    togglePreviewBtn.addEventListener('click', () => {
        isPreviewVisible = !isPreviewVisible;
        previewContainer.classList.toggle('d-none', !isPreviewVisible);
        togglePreviewBtn.innerHTML = isPreviewVisible 
            ? '<i class="bi bi-eye-slash me-1"></i>隐藏预览' 
            : '<i class="bi bi-eye me-1"></i>预览';

        if (isPreviewVisible && noteContentTextarea) {
            window.renderPreview(noteContentTextarea.value);
        }
    });
}