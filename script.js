document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const notesList = document.getElementById('notesList');
    const editorContainer = document.getElementById('editorContainer');
    const newNoteBtn = document.getElementById('newNoteBtn');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const startNewNote = document.getElementById('startNewNote');
    const toolbarPanel = document.getElementById('toolbarPanel');
    
    // Инструменты
    const textTool = document.getElementById('textTool');
    const photoTool = document.getElementById('photoTool');
    const drawTool = document.getElementById('drawTool');
    const drawingTools = document.getElementById('drawingTools');
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    
    // Модальные окна
    const photoModal = document.getElementById('photoModal');
    const saveModal = document.getElementById('saveModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    // Кнопки для фото
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const photoPreview = document.getElementById('photoPreview');
    const addPhotoToNote = document.getElementById('addPhotoToNote');
    
    // Кнопки для сохранения
    const noteTitleInput = document.getElementById('noteTitle');
    const cancelSaveBtn = document.getElementById('cancelSaveBtn');
    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    
    // Переменные состояния
    let currentNoteId = null;
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let photoDataUrl = '';
    let activeTool = 'text';
    let isDrawing = false;
    let currentColor = '#000000';
    let canvasItems = [];
    let selectedItem = null;
    let startX, startY;
    
    // Инициализация приложения
    init();
    
    function init() {
        renderNotesList();
        setupEventListeners();
        
        // Проверяем, поддерживает ли браузер PWA функциональность
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('ServiceWorker registration successful');
                }).catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
            });
        }
    }
    
    function setupEventListeners() {
        // Новая заметка
        newNoteBtn.addEventListener('click', createNewNote);
        startNewNote.addEventListener('click', createNewNote);
        saveNoteBtn.addEventListener('click', showSaveModal);
        
        // Инструменты
        textTool.addEventListener('click', () => setActiveTool('text'));
        photoTool.addEventListener('click', () => setActiveTool('photo'));
        drawTool.addEventListener('click', () => setActiveTool('draw'));
        
        // Цвета для рисования
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                currentColor = option.dataset.color;
            });
        });
        
        clearCanvasBtn.addEventListener('click', clearCanvas);
        
        // Модальные окна
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                photoModal.style.display = 'none';
                saveModal.style.display = 'none';
            });
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === photoModal) photoModal.style.display = 'none';
            if (e.target === saveModal) saveModal.style.display = 'none';
        });
        
        // Фото
        takePhotoBtn.addEventListener('click', takePhoto);
        uploadPhotoBtn.addEventListener('click', uploadPhoto);
        addPhotoToNote.addEventListener('click', addPhotoToCanvas);
        
        // Сохранение
        cancelSaveBtn.addEventListener('click', () => {
            saveModal.style.display = 'none';
        });
        
        confirmSaveBtn.addEventListener('click', saveNote);
        document.getElementById('deleteTextBtn').addEventListener('click', () => {
    if (selectedItem && selectedItem.type === 'text') {
        selectedItem.element.remove();
        canvasItems = canvasItems.filter(item => item.id !== selectedItem.id);
        selectedItem = null;
    }
});
    }
    
    function renderNotesList() {
        notesList.innerHTML = '';
        
        if (notes.length === 0) {
            notesList.innerHTML = '<p class="empty-notes">Нет сохраненных заметок</p>';
            return;
        }
        
        notes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.dataset.id = note.id;
            
            noteEl.innerHTML = `
                <h3>${note.title || 'Без названия'}</h3>
                <p>${new Date(note.updatedAt).toLocaleString()}</p>
            `;
            
            noteEl.addEventListener('click', () => {
                document.querySelectorAll('.note-item').forEach(item => {
                    item.classList.remove('active');
                });
                noteEl.classList.add('active');
                loadNote(note.id);
            });
            
            notesList.appendChild(noteEl);
        });
    }
    
    function createNewNote() {
        currentNoteId = Date.now().toString();
        
        // Скрываем welcome screen
        document.querySelector('.welcome-screen').style.display = 'none';
        
        // Очищаем редактор
        editorContainer.innerHTML = '';
        
        // Создаем canvas для заметки
        const noteCanvas = document.createElement('div');
        noteCanvas.className = 'note-canvas';
        noteCanvas.id = 'noteCanvas';
        editorContainer.appendChild(noteCanvas);
        
        // Показываем панель инструментов
        toolbarPanel.style.display = 'flex';
        saveNoteBtn.style.display = 'block';
        
        // Устанавливаем инструмент по умолчанию
        setActiveTool('text');
        
        // Очищаем массив элементов
        canvasItems = [];
        selectedItem = null;
    }
    
    function setActiveTool(tool) {
    activeTool = tool;
    
    // Обновляем активные кнопки
    textTool.classList.remove('active');
    photoTool.classList.remove('active');
    drawTool.classList.remove('active');
    
    if (tool === 'text') {
        textTool.classList.add('active');
        drawingTools.style.display = 'none';
        textTools.style.display = 'flex';
        setupTextMode();
    } else if (tool === 'photo') {
        photoTool.classList.add('active');
        drawingTools.style.display = 'none';
        textTools.style.display = 'none';
        showPhotoModal();
    } else if (tool === 'draw') {
        drawTool.classList.add('active');
        drawingTools.style.display = 'flex';
        textTools.style.display = 'none';
        setupDrawMode();
    }
}
    
function setupTextMode() {
    const noteCanvas = document.getElementById('noteCanvas');
    
    noteCanvas.onclick = (e) => {
        if (activeTool !== 'text' || e.target !== noteCanvas) return;
        
        // Создаем новый текстовый элемент
        const textItem = document.createElement('div');
        textItem.className = 'canvas-item text-item';
        textItem.contentEditable = true;
        textItem.style.left = `${e.clientX - noteCanvas.getBoundingClientRect().left}px`;
        textItem.style.top = `${e.clientY - noteCanvas.getBoundingClientRect().top}px`;
        textItem.innerHTML = 'Нажмите чтобы редактировать текст';
        
        // Создаем кнопку удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTextItem(textItem);
        };
        
        // Добавляем элементы на canvas
        textItem.appendChild(deleteBtn);
        noteCanvas.appendChild(textItem);
        
        // Добавляем в массив элементов
        const itemId = Date.now().toString();
        canvasItems.push({
            id: itemId,
            type: 'text',
            element: textItem,
            x: parseInt(textItem.style.left),
            y: parseInt(textItem.style.top),
            width: 200,
            height: 50,
            content: 'Нажмите чтобы редактировать текст'
        });
        
        // Устанавливаем обработчики для перемещения
        setupItemInteractions(textItem, itemId);
        
        // Фокусируемся на новом элементе
        textItem.focus();
    };
}

function deleteTextItem(element) {
    // Удаляем из DOM
    element.remove();
    
    // Удаляем из массива элементов
    canvasItems = canvasItems.filter(item => item.element !== element);
}
    
    function showPhotoModal() {
        photoDataUrl = '';
        photoPreview.style.display = 'none';
        addPhotoToNote.disabled = true;
        photoModal.style.display = 'flex';
    }
    
    function takePhoto() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Ваш браузер не поддерживает доступ к камере или у вас нет разрешения');
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                video.addEventListener('canplay', () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    photoDataUrl = canvas.toDataURL('image/png');
                    photoPreview.src = photoDataUrl;
                    photoPreview.style.display = 'block';
                    addPhotoToNote.disabled = false;
                    
                    stream.getTracks().forEach(track => track.stop());
                });
            })
            .catch(err => {
                console.error('Ошибка доступа к камере:', err);
                alert('Не удалось получить доступ к камере: ' + err.message);
            });
    }
    
    function uploadPhoto() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                photoDataUrl = event.target.result;
                photoPreview.src = photoDataUrl;
                photoPreview.style.display = 'block';
                addPhotoToNote.disabled = false;
            };
            reader.readAsDataURL(file);
        });
        
        input.click();
    }
    
function addPhotoToCanvas() {
    if (!photoDataUrl) return;
    
    const noteCanvas = document.getElementById('noteCanvas');
    const rect = noteCanvas.getBoundingClientRect();
    
    // Создаем элемент изображения
    const img = document.createElement('img');
    img.className = 'canvas-item photo-item';
    img.src = photoDataUrl;
    img.style.left = `${rect.width / 2 - 100}px`;
    img.style.top = `${rect.height / 2 - 100}px`;
    
    // Создаем кнопку удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        img.remove();
        canvasItems = canvasItems.filter(item => item.element !== img);
    };
    
    // Добавляем элементы
    img.appendChild(deleteBtn);
    noteCanvas.appendChild(img);
    
    // Добавляем в массив элементов
    const itemId = Date.now().toString();
    canvasItems.push({
        id: itemId,
        type: 'photo',
        element: img,
        x: parseInt(img.style.left),
        y: parseInt(img.style.top),
        width: 200,
        height: 200,
        content: photoDataUrl
    });
    
    // Устанавливаем обработчики для перемещения
    setupItemInteractions(img, itemId);
    
    // Закрываем модальное окно
    photoModal.style.display = 'none';
}
    
function setupDrawMode() {
    const noteCanvas = document.getElementById('noteCanvas');
    
    // Удаляем предыдущий canvas для рисования
    const prevCanvas = document.querySelector('.drawing-item');
    if (prevCanvas) return; // Не создаем новый, если уже есть
    
    // Создаем новый canvas для рисования
    const canvas = document.createElement('canvas');
    canvas.className = 'drawing-item';
    canvas.width = noteCanvas.offsetWidth;
    canvas.height = noteCanvas.offsetHeight;
    
    noteCanvas.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Функция для получения позиции с учетом прокрутки
    function getPosition(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    // Обработчики для мыши
    canvas.addEventListener('mousedown', (e) => {
        if (activeTool !== 'draw') return;
        
        const pos = getPosition(e);
        isDrawing = true;
        [lastX, lastY] = [pos.x, pos.y];
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing || activeTool !== 'draw') return;
        
        const pos = getPosition(e);
        
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        [lastX, lastY] = [pos.x, pos.y];
    });
    
    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });
    
    canvas.addEventListener('mouseout', () => {
        isDrawing = false;
    });
}
    
function setupItemInteractions(element, itemId) {
    let isDragging = false;
    let offsetX, offsetY;
    let startWidth, startHeight;
    
    element.onmousedown = (e) => {
        if (activeTool === 'draw' || e.target.classList.contains('delete-btn')) return;
        
        // Выбираем элемент
        selectItem(itemId);
        
        // Начинаем перемещение
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;
        
        // Для текстовых элементов - разрешаем редактирование
        if (element.classList.contains('text-item')) {
            element.contentEditable = true;
            element.focus();
        }
        
        e.stopPropagation();
    };
    
    // Для текстовых элементов - отключаем редактирование при потере фокуса
    if (element.classList.contains('text-item')) {
        element.onblur = () => {
            element.contentEditable = false;
            
            // Обновляем содержимое в массиве элементов
            const item = canvasItems.find(item => item.id === itemId);
            if (item) {
                item.content = element.innerHTML;
                item.width = element.offsetWidth;
                item.height = element.offsetHeight;
            }
        };
    }
    
    document.onmousemove = (e) => {
        if (!isDragging) return;
        
        const noteCanvas = document.getElementById('noteCanvas');
        const rect = noteCanvas.getBoundingClientRect();
        
        let newX = e.clientX - rect.left - offsetX;
        let newY = e.clientY - rect.top - offsetY;
        
        // Ограничиваем перемещение в пределах canvas
        newX = Math.max(0, Math.min(newX, rect.width - element.offsetWidth));
        newY = Math.max(0, Math.min(newY, rect.height - element.offsetHeight));
        
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
        
        // Обновляем позицию в массиве
        const item = canvasItems.find(item => item.id === itemId);
        if (item) {
            item.x = newX;
            item.y = newY;
        }
    };
    
    document.onmouseup = () => {
        isDragging = false;
    };
}
    
    function selectItem(itemId) {
        // Снимаем выделение со всех элементов
        document.querySelectorAll('.canvas-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Выделяем выбранный элемент
        const item = canvasItems.find(item => item.id === itemId);
        if (item) {
            item.element.classList.add('selected');
            selectedItem = item;
        }
    }
    
    
function clearCanvas() {
    const canvas = document.querySelector('.drawing-item');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
    
    function showSaveModal() {
        saveModal.style.display = 'flex';
        noteTitleInput.focus();
    }
    
    function saveNote() {
        const title = noteTitleInput.value.trim() || 'Без названия';
        
        // Собираем данные всех элементов на canvas
        const noteCanvas = document.getElementById('noteCanvas');
        const itemsData = canvasItems.map(item => {
            return {
                type: item.type,
                x: item.x,
                y: item.y,
                width: item.element.offsetWidth,
                height: item.element.offsetHeight,
                content: item.type === 'text' ? item.element.innerHTML : item.content
            };
        });
        
        // Получаем canvas с рисунком
        const drawingCanvas = document.querySelector('.drawing-item');
        let drawingData = '';
        if (drawingCanvas) {
            drawingData = drawingCanvas.toDataURL('image/png');
        }
        
        // Проверяем, новая это заметка или редактирование существующей
        const existingNoteIndex = notes.findIndex(note => note.id === currentNoteId);
        
        if (existingNoteIndex !== -1) {
            // Обновляем существующую заметку
            notes[existingNoteIndex] = { 
                id: currentNoteId, 
                title, 
                items: itemsData, 
                drawing: drawingData,
                updatedAt: new Date().toISOString() 
            };
        } else {
            // Добавляем новую заметку
            notes.push({ 
                id: currentNoteId, 
                title, 
                items: itemsData, 
                drawing: drawingData,
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
            });
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('notes', JSON.stringify(notes));
        
        // Обновляем список заметок
        renderNotesList();
        
        // Закрываем модальное окно
        saveModal.style.display = 'none';
        noteTitleInput.value = '';
    }
    
    function loadNote(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;
        
        currentNoteId = noteId;
        
        // Скрываем welcome screen
        document.querySelector('.welcome-screen').style.display = 'none';
        
        // Очищаем редактор
        editorContainer.innerHTML = '';
        
        // Создаем canvas для заметки
        const noteCanvas = document.createElement('div');
        noteCanvas.className = 'note-canvas';
        noteCanvas.id = 'noteCanvas';
        editorContainer.appendChild(noteCanvas);
        
        // Показываем панель инструментов
        toolbarPanel.style.display = 'flex';
        saveNoteBtn.style.display = 'block';
        
        // Очищаем массив элементов
        canvasItems = [];
        selectedItem = null;
        
        // Восстанавливаем элементы
        note.items.forEach(itemData => {
            let element;
            
            if (itemData.type === 'text') {
                element = document.createElement('div');
                element.className = 'canvas-item text-item';
                element.contentEditable = true;
                element.innerHTML = itemData.content;
            } else if (itemData.type === 'photo') {
                element = document.createElement('img');
                element.className = 'canvas-item photo-item';
                element.src = itemData.content;
            }
            
            element.style.left = `${itemData.x}px`;
            element.style.top = `${itemData.y}px`;
            element.style.width = `${itemData.width}px`;
            element.style.height = `${itemData.height}px`;
            
            noteCanvas.appendChild(element);
            
            // Добавляем в массив элементов
            const itemId = Date.now().toString();
            canvasItems.push({
                id: itemId,
                type: itemData.type,
                element: element,
                x: itemData.x,
                y: itemData.y,
                width: itemData.width,
                height: itemData.height,
                content: itemData.content
            });
            
            // Устанавливаем обработчики для перемещения
            setupItemInteractions(element, itemId);
        });
        
        // Восстанавливаем рисунок
        if (note.drawing) {
            setActiveTool('draw');
            const canvas = document.querySelector('.drawing-item');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = note.drawing;
        } else {
            setActiveTool('text');
        }
    }
    
    // Для PWA
    window.addEventListener('appinstalled', () => {
        console.log('Приложение успешно установлено');
    });
});
