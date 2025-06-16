// --- SCRIPT VERSION 4.0 --- HARDCODED TOKEN ---
console.log("--- SCRIPT VERSION 4.0 --- HARDCODED TOKEN ---");

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
    let currentView = 'all'; 
    let sortable = null;
    let calendarDate = new Date();
    let completionChart = null;
    let typeChart = null;
    
    // --- GitHub Constants - HARDCODED ---
    const GITHUB_TOKEN = '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';
    const GITHUB_USERNAME = 'GarvitSinghal1';
    const GITHUB_REPO = 'adcplannerDATA';
    const FILE_PATH = 'data/tasks.json';
    const API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${FILE_PATH}`;

    // --- Color Mappings ---
    const typeColorClasses = {
        school: { bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900', darkText: 'dark:text-blue-200' },
        coaching: { bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900', darkText: 'dark:text-green-200' },
        'self-study': { bg: 'bg-yellow-100', text: 'text-yellow-800', darkBg: 'dark:bg-yellow-900', darkText: 'dark:text-yellow-200' }
    };
    const typeColors = { school: 'blue', coaching: 'green', 'self-study': 'yellow' };
    const priorityColors = { high: 'red', medium: 'orange', low: 'gray' };
    
    // --- Functions ---
    const showNotification = (message, isError = false) => {
        notificationBanner.textContent = message;
        notificationBanner.className = 'notification-banner'; 
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
        try {
            if (!GITHUB_TOKEN) {
                showNotification("Error: Hardcoded GitHub token is missing.", true);
                return;
            }

            let sha;
            try {
                const response = await fetch(API_URL, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
                if (response.ok) {
                    sha = (await response.json()).sha;
                }
            } catch (e) { /* Let SHA be undefined to create a new file */ }

            const contentToSave = JSON.stringify({ settings, tasks }, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(contentToSave)));

            const payload = {
                message: 'chore: update tasks from planner app',
                content: encodedContent,
                sha: sha
            };

            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) { throw new Error((await response.json()).message); }
            showNotification("Tasks saved to GitHub successfully!", false);
        } catch (error) {
            showNotification(`Error: Could not save tasks to GitHub. ${error.message}`, true);
        }
    };

    const loadTasks = async () => {
        try {
            if (!GITHUB_TOKEN) {
                showNotification("Error: Hardcoded GitHub token is missing.", true);
                return;
            }
            const response = await fetch(API_URL, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
            if (!response.ok) {
                if (response.status === 404) { // Not found, load local default
                    const localResponse = await fetch('data/tasks.json');
                    const data = await localResponse.json();
                    tasks = data.tasks || [];
                    settings = data.settings || {};
                    showNotification("Welcome! Creating new task list on GitHub.", false);
                    await saveTasksToGithub(); // Save the initial state to GitHub
                } else {
                    throw new Error(`GitHub API Error: ${response.statusText}`);
                }
            } else {
                const data = await response.json();
                const content = decodeURIComponent(escape(atob(data.content)));
                const parsedData = JSON.parse(content);
                tasks = parsedData.tasks || [];
                settings = parsedData.settings || {};
            }
        } catch (error) {
            showNotification(`Error loading tasks: ${error.message}`, true);
        }
        // Finally, render the UI.
        applyFiltersAndRender();
        if (updateDynamicPriorities()) { await saveTasksToGithub(); }
        if (processRecurringTasks()) { await saveTasksToGithub(); }
    };
    
    // All other functions (renderTasks, openModal, etc.) remain below and are unchanged.
    // ... [ The rest of your application logic ] ...
}); 
