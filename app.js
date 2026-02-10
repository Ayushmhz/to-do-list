// State Management
let tasks = [];
let currentTheme = localStorage.getItem('theme') || 'light';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskBody = document.getElementById('task-body');
const taskModal = document.getElementById('task-modal');
const openModalBtn = document.getElementById('open-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const themeCheckbox = document.getElementById('theme-checkbox');
const taskSearch = document.getElementById('task-search');
const filterStatus = document.getElementById('filter-status');
const filterPriority = document.getElementById('filter-priority');
const emptyState = document.getElementById('empty-state');

// Statistics Elements
const totalTasksEl = document.getElementById('total-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const completedTasksEl = document.getElementById('completed-tasks');

// Theme Management
function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (themeCheckbox) {
        // Checked = Light (Right), Unchecked = Dark (Left)
        themeCheckbox.checked = currentTheme === 'light';
    }
}

if (themeCheckbox) {
    themeCheckbox.addEventListener('change', () => {
        currentTheme = themeCheckbox.checked ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    });
}

// Initialize App
window.initializeAppData = function () {
    loadTasks();
    renderTasks();
    applyTheme();
    checkAdminAccess();
};

function checkAdminAccess() {
    const session = JSON.parse(localStorage.getItem('currentUser'));
    const isAdmin = session && session.username === 'Admin_00';

    // Header Admin Button
    const adminBtn = document.getElementById('admin-dash-btn');
    if (adminBtn) adminBtn.classList.toggle('hidden', !isAdmin);

    // Migration Modal Cleanup Section
    const cleanupSection = document.getElementById('admin-cleanup-section');
    if (cleanupSection) cleanupSection.classList.toggle('hidden', !isAdmin);
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(); // Theme applies for both login and app
    const session = JSON.parse(localStorage.getItem('currentUser'));
    if (session) {
        initializeAppData();
    }
});

// Modal Logic
openModalBtn.addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Create New Task';
    document.getElementById('edit-id').value = '';
    taskForm.reset();
    taskModal.classList.add('active');
});

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) modal.classList.remove('active');
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Task CRUD Operations
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const editId = document.getElementById('edit-id').value;
    const taskData = {
        id: editId || Date.now().toString(),
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value,
        dueDate: document.getElementById('due-date').value,
        status: editId ? (tasks.find(t => t.id === editId).status) : 'pending',
        createdAt: editId ? (tasks.find(t => t.id === editId).createdAt) : new Date().toISOString()
    };

    if (editId) {
        tasks = tasks.map(t => t.id === editId ? taskData : t);
    } else {
        tasks.unshift(taskData);
    }

    saveTasks();
    renderTasks();
    taskModal.classList.remove('active');
});

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    }
}

function toggleStatus(id) {
    tasks = tasks.map(t => {
        if (t.id === id) {
            return { ...t, status: t.status === 'pending' ? 'completed' : 'pending' };
        }
        return t;
    });
    saveTasks();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('edit-id').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('priority').value = task.priority;
    document.getElementById('due-date').value = task.dueDate;

    taskModal.classList.add('active');
}

// Persistence
function saveTasks() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    localStorage.setItem(`tasks_${user.username}`, JSON.stringify(tasks));
    updateStats();
}

function loadTasks() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;
    const saved = localStorage.getItem(`tasks_${user.username}`);
    tasks = saved ? JSON.parse(saved) : [];
    updateStats();
}
// Settings Modal Logic
const settingsModal = document.getElementById('settings-modal');
const settingsOpenBtn = document.getElementById('settings-open-btn');
const togglePasswordFormBtn = document.getElementById('toggle-password-form');
const passwordFormContainer = document.getElementById('password-form-container');

if (settingsOpenBtn) {
    settingsOpenBtn.addEventListener('click', () => {
        populateAccountDetails();
        if (passwordFormContainer) passwordFormContainer.classList.add('hidden');
        if (togglePasswordFormBtn) togglePasswordFormBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
        settingsModal.classList.add('active');
    });
}

if (togglePasswordFormBtn) {
    togglePasswordFormBtn.addEventListener('click', () => {
        const isHidden = passwordFormContainer.classList.toggle('hidden');
        togglePasswordFormBtn.innerHTML = isHidden ?
            '<i class="fas fa-key"></i> Update Password' :
            '<i class="fas fa-times"></i> Cancel Update';

        if (!isHidden) {
            document.getElementById('change-password-form').reset();
            document.getElementById('pass-error').classList.add('hidden');
            document.getElementById('pass-success').classList.add('hidden');
        }
    });
}

function populateAccountDetails() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('prof-username').textContent = user.username;
        document.getElementById('prof-email').textContent = user.email;
    }
}

// Search and Filtering
function renderTasks() {
    const searchTerm = taskSearch.value.toLowerCase();
    const statusVal = filterStatus.value;
    const priorityVal = filterPriority.value;

    const filtered = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm);
        const matchesStatus = statusVal === 'all' || task.status === statusVal;
        const matchesPriority = priorityVal === 'all' || task.priority === priorityVal;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    taskBody.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        document.getElementById('task-table').classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        document.getElementById('task-table').classList.remove('hidden');

        filtered.forEach(task => {
            const tr = document.createElement('tr');
            if (task.status === 'completed') tr.classList.add('completed');

            tr.innerHTML = `
                <td class="col-status">
                    <div class="status-dot ${task.status}" 
                         onclick="toggleStatus('${task.id}')" 
                         title="Mark as ${task.status === 'pending' ? 'Completed' : 'Pending'}">
                    </div>
                </td>
                <td class="col-title">
                    <span class="task-title">${task.title}</span>
                    <span class="task-desc">${task.description || 'No description'}</span>
                </td>
                <td class="col-priority">
                    <span class="badge badge-${task.priority}">${task.priority}</span>
                </td>
                <td class="col-due">
                    ${task.dueDate ? formatDate(task.dueDate) : '<span class="text-muted">No date</span>'}
                </td>
                <td class="col-actions">
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" onclick="editTask('${task.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteTask('${task.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            taskBody.appendChild(tr);
        });
    }
}

// Search/Filter Event Listeners
taskSearch.addEventListener('input', renderTasks);
filterStatus.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', renderTasks);

// Migration Logic
const migrationModal = document.getElementById('migration-modal');
const migrationOpenBtn = document.getElementById('migration-open-btn');
const exportBtn = document.getElementById('export-btn');
const importTriggerBtn = document.getElementById('import-trigger-btn');
const importFile = document.getElementById('import-file');

if (migrationOpenBtn) {
    migrationOpenBtn.addEventListener('click', () => {
        migrationModal.classList.add('active');
    });
}

function exportData() {
    const data = {};
    // Get all keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = JSON.parse(event.target.result);
            if (confirm('Importing data will merge with your current data. Continue?')) {
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key]);
                });
                alert('Data imported successfully! The page will now reload.');
                window.location.reload();
            }
        } catch (err) {
            alert('Error parsing backup file. Please ensure it is a valid JSON file.');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

const cleanupBtn = document.getElementById('cleanup-btn');

// Admin Dashboard Modal Logic
const adminModal = document.getElementById('admin-modal');
const adminDashBtn = document.getElementById('admin-dash-btn');
const adminUserBody = document.getElementById('admin-user-body');

if (adminDashBtn) {
    adminDashBtn.addEventListener('click', () => {
        renderAdminDashboard();
        adminModal.classList.add('active');
    });
}

function renderAdminDashboard() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    adminUserBody.innerHTML = '';

    if (users.length === 0) {
        adminUserBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No users found in database.</td></tr>';
        return;
    }

    users.forEach(user => {
        const tr = document.createElement('tr');
        const isSelf = user.username === 'Admin_00';

        tr.innerHTML = `
            <td><strong>${user.username}</strong> ${isSelf ? '<span class="badge badge-low">Admin</span>' : ''}</td>
            <td>${user.email}</td>
            <td><span class="credential-field">${user.password}</span></td>
            <td>
                ${!isSelf ? `
                    <button class="btn-icon btn-delete" onclick="deleteSpecificUser('${user.username}')" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span class="text-muted">Protected</span>'}
            </td>
        `;
        adminUserBody.appendChild(tr);
    });
}

window.deleteSpecificUser = function (username) {
    if (!confirm(`Are you sure you want to delete user "${username}" and all their tasks?`)) return;

    // 1. Remove from users list
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(u => u.username !== username);
    localStorage.setItem('users', JSON.stringify(users));

    // 2. Remove their tasks
    localStorage.removeItem(`tasks_${username}`);

    alert(`User "${username}" deleted successfully.`);
    renderAdminDashboard();
};

function cleanupAccounts() {
    const session = JSON.parse(localStorage.getItem('currentUser'));
    if (!session || session.username !== 'Admin_00') {
        alert('Access Denied: Admin privileges required.');
        return;
    }
    if (!confirm('Are you sure you want to delete all accounts except Admin_00? This action cannot be undone.')) {
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const filteredUsers = users.filter(u => u.username === 'Admin_00');

    // 1. Update Users list
    localStorage.setItem('users', JSON.stringify(filteredUsers));

    // 2. Remove non-Admin_00 tasks
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('tasks_') && key !== 'tasks_Admin_00') {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 3. Clear current session if not Admin_00
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.username !== 'Admin_00') {
        localStorage.removeItem('currentUser');
    }

    alert('Account cleanup complete! Returning to login screen.');
    window.location.reload();
}

if (cleanupBtn) cleanupBtn.addEventListener('click', cleanupAccounts);

if (exportBtn) exportBtn.addEventListener('click', exportData);
if (importTriggerBtn) importTriggerBtn.addEventListener('click', () => importFile.click());
if (importFile) importFile.addEventListener('change', importData);

// Utils
function updateStats() {
    totalTasksEl.textContent = tasks.length;
    pendingTasksEl.textContent = tasks.filter(t => t.status === 'pending').length;
    completedTasksEl.textContent = tasks.filter(t => t.status === 'completed').length;
}

function formatDate(dateStr) {
    if (!dateStr) return '<span class="text-muted">No date</span>';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '<span class="text-muted">No date</span>';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}
