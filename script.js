document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskGrid = document.getElementById('task-grid');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const taskForm = document.getElementById('task-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const notificationBanner = document.getElementById('notification-banner');

    // --- State ---
    let tasks = [];
    let settings = {
        suggestionStrategy: 'hardFirst'
    };
    let filters = {
        type: 'all',
        startDate: '',
        endDate: '',
        subject: '',
        searchTerm: ''
    };
    let currentView = 'all'; // Default to 'all' view
    let sortable = null;
    let calendarDate = new Date();
    let completionChart = null;
    let typeChart = null;
    
    // --- Constants for GitHub ---
    // The GITHUB_TOKEN will be replaced by the GitHub Actions workflow during deployment.
    // Keep this empty in your local code.
    const GITHUB_TOKEN = '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'; 
    const GITHUB_USERNAME = 'GarvitSinghal1';
    const GITHUB_REPO = 'adcplannerDATA';
    const FILE_PATH = 'data/tasks.json';
    const API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // --- Color Mappings ---
    const typeColorClasses = {
        school: {
            bg: 'bg-blue-100', text: 'text-blue-800',
            darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-200'
        },
        coaching: {
            bg: 'bg-green-100', text: 'text-green-800',
            darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-200'
        },
        'self-study': {
            bg: 'bg-yellow-100', text: 'text-yellow-800',
            darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-200'
        }
    };
    const typeColors = {
        school: 'blue',
        coaching: 'green',
        'self-study': 'yellow'
    };
    const priorityColors = {
        high: 'red',
        medium: 'orange',
        low: 'gray'
    };
    const priorityTextColors = {
        high: 'text-red-800',
        medium: 'text-orange-800',
        low: 'text-gray-800'
    };
    const priorityBgColors = {
        high: 'bg-red-100',
        medium: 'bg-orange-100',
        low: 'bg-gray-100'
    };
    
    // --- Functions ---

    const showNotification = (message, isError = false) => {
        notificationBanner.textContent = message;
        notificationBanner.className = 'notification-banner'; // Reset classes
        if (isError) {
            notificationBanner.classList.add('bg-red-500', 'text-white', 'p-3', 'text-center', 'fixed', 'top-0', 'left-0', 'w-full', 'z-50');
        } else {
            notificationBanner.classList.add('bg-green-500', 'text-white', 'p-3', 'text-center', 'fixed', 'top-0', 'left-0', 'w-full', 'z-50');
        }
        notificationBanner.style.transform = 'translateY(0)';

        setTimeout(() => {
            notificationBanner.style.transform = 'translateY(-100%)';
        }, 5000);
    };

    const saveTasksToGithub = async () => {
        // Fallback to localStorage if no token is provided.
        if (!GITHUB_TOKEN) {
            showNotification("GitHub token not provided. Cannot save tasks.", true);
            return;
        }

        try {
            let sha;
            // Before writing, we must get the latest SHA of the file
            try {
                const response = await fetch(API_URL, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    sha = data.sha;
                } else if (response.status !== 404) {
                    throw new Error(`Could not fetch file from GitHub. Status: ${response.status}`);
                }
            } catch (error) {
                console.error("Error checking for existing file on GitHub:", error);
                // We can continue, as 'sha' will be undefined, resulting in a file creation.
            }

            const contentToSave = JSON.stringify({ settings, tasks }, null, 2);
            // Base64 encode the file content
            const encodedContent = btoa(unescape(encodeURIComponent(contentToSave)));

            const payload = {
                message: `chore: update tasks from planner app`,
                content: encodedContent,
                sha: sha // Include SHA if updating, otherwise it's a create
            };

            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API Error: ${errorData.message}`);
            }
            console.log("Tasks saved to GitHub successfully.");
            showNotification("Tasks saved to GitHub successfully!", false);

        } catch (error) {
            console.error("Error saving tasks to GitHub:", error);
            showNotification(`Error: Could not save tasks to GitHub. Check token permissions.`, true);
        }
    };

    const parseDate = (dateString) => {
        if (!dateString) return null;
        const parts = dateString.split('-');
        // new Date(year, monthIndex, day)
        return new Date(parts[0], parts[1] - 1, parts[2]);
    };

    const loadTasks = async () => {
        try {
            const headers = { 'Accept': 'application/vnd.github.v3+json' };
            if (GITHUB_TOKEN) {
                headers['Authorization'] = `token ${GITHUB_TOKEN}`;
            }

            const response = await fetch(API_URL, { headers });
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('tasks.json not found on GitHub. Trying to load from localStorage or local file.');
                    tasks = [];
                    settings = { suggestionStrategy: 'hardFirst' };
                } else {
                     throw new Error(`Failed to load from GitHub. Status: ${response.status}`);
                }
            } else {
                const data = await response.json();
                if (data.content) {
                    const content = decodeURIComponent(escape(atob(data.content)));
                    try {
                        const parsedData = JSON.parse(content);
                        tasks = parsedData.tasks || [];
                        settings = parsedData.settings || { suggestionStrategy: 'hardFirst' };
                    } catch (e) {
                        console.error("Failed to parse data from GitHub, file may be corrupted.", e);
                        tasks = []; // Start fresh if parsing fails
                        settings = { suggestionStrategy: 'hardFirst' };
                    }
                } else {
                    // The file on GitHub exists but is empty.
                    tasks = [];
                }
                // Clear any local backup if GitHub load is successful
                localStorage.removeItem('tasks');
            }
            
            if (updateDynamicPriorities()) {
                await saveTasksToGithub();
            }
            if (processRecurringTasks()) {
                await saveTasksToGithub();
            }
            applyFiltersAndRender();
        } catch (error) {
            console.error("Error loading tasks:", error);
            taskGrid.innerHTML = `<p class="text-red-500 col-span-full">Could not load tasks. Check console for details.</p>`;
        }
    };

    // Render tasks in the grid
    const renderTasks = (tasksToRender) => {
        taskGrid.innerHTML = '';
        if (tasksToRender.length === 0) {
            let message = "No tasks match the current filters.";
            if (tasks.length > 0) {
                if (currentView === 'day') {
                    message = "You have no tasks due today. Select another view to see other tasks.";
                } else if (currentView === 'week') {
                    message = "You have no tasks due this week. Select another view to see other tasks.";
                }
            } else {
                message = "No tasks yet. Add one to get started!";
            }
            taskGrid.innerHTML = `<p class="text-gray-500 col-span-full">${message}</p>`;
            return;
        }

        tasksToRender.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border-l-4 task-${task.type} flex flex-col justify-between`;
            taskCard.dataset.id = task.id;

            const subtasks = task.subtasks || [];
            const completedSubtasks = subtasks.filter(st => st.completed).length;
            const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

            taskCard.innerHTML = `
                <div>
                    <div class="flex justify-between items-start">
                        <h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                            ${task.recurring && task.recurring.frequency !== 'none' ? '<i class="fas fa-sync-alt text-blue-500 mr-2" title="Recurring Task"></i>' : ''}
                            ${task.title}
                        </h3>
                        <div class="priority-dot w-3 h-3 rounded-full priority-${task.priority}"></div>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1 capitalize">
                        <i class="fas fa-tag mr-2"></i>${task.type.replace('-', ' ')} ${task.subject ? `(${task.subject})` : ''}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1 capitalize">
                        <i class="fas fa-bolt mr-2"></i>Difficulty: ${task.difficulty}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <i class="fas fa-calendar-alt mr-2"></i>Due: ${parseDate(task.dueDate).toLocaleDateString()}
                    </p>
                    <p class="text-gray-700 dark:text-gray-300 text-sm">${task.notes || ''}</p>
                </div>

                <div class="mt-4">
                    ${subtasks.length > 0 ? `
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <p class="text-xs text-right mt-1 text-gray-500">${completedSubtasks} / ${subtasks.length} sub-tasks</p>
                    ` : ''}
                </div>

                <div class="flex justify-end mt-4 space-x-2">
                    <button class="edit-btn text-blue-500 hover:text-blue-700 dark:hover:text-blue-400" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn text-red-500 hover:text-red-700 dark:hover:text-red-400" title="Delete"><i class="fas fa-trash"></i></button>
                    ${!task.completed ? `<button class="complete-btn text-green-500 hover:text-green-700 dark:hover:text-green-400" title="Mark as Complete"><i class="fas fa-check-circle"></i></button>` : ''}
                </div>
            `;
            taskGrid.appendChild(taskCard);
        });
        
        initSortable();
    };

    const initSortable = () => {
        if (sortable) {
            sortable.destroy();
        }
        if (currentView === 'month') return; // Do not enable sorting on calendar view

        sortable = new Sortable(taskGrid, {
            animation: 150,
            ghostClass: 'bg-blue-100',
            onEnd: async (evt) => {
                const movedTask = tasks.splice(evt.oldIndex, 1)[0];
                tasks.splice(evt.newIndex, 0, movedTask);
                
                // When sorting occurs, we want to save the new order immediately.
                await saveTasksToGithub();
                // No need to re-render, Sortable handles the DOM change.
            }
        });
    };

    // --- Modal Handling ---
    const openModal = (task = null) => {
        taskForm.reset();
        if (task) {
            modalTitle.textContent = 'Edit Task';
            document.getElementById('task-id').value = task.id;
            document.getElementById('title').value = task.title;
            document.getElementById('type').value = task.type;
            document.getElementById('priority').value = task.priority;
            document.getElementById('due-date').value = task.dueDate;
            document.getElementById('notes').value = task.notes;
            document.getElementById('subject').value = task.subject || '';
            document.getElementById('dynamic-priority').checked = task.dynamicPriority || false;
            document.getElementById('difficulty').value = task.difficulty || 'medium';
            document.getElementById('recurring-frequency').value = task.recurring ? task.recurring.frequency : 'none';
            renderSubtasksInModal(task.subtasks || []);
        } else {
            modalTitle.textContent = 'Add New Task';
            document.getElementById('task-id').value = '';
            renderSubtasksInModal([]);
            document.getElementById('recurring-frequency').value = 'none';
        }
        taskModal.classList.remove('hidden');
        taskModal.classList.add('flex');
        setTimeout(() => taskModal.children[0].classList.add('scale-100', 'opacity-100'), 10);
    };

    const closeModal = () => {
        taskModal.children[0].classList.remove('scale-100', 'opacity-100');
        setTimeout(() => taskModal.classList.add('hidden'), 300);
    };
    
    // --- Task CRUD Operations ---
    const saveTask = async (e) => {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const taskData = {
            id: id || `task-${new Date().getTime()}`,
            title: document.getElementById('title').value.trim(),
            type: document.getElementById('type').value,
            priority: document.getElementById('priority').value,
            dueDate: document.getElementById('due-date').value,
            notes: document.getElementById('notes').value.trim(),
            subject: document.getElementById('subject').value.trim(),
            dynamicPriority: document.getElementById('dynamic-priority').checked,
            difficulty: document.getElementById('difficulty').value,
            subtasks: getSubtasksFromModal(),
            recurring: {
                frequency: document.getElementById('recurring-frequency').value
            }
        };

        if (!taskData.title || !taskData.dueDate) {
            alert("Title and Due Date are required.");
            return;
        }

        if (id) { // Update existing task
            tasks = tasks.map(t => t.id === id ? taskData : t);
        } else { // Add new task
            tasks.push(taskData);
        }
        
        // Auto-complete task if all subtasks are checked
        const completedSubtasks = taskData.subtasks.filter(st => st.completed).length;
        if (taskData.subtasks.length > 0 && completedSubtasks === taskData.subtasks.length) {
            taskData.completed = true;
            taskData.completedAt = new Date().toISOString();
        }

        updateDynamicPriorities();
        await saveTasksToGithub();
        
        applyFiltersAndRender();
        closeModal();
    };

    const deleteTask = async (id) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        tasks = tasks.filter(t => t.id !== id);
        await saveTasksToGithub();
        applyFiltersAndRender();
    };

    // --- New Features Logic ---
    const updateDynamicPriorities = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let prioritiesChanged = false;

        tasks.forEach(task => {
            if (!task.dynamicPriority || task.completed) return;

            const dueDate = parseDate(task.dueDate);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const originalPriority = task.priority;

            if (diffDays <= 2) {
                if (task.priority !== 'high') {
                    task.priority = 'high';
                    prioritiesChanged = true;
                }
            } else if (diffDays <= 7) {
                if (task.priority === 'low') {
                    task.priority = 'medium';
                    prioritiesChanged = true;
                }
            }
        });
        
        return prioritiesChanged;
    };
    
    const applyFiltersAndRender = () => {
        let filteredTasks;
        const activeTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        if (currentView === 'history') {
            filteredTasks = completedTasks;
        } else {
            // --- View-based Filtering on Active Tasks ---
            const today = new Date();
            today.setHours(0,0,0,0);

            if (currentView === 'day') {
                filteredTasks = activeTasks.filter(t => {
                    const dueDate = parseDate(t.dueDate);
                    return dueDate && dueDate.getTime() === today.getTime();
                });
            } else if (currentView === 'week') {
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
                startOfWeek.setDate(today.getDate() - dayOfWeek);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                filteredTasks = activeTasks.filter(t => {
                    const dueDate = parseDate(t.dueDate);
                    return dueDate && dueDate >= startOfWeek && dueDate <= endOfWeek;
                });
            } else if (currentView === 'month') {
                renderCalendar(); // Calendar handles its own filtering of active tasks
                return; 
            } else { // 'all' view
                 filteredTasks = activeTasks;
            }

            // --- User-defined Filtering ---
            // Type filter
            if (filters.type && filters.type !== 'all') {
                filteredTasks = filteredTasks.filter(t => t.type === filters.type);
            }

            // Date range filter
            if (filters.startDate) {
                const startDate = parseDate(filters.startDate);
                filteredTasks = filteredTasks.filter(t => {
                    const dueDate = parseDate(t.dueDate);
                    return dueDate && dueDate >= startDate;
                });
            }
            if (filters.endDate) {
                const endDate = parseDate(filters.endDate);
                filteredTasks = filteredTasks.filter(t => {
                    const dueDate = parseDate(t.dueDate);
                    return dueDate && dueDate <= endDate;
                });
            }

            // Subject filter
            if (filters.subject) {
                filteredTasks = filteredTasks.filter(t => t.subject && t.subject.toLowerCase().includes(filters.subject.toLowerCase()));
            }
            
            // Search term filter
            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                filteredTasks = filteredTasks.filter(t => 
                    t.title.toLowerCase().includes(term) || 
                    (t.notes && t.notes.toLowerCase().includes(term))
                );
            }
        }

        renderTasks(filteredTasks);
    };

    const renderCalendar = () => {
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYearHeader = document.getElementById('month-year-header');
        calendarGrid.innerHTML = ''; // Clear previous state

        const month = calendarDate.getMonth();
        const year = calendarDate.getFullYear();

        monthYearHeader.textContent = `${calendarDate.toLocaleString('default', { month: 'long' })} ${year}`;

        // Add day names
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'day-name';
            dayNameEl.textContent = day;
            calendarGrid.appendChild(dayNameEl);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Create blanks for days of previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const blankDay = document.createElement('div');
            blankDay.className = 'calendar-day other-month';
            calendarGrid.appendChild(blankDay);
        }

        // Create days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            const thisDate = new Date(year, month, i);
            
            if (thisDate.getTime() === new Date().setHours(0,0,0,0)) {
                dayCell.classList.add('today');
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = i;
            dayCell.appendChild(dayNumber);

            // Find and render tasks for this day
            const tasksForDay = tasks.filter(task => {
                if (task.completed) return false;
                const dueDate = parseDate(task.dueDate);
                return dueDate && dueDate.getTime() === thisDate.getTime();
            });

            tasksForDay.forEach(task => {
                const taskEl = document.createElement('div');
                const colorClasses = typeColorClasses[task.type] || typeColorClasses['school'];
                taskEl.className = `calendar-task ${colorClasses.bg} ${colorClasses.text} ${colorClasses.darkBg} ${colorClasses.darkText}`;
                taskEl.textContent = task.title;
                taskEl.title = task.title;
                taskEl.addEventListener('click', () => openModal(task));
                dayCell.appendChild(taskEl);
            });

            calendarGrid.appendChild(dayCell);
        }
    };

    const switchView = (newView) => {
        currentView = newView;
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active-view', btn.id === `view-${newView}`);
        });

        const calendarView = document.getElementById('calendar-view');
        const taskGridContainer = document.getElementById('task-grid-container');
        const dashboardView = document.getElementById('dashboard-view');
        const filtersView = document.getElementById('filters');

        calendarView.classList.add('hidden');
        taskGridContainer.classList.add('hidden');
        dashboardView.classList.add('hidden');
        filtersView.style.display = 'block'; // Show filters by default

        if (newView === 'month') {
            calendarView.classList.remove('hidden');
            filtersView.style.display = 'none';
        } else if (newView === 'dashboard') {
            dashboardView.classList.remove('hidden');
            renderDashboard();
            filtersView.style.display = 'none';
        } else if (newView === 'history') {
            taskGridContainer.classList.remove('hidden');
            filtersView.style.display = 'none';
        } else {
            taskGridContainer.classList.remove('hidden');
        }
        applyFiltersAndRender();
    };

    // --- Notifications ---
    const checkDueDateNotifications = () => {
        if (Notification.permission !== 'granted') return;

        const today = new Date();
        const activeTasks = tasks.filter(t => !t.completed);

        activeTasks.forEach(task => {
            const dueDate = parseDate(task.dueDate);
            const diffTime = dueDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) { // Due tomorrow
                new Notification('Upcoming Task Reminder', {
                    body: `"${task.title}" is due tomorrow!`,
                    icon: 'https://img.icons8.com/color/48/000000/planner.png'
                });
            } else if (diffDays === 0) { // Due today
                 new Notification('Task Due Today!', {
                    body: `Don't forget: "${task.title}" is due today.`,
                    icon: 'https://img.icons8.com/color/48/000000/planner.png'
                });
            }
        });
    };

    const requestNotificationPermission = () => {
        Notification.requestPermission().then(permission => {
            updateNotificationStatus();
            if (permission === 'granted') {
                checkDueDateNotifications();
            }
        });
    };

    const updateNotificationStatus = () => {
        const statusEl = document.getElementById('notification-status');
        if (!('Notification' in window)) {
            statusEl.textContent = 'This browser does not support notifications.';
            return;
        }
        statusEl.textContent = `Notification permission: ${Notification.permission}`;
    };

    // --- Dark Mode ---
    const setupTheme = () => {
        // On page load, check localStorage and apply the theme
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
            themeToggle.querySelector('.fa-sun').classList.add('hidden');
            themeToggle.querySelector('.fa-moon').classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            themeToggle.querySelector('.fa-sun').classList.remove('hidden');
            themeToggle.querySelector('.fa-moon').classList.add('hidden');
        }
    };

    const toggleTheme = () => {
        // Toggle the .dark class on the <html> element
        document.documentElement.classList.toggle('dark');

        // Update localStorage and icon visibility based on the new state
        if (document.documentElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.querySelector('.fa-sun').classList.add('hidden');
            themeToggle.querySelector('.fa-moon').classList.remove('hidden');
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.querySelector('.fa-sun').classList.remove('hidden');
            themeToggle.querySelector('.fa-moon').classList.add('hidden');
        }
    };

    // --- Event Listeners ---
    addTaskBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });
    taskForm.addEventListener('submit', saveTask);
    themeToggle.addEventListener('click', toggleTheme);
    
    taskGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) return;

        const taskId = card.dataset.id;
        const task = tasks.find(t => t.id === taskId);

        if (e.target.closest('.edit-btn')) {
            openModal(task);
        }
        if (e.target.closest('.delete-btn')) {
            deleteTask(taskId);
        }
        if (e.target.closest('.complete-btn')) {
            completeTask(taskId);
        }
    });
    
    // --- Filter Event Listeners ---
    document.querySelectorAll('.type-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentActive = document.querySelector('.type-filter.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            e.currentTarget.classList.add('active');
            filters.type = e.currentTarget.dataset.type;
            applyFiltersAndRender();
        });
    });

    document.getElementById('start-date-filter').addEventListener('change', (e) => {
        filters.startDate = e.target.value;
        applyFiltersAndRender();
    });
    document.getElementById('end-date-filter').addEventListener('change', (e) => {
        filters.endDate = e.target.value;
        applyFiltersAndRender();
    });
    document.getElementById('subject-filter').addEventListener('input', (e) => {
        filters.subject = e.target.value;
        applyFiltersAndRender();
    });
    document.getElementById('search-bar').addEventListener('input', (e) => {
        filters.searchTerm = e.target.value;
        applyFiltersAndRender();
    });

    // Calendar navigation
    document.getElementById('prev-month-btn').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('next-month-btn').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.id.replace('view-', '');
            switchView(view);
        });
    });

    // --- Suggestion Logic ---
    const suggestNextTask = () => {
        const suggestionModal = document.getElementById('suggestion-modal');
        const suggestedTaskCard = document.getElementById('suggested-task-card');
        const activeTasks = tasks.filter(t => !t.completed);

        if (activeTasks.length === 0) {
            suggestedTaskCard.innerHTML = `<p class="text-gray-500">You have no active tasks! Add one or check your history.</p>`;
            suggestionModal.classList.remove('hidden');
            suggestionModal.classList.add('flex');
            setTimeout(() => suggestionModal.children[0].classList.add('scale-100', 'opacity-100'), 10);
            return;
        }

        const scoredTasks = activeTasks.map(task => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = parseDate(task.dueDate);
            const daysUntilDue = Math.max(0, (dueDate - today) / (1000 * 60 * 60 * 24));

            const priorityMap = { low: 1, medium: 2, high: 3 };
            const difficultyMap = { easy: 1, medium: 2, hard: 3, 'very-hard': 4 };

            // Scoring Algorithm
            const dueDateScore = 100 / (daysUntilDue + 1); // Higher score for closer tasks
            const priorityScore = priorityMap[task.priority] * 20;
            let difficultyScore = difficultyMap[task.difficulty] * 10;
            
            // Adjust score based on user setting
            if (settings.suggestionStrategy === 'easyFirst') {
                difficultyScore = (50 - difficultyScore); // Invert the score
            }

            const totalScore = dueDateScore + priorityScore + difficultyScore;

            return { ...task, score: totalScore };
        });

        const bestTask = scoredTasks.sort((a, b) => b.score - a.score)[0];
        
        // Render the suggested task card
        suggestedTaskCard.innerHTML = `
            <div class="task-card bg-white dark:bg-gray-700 rounded-lg shadow-lg p-5 border-l-4 task-${bestTask.type} text-left">
                <h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-white">${bestTask.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1 capitalize"><i class="fas fa-tag mr-2"></i>${bestTask.type} (${bestTask.subject})</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-1 capitalize"><i class="fas fa-bolt mr-2"></i>${bestTask.difficulty}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4"><i class="fas fa-calendar-alt mr-2"></i>Due: ${parseDate(bestTask.dueDate).toLocaleDateString()}</p>
                <p class="text-gray-700 dark:text-gray-300 text-sm">${bestTask.notes || ''}</p>
            </div>
        `;
        
        suggestionModal.classList.remove('hidden');
        suggestionModal.classList.add('flex');
        setTimeout(() => suggestionModal.children[0].classList.add('scale-100', 'opacity-100'), 10);
    };

    const closeSuggestionModal = () => {
        const suggestionModal = document.getElementById('suggestion-modal');
        suggestionModal.children[0].classList.remove('scale-100', 'opacity-100');
        setTimeout(() => suggestionModal.classList.add('hidden'), 300);
    };

    // Suggestion button
    document.getElementById('suggest-task-btn').addEventListener('click', suggestNextTask);
    document.getElementById('close-suggestion-btn').addEventListener('click', closeSuggestionModal);
    document.getElementById('suggestion-modal').addEventListener('click', (e) => {
        if (e.target.id === 'suggestion-modal') closeSuggestionModal();
    });

    // --- Settings Modal Logic ---
    const openSettingsModal = () => {
        const settingsModal = document.getElementById('settings-modal');
        // Populate current settings
        document.getElementById('suggestion-strategy').value = settings.suggestionStrategy;
        updateNotificationStatus();
        
        settingsModal.classList.remove('hidden');
        settingsModal.classList.add('flex');
        setTimeout(() => settingsModal.children[0].classList.add('scale-100', 'opacity-100'), 10);
    };

    const closeSettingsModal = () => {
        const settingsModal = document.getElementById('settings-modal');
        settingsModal.children[0].classList.remove('scale-100', 'opacity-100');
        setTimeout(() => settingsModal.classList.add('hidden'), 300);
    };
    
    const saveSettings = async () => {
        settings.suggestionStrategy = document.getElementById('suggestion-strategy').value;
        await saveTasksToGithub();
        alert("Settings saved!");
        closeSettingsModal();
    };

    // Settings buttons
    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('cancel-settings-btn').addEventListener('click', closeSettingsModal);
    document.getElementById('settings-modal').addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') closeSettingsModal();
    });
    document.getElementById('enable-notifications-btn').addEventListener('click', requestNotificationPermission);

    // --- Dashboard & PDF Logic ---
    const renderDashboard = () => {
        const completedTasks = tasks.filter(t => t.completed);
        
        // Completion Chart
        const completionCtx = document.getElementById('completion-chart').getContext('2d');
        const tasksByCompletionDate = completedTasks.reduce((acc, task) => {
            const date = new Date(task.completedAt).toLocaleDateString();
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        const completionLabels = Object.keys(tasksByCompletionDate);
        const completionData = Object.values(tasksByCompletionDate);

        if (completionChart) completionChart.destroy();
        completionChart = new Chart(completionCtx, {
            type: 'line',
            data: {
                labels: completionLabels,
                datasets: [{
                    label: 'Tasks Completed per Day',
                    data: completionData,
                    borderColor: '#3b82f6',
                    tension: 0.1
                }]
            }
        });

        // Type Chart
        const typeCtx = document.getElementById('type-chart').getContext('2d');
        const tasksByType = tasks.reduce((acc, task) => {
            acc[task.type] = (acc[task.type] || 0) + 1;
            return acc;
        }, {});
        const typeLabels = Object.keys(tasksByType);
        const typeData = Object.values(tasksByType);
        
        if (typeChart) typeChart.destroy();
        typeChart = new Chart(typeCtx, {
            type: 'pie',
            data: {
                labels: typeLabels,
                datasets: [{
                    label: 'Task Types',
                    data: typeData,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.7)', // blue
                        'rgba(16, 185, 129, 0.7)', // green
                        'rgba(245, 158, 11, 0.7)'  // yellow
                    ]
                }]
            }
        });
    };

    const exportToPDF = () => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        
        let target, title;
        if (currentView === 'dashboard') {
            target = document.getElementById('dashboard-view');
            title = 'Productivity Dashboard';
        } else {
            target = document.getElementById('task-grid-container');
            title = 'My Task List';
        }
        
        pdf.text(title, 14, 15);

        html2canvas(target, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth() - 28; // with margin
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 14, 25, pdfWidth, pdfHeight);
            pdf.save(`${title.replace(' ', '-')}-Export.pdf`);
        });
    };

    document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);

    // --- Initial Load ---
    setupTheme();
    switchView('all'); // Default to all view
    loadTasks().then(() => {
        // Run checks once on load
        updateNotificationStatus();
        checkDueDateNotifications();
        // Set interval for future checks
        setInterval(checkDueDateNotifications, 1000 * 60 * 60);
        setInterval(async () => {
            if(processRecurringTasks()) {
                await saveTasksToGithub();
                applyFiltersAndRender();
            }
        }, 1000 * 60 * 60);
    });

    const completeTask = async (id) => {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].completed = true;
            tasks[taskIndex].completedAt = new Date().toISOString();
            
            // Handle recurring task generation
            const task = tasks[taskIndex];
            if (task.recurring && task.recurring.frequency !== 'none') {
                const newDueDate = getNextDueDate(new Date(task.dueDate), task.recurring.frequency);
                const newTask = {
                    ...task,
                    id: `task-${new Date().getTime()}`,
                    dueDate: newDueDate.toISOString().split('T')[0],
                    completed: false,
                    completedAt: null,
                    subtasks: task.subtasks.map(st => ({ ...st, completed: false })) // Reset subtasks
                };
                tasks.push(newTask);
            }
    
            await saveTasksToGithub();
            applyFiltersAndRender();
        }
    };
    
    const processRecurringTasks = () => {
        let newTasksGenerated = false;
        const today = new Date();
        today.setHours(0,0,0,0);
    
        const recurringTemplates = tasks.filter(t => t.recurring && t.recurring.nextDueDate);
    
        recurringTemplates.forEach(template => {
            const nextDueDate = parseDate(template.recurring.nextDueDate);
            if (nextDueDate <= today) {
                const newTask = {
                    ...template,
                    id: `task-${new Date().getTime()}`,
                    dueDate: template.recurring.nextDueDate,
                    // Make it a non-template task for this instance
                    recurring: { frequency: template.recurring.frequency },
                    completed: false,
                    completedAt: null,
                    subtasks: (template.subtasks || []).map(st => ({...st, completed: false}))
                };
                delete newTask.recurring.nextDueDate; // Remove the template-specific property
                tasks.push(newTask);
                
                // Update the template's next due date
                template.recurring.nextDueDate = getNextDueDate(nextDueDate, template.recurring.frequency).toISOString().split('T')[0];
                newTasksGenerated = true;
            }
        });
        return newTasksGenerated;
    };
    
    const getNextDueDate = (currentDueDate, frequency) => {
        const nextDate = new Date(currentDueDate);
        switch (frequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }
        return nextDate;
    };

    // --- Sub-task Logic ---
    const renderSubtasksInModal = (subtasks) => {
        const container = document.getElementById('subtasks-container');
        container.innerHTML = '';
        subtasks.forEach(st => {
            const subtaskEl = createSubtaskElement(st.id, st.text, st.completed);
            container.appendChild(subtaskEl);
        });
    };

    const createSubtaskElement = (id, text, completed) => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2';
        div.dataset.id = id;
        
        div.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''} class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 subtask-checkbox">
            <input type="text" value="${text}" class="flex-grow p-1 bg-gray-200 dark:bg-gray-600 rounded-md border-transparent focus:outline-none focus:ring-1 focus:ring-blue-500">
            <button type="button" class="remove-subtask-btn text-red-500 hover:text-red-700">&times;</button>
        `;
        return div;
    };

    const getSubtasksFromModal = () => {
        const subtasks = [];
        document.querySelectorAll('#subtasks-container .flex').forEach(el => {
            subtasks.push({
                id: el.dataset.id,
                text: el.querySelector('input[type="text"]').value,
                completed: el.querySelector('input[type="checkbox"]').checked
            });
        });
        return subtasks;
    };

    // --- Filter Event Listeners ---
    document.getElementById('add-subtask-btn').addEventListener('click', () => {
        const container = document.getElementById('subtasks-container');
        const newSubtask = createSubtaskElement(`sub-${new Date().getTime()}`, '', false);
        container.appendChild(newSubtask);
    });

    document.getElementById('subtasks-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-subtask-btn')) {
            e.target.closest('.flex').remove();
        }
    });
}); 

