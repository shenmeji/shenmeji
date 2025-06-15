document.addEventListener('DOMContentLoaded', function() {
  // 导出功能主模块
  const ExportModule = {
    // 初始化导出功能
    init() {
      this.createExportButtons();
      this.createExportModal();
      this.bindEvents();
      console.log('ExportModule initialized');
    },

    // 创建导出按钮
    createExportButtons() {
      console.log('createExportButtons: 创建导出按钮');
      
      // 创建"导出全部"按钮 (右上角导航栏)
      const exportAllBtn = document.createElement('button');
      exportAllBtn.id = 'export-all-btn';
      exportAllBtn.className = 'btn btn-outline-secondary btn-sm me-2';
      exportAllBtn.innerHTML = '<i class="bi bi-download me-1"></i>导出全部';
      exportAllBtn.title = '导出所有笔记';
      
      // 找到导航栏品牌元素并在其后面添加按钮
      const navbarBrand = document.querySelector('.navbar-brand');
      if (navbarBrand && navbarBrand.parentNode) {
        navbarBrand.parentNode.insertBefore(exportAllBtn, navbarBrand.nextSibling);
        console.log('createExportButtons: 已添加导出全部按钮到导航栏');
      } else {
        console.error('createExportButtons: 未找到导航栏品牌元素');
      }
      
      // 创建"导出当前"按钮 (编辑区)
      const exportCurrentBtn = document.createElement('button');
      exportCurrentBtn.id = 'export-current-btn';
      exportCurrentBtn.className = 'btn btn-outline-secondary btn-sm me-2';
      exportCurrentBtn.innerHTML = '<i class="bi bi-file-earmark-arrow-down me-1"></i>导出当前';
      exportCurrentBtn.title = '导出当前笔记';
      
      // 找到切换编辑模式按钮并在其前面插入导出当前按钮
      const toggleEditBtn = document.querySelector('button:has(.bi-pencil), button:has(.bi-eye-slash)');
      if (!toggleEditBtn) {
        // 备选选择器 - 查找包含"编辑"或"预览"文本的按钮
        const buttons = document.querySelectorAll('.btn');
        for (const btn of buttons) {
          const text = btn.textContent.toLowerCase();
          if (text.includes('编辑') || text.includes('预览')) {
            toggleEditBtn = btn;
            break;
          }
        }
      }
      
      if (toggleEditBtn && toggleEditBtn.parentElement) {
        toggleEditBtn.parentElement.insertBefore(exportCurrentBtn, toggleEditBtn);
        console.log('createExportButtons: 已添加导出当前按钮到切换编辑按钮之前');
      } else {
        // 备选方案：保存按钮后面
        const saveButton = document.getElementById('save-note-btn');
        if (saveButton && saveButton.parentElement) {
          saveButton.parentElement.insertBefore(exportCurrentBtn, saveButton.nextSibling);
          console.log('createExportButtons: 已添加导出当前按钮到保存按钮之后');
        } else {
          console.error('createExportButtons: 未找到合适位置添加导出当前按钮');
        }
      }
      
      return { exportAllBtn, exportCurrentBtn };
    },

    // 创建导出选项模态框
    createExportModal() {
      // 创建模态框元素
      const modalHTML = `
        <div class="modal fade" id="exportModal" tabindex="-1" aria-labelledby="exportModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="exportModalLabel">选择导出格式</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="d-flex flex-column gap-2">
                  <button type="button" class="btn btn-outline-primary export-format-btn" data-format="txt">
                    <i class="bi bi-filetype-txt me-2"></i>导出为TXT
                  </button>
                  <button type="button" class="btn btn-outline-primary export-format-btn" data-format="md">
                    <i class="bi bi-filetype-md me-2"></i>导出为Markdown
                  </button>
                  <button type="button" class="btn btn-outline-primary export-format-btn" data-format="json">
                    <i class="bi bi-filetype-json me-2"></i>导出为JSON
                  </button>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // 将模态框添加到body
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // 初始化Bootstrap模态框
      this.exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
      console.log('Export modal created');
    },

    // 绑定事件处理程序
    bindEvents() {
      // 导出按钮点击事件
      const exportAllBtn = document.getElementById('export-all-btn');
      if (exportAllBtn) {
        exportAllBtn.addEventListener('click', () => {
          this.currentExportType = 'all';
          console.log('Export all button clicked, currentExportType set to:', this.currentExportType);
          this.exportModal.show();
        });
      } else {
        console.error('export-all-btn not found, event listener not added');
      }

      const exportCurrentBtn = document.getElementById('export-current-btn');
      if (exportCurrentBtn) {
        exportCurrentBtn.addEventListener('click', () => {
          this.currentExportType = 'current';
          console.log('Export current button clicked, currentExportType set to:', this.currentExportType);
          this.exportModal.show();
        });
      } else {
        console.error('export-current-btn not found, event listener not added');
      }

      // 格式选择按钮点击事件
      document.querySelectorAll('.export-format-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const format = e.currentTarget.dataset.format;
          console.log('Export format selected:', format, 'for export type:', this.currentExportType);
          this.exportModal.hide();
          this.handleExport(format);
        });
      });
    },

    // 处理导出
    handleExport(format) {
      console.log('Handling export, type:', this.currentExportType, 'format:', format);
      if (this.currentExportType === 'all') {
        this.exportAllNotes(format);
      } else if (this.currentExportType === 'current') {
        this.exportCurrentNote(format);
      } else {
        console.error('Unknown export type:', this.currentExportType);
        alert('导出类型错误，请重试');
      }
    },

    // 获取所有笔记 - 尝试多种可能的localStorage键名
    getAllNotes() {
      console.log('getAllNotes: 尝试获取所有笔记数据');
      // 从localStorage获取笔记数据，使用正确的键名
      const notesData = localStorage.getItem('chain-notes-data-bs');
      console.log('getAllNotes: 从localStorage获取数据:', notesData);
      
      if (!notesData) {
        console.log('getAllNotes: 未找到笔记数据');
        return [];
      }
      
      try {
        const notes = JSON.parse(notesData);
        console.log('getAllNotes: 解析笔记数据成功，共', notes.length, '条笔记');
        return Array.isArray(notes) ? notes : [];
      } catch (e) {
        console.error('getAllNotes: 解析笔记数据失败:', e);
        return [];
      }
    },

    // 获取当前笔记
    getCurrentNote() {
      console.log('getCurrentNote: 尝试获取当前笔记');
      
      // 获取当前笔记ID
      const currentNoteIdEl = document.getElementById('current-note-id');
      if (!currentNoteIdEl) {
        console.error('getCurrentNote: 未找到current-note-id元素');
        return null;
      }
      
      const currentNoteIdText = currentNoteIdEl.textContent.trim();
      const currentNoteId = parseInt(currentNoteIdText, 10);
      console.log('getCurrentNote: 当前笔记ID文本:', currentNoteIdText, '解析后ID:', currentNoteId);
      
      if (isNaN(currentNoteId)) {
        console.error('getCurrentNote: 无法解析当前笔记ID');
        return null;
      }
      
      // 获取所有笔记
      const allNotes = this.getAllNotes();
      
      // 查找当前笔记
      const currentNote = allNotes.find(note => note.id === currentNoteId);
      console.log('getCurrentNote: 查找结果:', currentNote);
      
      return currentNote || null;
    },

    // 导出全部笔记
    exportAllNotes(format) {
      console.log('Exporting all notes with format:', format);
      const notes = this.getAllNotes();
      

      if (notes.length === 0) {
        console.log('No notes found for export');
        alert('没有找到可导出的笔记\n请确认您已创建并保存笔记');
        return;
      }

      this.exportNotes(notes, format, false);
    },

    // 导出当前笔记
    exportCurrentNote(format) {
      console.log('Exporting current note with format:', format);
      const note = this.getCurrentNote();
      

      if (!note) {
        console.log('No current note selected');
        alert('没有选中的笔记\n请先选择一篇笔记再尝试导出');
        return;
      }

      this.exportNotes([note], format, true);
    },

    // 根据格式导出笔记
    exportNotes(notes, format, isSingleNote = false) {
      let content, fileName, contentType;

      switch(format) {
        case 'txt':
          content = this.generateTXT(notes, isSingleNote);
          fileName = isSingleNote ? `${notes[0].title.replace(/\//g, '-')}.txt` : 'all-notes.txt';
          contentType = 'text/plain';
          break;
        case 'md':
          content = this.generateMarkdown(notes, isSingleNote);
          fileName = isSingleNote ? `${notes[0].title.replace(/\//g, '-')}.md` : 'all-notes.md';
          contentType = 'text/markdown';
          break;
        case 'json':
        default:
          content = this.generateJSON(notes, isSingleNote);
          fileName = isSingleNote ? `${notes[0].title.replace(/\//g, '-')}.json` : 'all-notes.json';
          contentType = 'application/json';
          break;
      }

      // 如果是全部导出，且不是JSON格式，使用ZIP打包
      if (!isSingleNote && format !== 'json') {
        this.generateZIP(notes, format);
        return;
      }

      this.downloadFile(content, fileName, contentType);
    },

    // 生成TXT格式
    generateTXT(notes, isSingleNote) {
      if (isSingleNote) {
        const note = notes[0];
        return `# ${note.title}\n\n${note.content}`;
      }

      return notes.map(note => {
        return `# ${note.title}\n\n${note.content}\n\n---\n\n`;
      }).join('');
    },

    // 生成Markdown格式
    generateMarkdown(notes, isSingleNote) {
      if (isSingleNote) {
        const note = notes[0];
        return `# ${note.title}\n\n${note.content}`;
      }

      return notes.map(note => {
        return `# ${note.title}\n\n${note.content}\n\n---\n\n`;
      }).join('');
    },

    // 生成JSON格式
    generateJSON(notes, isSingleNote) {
      return JSON.stringify(notes, null, 2);
    },

    // 生成ZIP文件（仅用于全部导出）
    generateZIP(notes, format) {
      // 懒加载JSZip库
      if (typeof JSZip === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        script.onload = () => this.doGenerateZIP(notes, format);
        document.head.appendChild(script);
      } else {
        this.doGenerateZIP(notes, format);
      }
    },

    // 实际生成ZIP文件
    doGenerateZIP(notes, format) {
      const zip = new JSZip();
      const extension = format === 'txt' ? 'txt' : 'md';

      notes.forEach(note => {
        let content;
        if (format === 'txt') {
          content = this.generateTXT([note], true);
        } else {
          content = this.generateMarkdown([note], true);
        }
        zip.file(`${note.title.replace(/\//g, '-')}.${extension}`, content);
      });

      zip.generateAsync({type: 'blob'}).then(content => {
        this.downloadFile(content, `all-notes.zip`, 'application/zip');
      }).catch(error => {
        console.error('Error generating ZIP file:', error);
        alert('生成ZIP文件时出错: ' + error.message);
      });
    },

    // 下载文件
    downloadFile(content, fileName, contentType) {
      try {
        // 如果是字符串内容，转换为Blob
        if (typeof content === 'string') {
          content = new Blob([content], {type: contentType});
        }

        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('File downloaded successfully:', fileName);
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('下载文件时出错: ' + error.message);
      }
    }
  };

  // 初始化导出模块
  ExportModule.init();
});