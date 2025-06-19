class TodoApp {
  constructor() {
    this.tasks = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.isDarkMode = false;
    this.draggedTask = null;
    
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.bindEvents();
    this.updateUI();
  }

  bindEvents() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Add task
    document.getElementById('addBtn').addEventListener('click', () => {
      this.addTask();
    });

    // Enter key to add task
    document.getElementById('taskInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.addTask();
      }
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setFilter(btn.dataset.filter);
      });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.updateTaskList();
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportTasks();
    });
  }

  loadFromStorage() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks);
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark');
      document.getElementById('themeToggle').textContent = '☀️';
    }
  }

  saveToStorage() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark');
    document.getElementById('themeToggle').textContent = this.isDarkMode ? '☀️' : '🌙';
    this.saveToStorage();
  }

  showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  addTask() {
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const categoryInput = document.getElementById('categoryInput');

    const taskText = taskInput.value.trim();
    if (!taskText) {
      this.showNotification('Please enter a task!');
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      dueDate: dueDateInput.value || null,
      priority: prioritySelect.value,
      category: categoryInput.value.trim() || 'General',
      createdAt: new Date().toISOString()
    };

    this.tasks.unshift(newTask);
    
    // Clear inputs
    taskInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'low';
    categoryInput.value = '';

    this.saveToStorage();
    this.updateUI();
    this.showNotification('Task added successfully!');
  }

  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : undefined;
      
      this.saveToStorage();
      this.updateUI();
      this.showNotification(task.completed ? 'Task completed! 🎉' : 'Task reopened');
    }
  }

  deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter(task => task.id !== id);
      this.saveToStorage();
      this.updateUI();
      this.showNotification('Task deleted');
    }
  }

  editTask(id, newText) {
    const task = this.tasks.find(t => t.id === id);
    if (task && newText.trim()) {
      task.text = newText.trim();
      this.saveToStorage();
      this.updateUI();
      this.showNotification('Task updated');
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    this.updateTaskList();
  }

  getFilteredTasks() {
    return this.tasks.filter(task => {
      const matchesSearch = task.text.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          task.category.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      switch (this.currentFilter) {
        case 'active':
          return !task.completed && matchesSearch;
        case 'completed':
          return task.completed && matchesSearch;
        default:
          return matchesSearch;
      }
    }).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  getDueDateInfo(dueDate) {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const now = new Date();
    const timeDiff = due.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (timeDiff < 0) {
      return { text: 'Overdue', class: 'overdue' };
    } else if (daysDiff <= 1) {
      return { 
        text: daysDiff === 0 ? 'Due today' : 'Due tomorrow', 
        class: 'due-soon' 
      };
    } else {
      return { text: due.toLocaleDateString(), class: '' };
    }
  }

  createTaskElement(task) {
    const dueDateInfo = this.getDueDateInfo(task.dueDate);
    
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;

    taskElement.innerHTML = `
      <div class="task-checkbox ${task.completed ? 'checked' : ''}">
        ${task.completed ? '✓' : ''}
      </div>
      
      <div class="task-content">
        <div class="task-text" contenteditable="false">
          ${task.text}
        </div>
        
        <div class="task-meta">
          ${dueDateInfo ? `<span class="task-due-date ${dueDateInfo.class}">📅 ${dueDateInfo.text}</span>` : ''}
          <span class="priority-tag priority-${task.priority}">
            ${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} 
            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          <span class="category-tag">🏷️ ${task.category}</span>
        </div>
      </div>
      
      <div class="task-actions">
        <button class="action-btn delete-btn">🗑️</button>
      </div>
    `;

    // Bind events
    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox.addEventListener('click', () => {
      this.toggleTask(task.id);
    });

    const deleteBtn = taskElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      this.deleteTask(task.id);
    });

    const taskText = taskElement.querySelector('.task-text');
    taskText.addEventListener('click', () => {
      if (!task.completed) {
        taskText.contentEditable = 'true';
        taskText.focus();
      }
    });

    taskText.addEventListener('blur', () => {
      taskText.contentEditable = 'false';
      this.editTask(task.id, taskText.textContent);
    });

    taskText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        taskText.blur();
      }
    });

    // Drag and drop
    taskElement.addEventListener('dragstart', (e) => {
      this.draggedTask = task.id;
    });

    taskElement.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    taskElement.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (this.draggedTask && this.draggedTask !== task.id) {
        const draggedIndex = this.tasks.findIndex(t => t.id === this.draggedTask);
        const targetIndex = this.tasks.findIndex(t => t.id === task.id);
        
        const [draggedTaskObj] = this.tasks.splice(draggedIndex, 1);
        this.tasks.splice(targetIndex, 0, draggedTaskObj);
        
        this.saveToStorage();
        this.updateTaskList();
        this.showNotification('Task reordered');
      }
      
      this.draggedTask = null;
    });

    return taskElement;
  }

  updateTaskList() {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const filteredTasks = this.getFilteredTasks();

    // Clear current tasks
    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
      taskList.appendChild(emptyState);
    } else {
      filteredTasks.forEach(task => {
        taskList.appendChild(this.createTaskElement(task));
      });
    }
  }

  updateStats() {
    const totalTasks = this.tasks.length;
    const activeTasks = this.tasks.filter(t => !t.completed).length;
    const completedTasks = this.tasks.filter(t => t.completed).length;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('activeTasks').textContent = activeTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
  }

  updateUI() {
    this.updateTaskList();
    this.updateStats();
  }

  exportTasks() {
    if (this.tasks.length === 0) {
      this.showNotification('No tasks to export!');
      return;
    }

    const exportData = this.tasks.map(task => ({
      Task: task.text,
      Status: task.completed ? 'Completed' : 'Active',
      Priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
      Category: task.category,
      'Due Date': task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date',
      'Created At': new Date(task.createdAt).toLocaleString()
    }));

    const headers = Object.keys(exportData[0]);
    const csvRows = [headers.join(',')];
    
    exportData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    this.showNotification('Tasks exported successfully!');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});
