document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const timerText = document.querySelector('.timer-text');
    const timerModeText = document.querySelector('.timer-mode-text');
    const timerProgress = document.querySelector('.timer-progress');
    const timerBg = document.querySelector('.timer-bg');
    const startBtn = document.querySelector('.start');
    const pauseBtn = document.querySelector('.pause');
    const resetBtn = document.querySelector('.reset');
    const modeButtons = document.querySelectorAll('.timer-mode button');
    const workDurationInput = document.getElementById('work-duration');
    const shortBreakDurationInput = document.getElementById('short-break-duration');
    const longBreakDurationInput = document.getElementById('long-break-duration');
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
    const tasksLeft = document.getElementById('tasks-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const rangeButtons = document.querySelectorAll('.range-btn');
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationClose = document.getElementById('notification-close');
    const autoStartToggle = document.getElementById('auto-start');
    const darkThemeToggle = document.getElementById('dark-theme');
    const focusModeToggle = document.getElementById('focus-mode');

    // Статистические элементы
    const todayPomodoros = document.getElementById('today-pomodoros');
    const weekPomodoros = document.getElementById('week-pomodoros');
    const totalPomodoros = document.getElementById('total-pomodoros');
    const completedTasks = document.getElementById('completed-tasks');
    const sessionCount = document.getElementById('session-count');
    const tasksCount = document.getElementById('tasks-count');
    const tasksTotal = document.getElementById('tasks-total');
    const countAll = document.getElementById('count-all');
    const countActive = document.getElementById('count-active');
    const countCompleted = document.getElementById('count-completed');
    const dailyTrend = document.getElementById('daily-trend');
    const weeklyTrend = document.getElementById('weekly-trend');
    const totalHours = document.getElementById('total-hours');
    const taskProgress = document.getElementById('task-progress');
    const completionRate = document.getElementById('completion-rate');
    const productivityInsight = document.getElementById('productivity-insight');

    // Переменные состояния
    let timer;
    let timeLeft;
    let isRunning = false;
    let currentMode = 'work';
    let workDuration = parseInt(workDurationInput.value) * 60;
    let shortBreakDuration = parseInt(shortBreakDurationInput.value) * 60;
    let longBreakDuration = parseInt(longBreakDurationInput.value) * 60;
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let pomodoros = JSON.parse(localStorage.getItem('pomodoros')) || [];
    let currentFilter = 'all';
    let currentRange = 'week';
    let circumference = 2 * Math.PI * 90;
    let autoStart = localStorage.getItem('autoStart') === 'true';
    let darkTheme = localStorage.getItem('darkTheme') === 'true';
    let focusMode = localStorage.getItem('focusMode') === 'true';

    // Инициализация
    timeLeft = workDuration;
    updateTimerDisplay();
    loadTasks();
    updateStats();
    renderStatsGraph();
    updateInsights();
    
    // Восстановление настроек
    autoStartToggle.checked = autoStart;
    darkThemeToggle.checked = darkTheme;
    focusModeToggle.checked = focusMode;
    updateTheme();
    updateFocusMode();

    // Настройка прогресс-бара
    timerProgress.style.strokeDasharray = circumference;
    timerBg.style.strokeDasharray = circumference;
    timerProgress.style.strokeDashoffset = 0;

    // Функции таймера
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Обновление прогресс-бара
        const totalTime = getTotalTime();
        const offset = circumference - (timeLeft / totalTime) * circumference;
        timerProgress.style.strokeDashoffset = offset;
        
        // Обновление текста режима
        const modeText = {
            'work': 'Время работать!',
            'short-break': 'Короткий перерыв',
            'long-break': 'Длинный перерыв'
        };
        timerModeText.textContent = modeText[currentMode];
    }

    function getTotalTime() {
        switch(currentMode) {
            case 'work': return workDuration;
            case 'short-break': return shortBreakDuration;
            case 'long-break': return longBreakDuration;
            default: return workDuration;
        }
    }

    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            timer = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    isRunning = false;
                    playNotificationSound();
                    
                    if (currentMode === 'work') {
                        // Завершение работы, добавляем помидорку
                        addPomodoro();
                        updateStats();
                        renderStatsGraph();
                        updateInsights();
                        showNotification('Сессия завершена!', 'Время перерыва. Отдохните немного!');
                        
                        // Автоматически запускаем перерыв если включена опция
                        if (autoStart) {
                            switchMode('short-break');
                            startTimer();
                        }
                    } else {
                        showNotification('Перерыв окончен!', 'Время возвращаться к работе!');
                        
                        // Автоматически запускаем работу если включена опция
                        if (autoStart) {
                            switchMode('work');
                            startTimer();
                        }
                    }
                }
            }, 1000);
        }
    }

    function pauseTimer() {
        clearInterval(timer);
        isRunning = false;
        showNotification('Таймер на паузе', 'Нажмите "Старт" чтобы продолжить');
    }

    function resetTimer() {
        clearInterval(timer);
        isRunning = false;
        timeLeft = getTotalTime();
        updateTimerDisplay();
    }

    function switchMode(mode) {
        currentMode = mode;
        
        // Обновление активной кнопки режима
        modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Установка времени для выбранного режима
        timeLeft = getTotalTime();
        updateTimerDisplay();
        
        // Изменение цвета прогресс-бара
        const colors = {
            'work': '#6366f1',
            'short-break': '#06b6d4',
            'long-break': '#f59e0b'
        };
        timerProgress.style.stroke = colors[mode];
    }

    // Управление задачами
    function addTask() {
        const text = taskInput.value.trim();
        if (text !== '') {
            const task = {
                id: Date.now(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString(),
                pomodoros: 0
            };
            
            tasks.push(task);
            saveTasks();
            renderTask(task);
            taskInput.value = '';
            taskInput.focus();
            updateTaskStats();
        }
    }

    function renderTask(task) {
        if (!isTaskVisible(task)) return;
        
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <span class="task-pomodoro-count">${task.pomodoros} 🍅</span>
            <button class="task-delete"><i class="fas fa-trash"></i></button>
        `;
        
        taskList.appendChild(li);
        
        // Добавление обработчиков событий
        const checkbox = li.querySelector('.task-checkbox');
        const deleteBtn = li.querySelector('.task-delete');
        
        checkbox.addEventListener('change', () => toggleTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
    }

    function loadTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => renderTask(task));
        updateTaskStats();
    }

    function isTaskVisible(task) {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    }

    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        
        saveTasks();
        loadTasks();
        updateInsights();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        loadTasks();
        updateInsights();
    }

    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        loadTasks();
        updateInsights();
    }

    function updateTaskStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const active = total - completed;
        
        tasksLeft.textContent = active;
        tasksCount.textContent = active;
        tasksTotal.textContent = total;
        countAll.textContent = total;
        countActive.textContent = active;
        countCompleted.textContent = completed;
        completedTasks.textContent = completed;
        
        // Обновление прогресса выполнения задач
        const progress = total > 0 ? (completed / total) * 100 : 0;
        taskProgress.style.width = `${progress}%`;
        completionRate.textContent = `${Math.round(progress)}%`;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Статистика
    function addPomodoro() {
        const now = new Date();
        const pomodoro = {
            date: now.toISOString(),
            timestamp: now.getTime(),
            mode: currentMode,
            duration: currentMode === 'work' ? workDuration : (currentMode === 'short-break' ? shortBreakDuration : longBreakDuration)
        };
        
        pomodoros.push(pomodoro);
        localStorage.setItem('pomodoros', JSON.stringify(pomodoros));
        
        // Обновляем счетчик сессий сегодня
        updateSessionCount();
    }

    function updateSessionCount() {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const sessionsToday = pomodoros.filter(p => p.timestamp >= todayStart && p.mode === 'work').length;
        sessionCount.textContent = sessionsToday;
    }

    function updateStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
        
        const pomodorosToday = pomodoros.filter(p => p.timestamp >= todayStart && p.mode === 'work').length;
        const pomodorosThisWeek = pomodoros.filter(p => p.timestamp >= weekStart && p.mode === 'work').length;
        const pomodorosThisMonth = pomodoros.filter(p => p.timestamp >= monthStart && p.mode === 'work').length;
        const totalPomodoroCount = pomodoros.filter(p => p.mode === 'work').length;
        
        // Расчет общего времени в часах
        const totalMinutes = pomodoros.reduce((total, p) => total + (p.duration / 60), 0);
        const totalHoursValue = Math.round(totalMinutes / 60);
        
        todayPomodoros.textContent = pomodorosToday;
        weekPomodoros.textContent = pomodorosThisWeek;
        totalPomodoros.textContent = totalPomodoroCount;
        totalHours.textContent = `${totalHoursValue}ч`;
        
        // Обновление трендов
        updateTrends();
        updateSessionCount();
        updateTaskStats();
    }

    function updateTrends() {
        // Простая реализация трендов (можно улучшить)
        const randomTrend = Math.random() > 0.5 ? 'up' : 'down';
        const randomValue = Math.floor(Math.random() * 20) + 1;
        
        dailyTrend.className = `stat-trend ${randomTrend}`;
        dailyTrend.innerHTML = `<i class="fas fa-arrow-${randomTrend}"></i><span>${randomValue}%</span>`;
        
        weeklyTrend.className = `stat-trend ${randomTrend}`;
        weeklyTrend.innerHTML = `<i class="fas fa-arrow-${randomTrend}"></i><span>${randomValue}%</span>`;
    }

    function renderStatsGraph() {
        // Здесь будет реализация графиков с Chart.js
        // Для простоты оставим заглушку
        console.log('Graphs would be rendered here with Chart.js');
    }

    function updateInsights() {
        const completedCount = tasks.filter(t => t.completed).length;
        const totalCount = tasks.length;
        const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        
        let insight = '';
        
        if (pomodoros.length === 0) {
            insight = 'Начните вашу первую Pomodoro сессию! Ставьте задачи и работайте сфокусированно.';
        } else if (completionRate < 30) {
            insight = 'Попробуйте разбивать большие задачи на меньшие подзадачи. Это повысит вероятность их выполнения.';
        } else if (completionRate < 70) {
            insight = 'Хороший прогресс! Продолжайте в том же духе. Не забывайте делать перерывы между сессиями.';
        } else {
            insight = 'Отличная продуктивность! Вы завершаете большинство задач. Так держать!';
        }
        
        productivityInsight.textContent = insight;
    }

    // Уведомления
    function showNotification(title, message) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    function playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.2;
            
            oscillator.start();
            
            setTimeout(() => {
                oscillator.stop();
            }, 300);
        } catch (e) {
            console.log('Web Audio API не поддерживается в этом браузере');
        }
    }

    // Темная тема и режим фокусировки
    function updateTheme() {
        if (darkTheme) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('darkTheme', darkTheme);
    }

    function updateFocusMode() {
        if (focusMode) {
            document.body.classList.add('focus-mode');
            showNotification('Режим фокуса', 'Посторонние элементы затемнены для лучшей концентрации');
        } else {
            document.body.classList.remove('focus-mode');
        }
        localStorage.setItem('focusMode', focusMode);
    }

    // Обработчики событий
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!isRunning) {
                switchMode(button.dataset.mode);
            }
        });
    });
    
    // Обработчики для кнопок +/- в настройках таймера
    document.querySelectorAll('.btn-increment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.parentElement.querySelector('input');
            input.value = Math.min(parseInt(input.max), parseInt(input.value) + 1);
            updateDuration(input);
        });
    });
    
    document.querySelectorAll('.btn-decrement').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.parentElement.querySelector('input');
            input.value = Math.max(parseInt(input.min), parseInt(input.value) - 1);
            updateDuration(input);
        });
    });
    
    function updateDuration(input) {
        const value = parseInt(input.value) * 60;
        switch(input.id) {
            case 'work-duration': 
                workDuration = value;
                if (currentMode === 'work' && !isRunning) timeLeft = value;
                break;
            case 'short-break-duration': 
                shortBreakDuration = value;
                if (currentMode === 'short-break' && !isRunning) timeLeft = value;
                break;
            case 'long-break-duration': 
                longBreakDuration = value;
                if (currentMode === 'long-break' && !isRunning) timeLeft = value;
                break;
        }
        updateTimerDisplay();
    }
    
    workDurationInput.addEventListener('change', () => updateDuration(workDurationInput));
    shortBreakDurationInput.addEventListener('change', () => updateDuration(shortBreakDurationInput));
    longBreakDurationInput.addEventListener('change', () => updateDuration(longBreakDurationInput));
    
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            loadTasks();
        });
    });
    
    rangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            rangeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentRange = button.dataset.range;
            renderStatsGraph();
        });
    });
    
    autoStartToggle.addEventListener('change', () => {
        autoStart = autoStartToggle.checked;
        localStorage.setItem('autoStart', autoStart);
    });
    
    darkThemeToggle.addEventListener('change', () => {
        darkTheme = darkThemeToggle.checked;
        updateTheme();
    });
    
    focusModeToggle.addEventListener('change', () => {
        focusMode = focusModeToggle.checked;
        updateFocusMode();
    });
    
    notificationClose.addEventListener('click', () => {
        notification.classList.remove('show');
    });

    // Инициализация графиков
    function initCharts() {
        // Заглушка для инициализации графиков
        // В реальном приложении здесь был бы код для создания графиков с Chart.js
        console.log('Charts initialized');
    }

    initCharts();
});