document.addEventListener('DOMContentLoaded', () => {
    // Элементы
    const canvas = document.getElementById('main-canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('canvas-container');
    
    // Настройка размеров
    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Состояние
    let isDrawing = false;
    let currentTool = 'text'; // 'text' или 'draw'
    let currentColor = '#000000';
    let lastX = 0;
    let lastY = 0;

    // Инструменты
    document.getElementById('text-btn').addEventListener('click', () => {
        currentTool = currentTool === 'text' ? null : 'text';
        updateToolButtons();
        canvas.style.cursor = currentTool === 'text' ? 'text' : 'default';
    });

    document.getElementById('draw-btn').addEventListener('click', () => {
        currentTool = currentTool === 'draw' ? null : 'draw';
        updateToolButtons();
        canvas.style.cursor = currentTool === 'draw' ? 'crosshair' : 'default';
    });

    document.getElementById('color-picker').addEventListener('input', (e) => {
        currentColor = e.target.value;
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    function updateToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (currentTool === 'text') {
            document.getElementById('text-btn').classList.add('active');
        } else if (currentTool === 'draw') {
            document.getElementById('draw-btn').classList.add('active');
        }
    }

    // Обработка рисования
    canvas.addEventListener('mousedown', startAction);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endAction);
    canvas.addEventListener('mouseout', endAction);

    function startAction(e) {
        if (!currentTool) return;
        
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;

        if (currentTool === 'text') {
            addText(lastX, lastY);
        } else if (currentTool === 'draw') {
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
        }
    }

    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x;
        lastY = y;
    }

    function endAction() {
        isDrawing = false;
    }

    // Добавление текста
    function addText(x, y) {
        const text = prompt('Введите текст:', '');
        if (!text) return;
        
        ctx.font = '16px Arial';
        ctx.fillStyle = currentColor;
        ctx.fillText(text, x, y);
    }

    // Изначально активируем режим текста
    document.getElementById('text-btn').click();
});