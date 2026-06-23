const API_BASE_URL = 'http://localhost:5000/api';

class App {
    constructor() {
        this.currentUser = null;
        this.activeTab = 'all';
        this.activeCategory = 'all';
        this.batchMode = false;
        this.selectedCount = 0;
        this.tasks = [];
        this.trips = [];
        this.editingTask = null;
        this.editingTrip = null;
        this.selectedTrip = null;
        this.itineraryItems = [];
        this.currentSuggestion = null;
        this.loadCurrentUser();
        this.bindEvents();
    }
    
    loadCurrentUser() {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            this.currentUser = JSON.parse(saved);
            this.hideLogin();
            document.getElementById('username').textContent = this.currentUser.username;
            this.loadData();
        } else {
            this.showLogin();
        }
    }
    
    saveCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    clearCurrentUser() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
    
    async login() {
        const errorElement = document.getElementById('login-error');
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            errorElement.textContent = '请填写用户名和密码';
            errorElement.classList.add('show');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                this.saveCurrentUser(data.user);
                this.hideLogin();
                document.getElementById('username').textContent = data.user.username;
                await this.loadData();
            } else {
                errorElement.textContent = data.error;
                errorElement.classList.add('show');
            }
        } catch (error) {
            errorElement.textContent = '登录失败，请检查网络连接';
            errorElement.classList.add('show');
        }
    }
    
    async register() {
        const errorElement = document.getElementById('login-error');
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        if (!username || !email || !password) {
            errorElement.textContent = '请填写所有字段';
            errorElement.classList.add('show');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                document.getElementById('reg-username').value = '';
                document.getElementById('reg-email').value = '';
                document.getElementById('reg-password').value = '';
                document.getElementById('login-username').value = username;
                document.getElementById('login-password').value = password;
                await this.login();
            } else {
                errorElement.textContent = data.error;
                errorElement.classList.add('show');
            }
        } catch (error) {
            errorElement.textContent = '注册失败，请检查网络连接';
            errorElement.classList.add('show');
        }
    }
    
    showLogin() {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('main-content').style.display = 'none';
    }
    
    hideLogin() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
    }
    
    showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-error').classList.remove('show');
    }
    
    showRegisterForm() {
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('login-error').classList.remove('show');
    }
    
    logout() {
        this.clearCurrentUser();
        this.showLogin();
    }
    
    async loadData() {
        await Promise.all([this.loadTasks(), this.loadTrips()]);
        this.renderCombinedList();
    }
    
    taskPage = 1;
    taskTotal = 0;
    taskPages = 1;
    taskPerPage = 6;
    
    async loadTasks(page = 1, perPage = this.taskPerPage) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks?user_id=${this.currentUser.id}&page=${page}&per_page=${perPage}`);
            if (response.ok) {
                const data = await response.json();
                this.tasks = data.items || data;
                this.taskPage = data.page || 1;
                this.taskTotal = data.total || this.tasks.length;
                this.taskPages = data.pages || 1;
                this.taskPerPage = perPage;
                this.renderCombinedList();
            }
        } catch (error) {
            console.error('加载任务失败:', error);
        }
    }
    
    async loadTrips() {
        try {
            const response = await fetch(`${API_BASE_URL}/trips?user_id=${this.currentUser.id}`);
            if (response.ok) this.trips = await response.json();
            this.renderCombinedList();
        } catch (error) {
            console.error('加载行程失败:', error);
        }
    }
    
    switchTab(tabName) {
        this.activeTab = tabName;
        document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
        document.querySelectorAll('#main-content main > div').forEach(tab => tab.style.display = 'none');
        document.getElementById(`${tabName}-tab`).style.display = 'block';
        
        if (tabName === 'all') {
            this.loadTasks();
            this.loadTrips();
        }
    }
    
    filterCategory(category) {
        this.activeCategory = category;
        document.querySelectorAll('.category-tabs button').forEach(btn => btn.classList.remove('cat-active'));
        document.getElementById(`cat-${category}`).classList.add('cat-active');
        this.renderCombinedList();
    }
    
    renderCombinedList() {
        const container = document.getElementById('task-list');
        let allItems = [];
        
        const now = new Date();
        const hideEndedTasks = document.getElementById('hide-ended-tasks')?.checked || false;
        const hideEndedTrips = document.getElementById('hide-ended-trips')?.checked || false;
        
        this.tasks.forEach(t => {
            const endTime = new Date(t.end_time);
            const isEnded = endTime < now;
            
            // 如果设置了隐藏已结束任务且任务已结束，则跳过
            if (hideEndedTasks && isEnded) {
                return;
            }
            
            allItems.push({
                id: t.id,
                type: 'task',
                title: t.title,
                description: t.description,
                date: t.start_time,
                location: t.location,
                priority: t.priority,
                status: t.status,
                category: t.category,
                endTime: t.end_time,
                isEnded: isEnded
            });
        });
        
        this.trips.forEach(t => {
            const endDate = new Date(t.end_date);
            const isEnded = endDate < now;
            
            // 如果设置了隐藏已结束行程且行程已结束，则跳过
            if (hideEndedTrips && isEnded) {
                return;
            }
            
            allItems.push({
                id: t.id,
                type: 'trip',
                title: t.title,
                description: t.description,
                date: t.start_date,
                location: t.destination,
                priority: 2,
                status: t.status,
                endDate: t.end_date,
                budget: t.budget,
                isEnded: isEnded
            });
        });
        
        allItems.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (this.activeCategory !== 'all') {
            allItems = allItems.filter(item => item.type === this.activeCategory);
        }
        
        const batchContainer = document.getElementById('batch-actions-container');
        const paginationContainer = document.getElementById('pagination-container');
        
        if (allItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state-grid">
                    <div class="empty-icon">📋</div>
                    <p>暂无${this.getCategoryName(this.activeCategory)}数据</p>
                    <button onclick="document.getElementById('add-${this.activeCategory === 'all' ? 'task' : this.activeCategory}').click()">
                        添加${this.getCategoryName(this.activeCategory)}
                    </button>
                </div>
            `;
            batchContainer.style.display = 'none';
            paginationContainer.style.display = 'none';
            return;
        }
        
        const total = allItems.length;
        const perPage = this.taskPerPage;
        const totalPages = Math.ceil(total / perPage);
        const currentPage = this.taskPage;
        
        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedItems = allItems.slice(startIndex, endIndex);
        
        // 始终显示批量操作区域
        batchContainer.style.display = 'block';
        
        paginationContainer.style.display = 'block';
        
        document.getElementById('total-count').textContent = total;
        document.getElementById('current-page').textContent = currentPage;
        document.getElementById('total-pages').textContent = totalPages;
        
        document.getElementById('prev-page').disabled = currentPage <= 1;
        document.getElementById('next-page').disabled = currentPage >= totalPages;
        
        container.innerHTML = paginatedItems.map(item => this.renderItemCard(item)).join('');
        
        // 重新绑定所有事件，因为DOM已更新
        this.bindBatchEvents();
        this.bindCheckboxEvents();
        this.bindCombinedEvents();
        this.bindPaginationEvents();
        
        // 根据批量选择模式状态更新UI（必须在DOM生成之后调用）
        this.updateBatchModeUI();
    }
    
    // 更新批量选择模式UI状态
    updateBatchModeUI() {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        const selectAll = document.getElementById('select-all-tasks');
        const selectAllLabel = document.getElementById('select-all-label');
        const batchSelectBtn = document.getElementById('batch-select-mode');
        const batchSelectIcon = batchSelectBtn?.querySelector('.btn-icon');
        const batchSelectText = document.getElementById('batch-select-text');
        const batchDeleteBtn = document.getElementById('batch-delete-tasks');
        const batchCancelBtn = document.getElementById('batch-cancel');
        const batchHint = document.getElementById('batch-hint');
        
        if (this.batchMode) {
            // 激活状态
            if (batchSelectIcon) batchSelectIcon.textContent = '☑️';
            if (batchSelectText) batchSelectText.textContent = '退出选择';
            if (batchSelectBtn) {
                batchSelectBtn.classList.remove('btn-primary');
                batchSelectBtn.classList.add('btn-secondary');
            }
            
            // 显示复选框
            checkboxes.forEach(cb => {
                cb.style.display = 'inline-block';
                // 移除禁用状态
                cb.disabled = false;
            });
            
            if (selectAllLabel) selectAllLabel.style.display = 'flex';
            if (selectAll) {
                selectAll.disabled = false;
            }
            if (batchCancelBtn) batchCancelBtn.style.display = 'inline-block';
            if (batchHint) batchHint.style.display = 'block';
            
            // 重置批量删除按钮状态
            if (batchDeleteBtn) {
                batchDeleteBtn.disabled = true;
                const badge = batchDeleteBtn.querySelector('.badge');
                if (badge) badge.textContent = '0';
            }
        } else {
            // 禁用状态
            if (batchSelectIcon) batchSelectIcon.textContent = '☐';
            if (batchSelectText) batchSelectText.textContent = '批量选择';
            if (batchSelectBtn) {
                batchSelectBtn.classList.remove('btn-secondary');
                batchSelectBtn.classList.add('btn-primary');
            }
            
            // 隐藏复选框并清除选择
            checkboxes.forEach(cb => {
                cb.style.display = 'none';
                cb.checked = false;
            });
            if (selectAll) {
                selectAll.checked = false;
                selectAll.disabled = true;
            }
            if (selectAllLabel) selectAllLabel.style.display = 'none';
            if (batchCancelBtn) batchCancelBtn.style.display = 'none';
            if (batchHint) batchHint.style.display = 'none';
            
            // 禁用批量删除按钮
            if (batchDeleteBtn) {
                batchDeleteBtn.disabled = true;
                const badge = batchDeleteBtn.querySelector('.badge');
                if (badge) badge.textContent = '0';
            }
        }
    }
    
    getCategoryName(category) {
        const names = {
            'all': '任务行程',
            'task': '任务',
            'trip': '行程'
        };
        return names[category] || '任务行程';
    }
    
    renderItemCard(item) {
        const typeInfo = {
            task: { icon: '📅', badge: '任务', badgeClass: 'badge-task', cardClass: 'task-card' },
            trip: { icon: '🧳', badge: '行程', badgeClass: 'badge-trip', cardClass: 'trip-card' }
        };
        
        const info = typeInfo[item.type];
        const formattedDate = this.formatDateTime(item.date);
        
        // 已结束的样式
        const endedStyle = item.isEnded ? 'opacity: 0.6; background: #f5f5f5;' : '';
        const endedBadge = item.isEnded ? '<span style="background: rgba(150, 150, 150, 0.2); color: #999; padding: 4px 10px; border-radius: 20px; font-size: 12px; margin-left: 5px;">已结束</span>' : '';
        
        if (item.type === 'trip') {
            return `
                <div class="${info.cardClass}" style="${endedStyle}">
                    <div class="card-header">
                        <input type="checkbox" class="item-checkbox" data-type="trip" data-id="${item.id}" style="display: none;">
                        <h3 class="card-title">${item.title}</h3>
                        <span class="card-type-badge ${info.badgeClass}">${info.icon} ${info.badge}</span>
                        ${endedBadge}
                    </div>
                    <div class="card-meta">
                        <span class="card-meta-item">📅 ${formattedDate} ~ ${this.formatDate(item.endDate)}</span>
                        ${item.location ? `<span class="card-meta-item">📍 ${item.location}</span>` : ''}
                        ${item.budget ? `<span class="card-meta-item">💰 ¥${item.budget}</span>` : ''}
                    </div>
                    ${item.description ? `<p class="card-description">${item.description}</p>` : ''}
                    <div class="card-actions">
                        <button class="edit-btn" data-type="${item.type}" data-id="${item.id}">✏️ 编辑</button>
                        <button class="delete-btn" data-type="${item.type}" data-id="${item.id}">🗑️ 删除</button>
                        <button class="view-btn" data-type="${item.type}" data-id="${item.id}">👁️ 详情</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="${info.cardClass}" style="${endedStyle}">
                    <div class="card-header">
                        <input type="checkbox" class="item-checkbox" data-type="task" data-id="${item.id}" style="display: none;">
                        <h3 class="card-title">${item.title}</h3>
                        <span class="card-type-badge ${info.badgeClass}">${info.icon} ${info.badge}</span>
                        ${endedBadge}
                    </div>
                    <div class="card-meta">
                        <span class="card-meta-item">📅 ${formattedDate}</span>
                        ${item.location ? `<span class="card-meta-item">📍 ${item.location}</span>` : ''}
                        <span class="card-meta-item">${this.getPriorityBadge(item.priority)}</span>
                    </div>
                    ${item.description ? `<p class="card-description">${item.description}</p>` : ''}
                    <div class="card-actions">
                        <button class="edit-btn" data-type="${item.type}" data-id="${item.id}">✏️ 编辑</button>
                        <button class="delete-btn" data-type="${item.type}" data-id="${item.id}">🗑️ 删除</button>
                    </div>
                </div>
            `;
        }
    }
    
    getPriorityBadge(priority) {
        const badges = {
            1: '<span style="background: rgba(235, 51, 73, 0.1); color: #eb3349; padding: 4px 10px; border-radius: 20px; font-size: 12px;">高优先级</span>',
            2: '<span style="background: rgba(255, 217, 61, 0.1); color: #d4a574; padding: 4px 10px; border-radius: 20px; font-size: 12px;">中优先级</span>',
            3: '<span style="background: rgba(17, 153, 142, 0.1); color: #11998e; padding: 4px 10px; border-radius: 20px; font-size: 12px;">低优先级</span>'
        };
        return badges[priority] || badges[2];
    }
    
    bindCombinedEvents() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const id = e.target.dataset.id;
                this.openEditModal(type, id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const id = e.target.dataset.id;
                this.confirmDelete(type, id);
            });
        });
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const id = e.target.dataset.id;
                if (type === 'trip') {
                    this.viewTripDetails(id);
                }
            });
        });
    }
    
    viewTripDetails(id) {
        const trip = this.trips.find(t => t.id == id);
        if (trip) {
            this.viewItinerary(trip);
        }
    }
    
    openEditModal(type, id) {
        if (type === 'task') {
            const task = this.tasks.find(t => t.id == id);
            if (task) {
                this.editingTask = task;
                document.getElementById('task-modal-title').textContent = '编辑任务';
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-description').value = task.description || '';
                document.getElementById('task-start').value = this.formatDateTimeLocal(task.start_time);
                document.getElementById('task-end').value = this.formatDateTimeLocal(task.end_time);
                document.getElementById('task-location').value = task.location || '';
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-category').value = task.category || 'personal';
                document.getElementById('task-modal').style.display = 'block';
            }
        } else if (type === 'trip') {
            const trip = this.trips.find(t => t.id == id);
            if (trip) {
                this.editingTrip = trip;
                document.getElementById('trip-modal-title').textContent = '编辑行程';
                document.getElementById('trip-title').value = trip.title;
                document.getElementById('trip-description').value = trip.description || '';
                document.getElementById('trip-destination').value = trip.destination || '';
                document.getElementById('trip-start').value = trip.start_date;
                document.getElementById('trip-end').value = trip.end_date;
                document.getElementById('trip-budget').value = trip.budget || '';
                document.getElementById('trip-modal').style.display = 'block';
            }
        }
    }
    
    confirmDelete(type, id) {
        if (confirm('确定要删除这条记录吗？')) {
            if (type === 'task') {
                this.deleteTaskAndRefresh(id);
            } else if (type === 'trip') {
                this.deleteTrip(id);
            }
        }
    }
    
    openTaskModal(task = null) {
        this.editingTask = task;
        const modal = document.getElementById('task-modal');
        
        // 设置日期输入框的最小值为当前时间
        const now = new Date();
        const minDateTime = this.formatDateTimeLocal(now.toISOString());
        document.getElementById('task-start').min = minDateTime;
        document.getElementById('task-end').min = minDateTime;
        
        if (task) {
            document.getElementById('task-modal-title').textContent = '编辑任务';
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-start').value = this.formatDateTimeForInput(task.start_time);
            document.getElementById('task-end').value = this.formatDateTimeForInput(task.end_time);
            document.getElementById('task-location').value = task.location || '';
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-category').value = task.category || 'personal';
            
            // 如果任务开始时间已过，显示警告
            const taskStart = new Date(task.start_time);
            if (taskStart < now) {
                const warningDiv = document.getElementById('date-warning');
                if (warningDiv) {
                    warningDiv.style.display = 'block';
                    warningDiv.textContent = '⚠️ 此任务开始时间已过，修改为过去的时间可能不合理';
                }
            }
        } else {
            document.getElementById('task-modal-title').textContent = '添加任务';
            this.clearTaskForm();
            const warningDiv = document.getElementById('date-warning');
            if (warningDiv) {
                warningDiv.style.display = 'none';
            }
        }
        modal.style.display = 'flex';
    }
    
    clearTaskForm() {
        document.getElementById('task-title').value = '';
        document.getElementById('task-description').value = '';
        document.getElementById('task-start').value = '';
        document.getElementById('task-end').value = '';
        document.getElementById('task-location').value = '';
        document.getElementById('task-priority').value = '2';
        document.getElementById('task-category').value = 'personal';
    }
    
    closeTaskModal() {
        document.getElementById('task-modal').style.display = 'none';
        this.editingTask = null;
    }
    
    async saveTask() {
        const startTime = document.getElementById('task-start').value;
        const endTime = document.getElementById('task-end').value;
        
        // 验证日期是否为过去时间
        const now = new Date();
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        if (!this.editingTask && startDate < now) {
            alert('⚠️ 新任务的开始时间不能是过去的时间！');
            return;
        }
        
        if (endDate < startDate) {
            alert('⚠️ 结束时间不能早于开始时间！');
            return;
        }
        
        const data = {
            user_id: this.currentUser.id,
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            start_time: startTime,
            end_time: endTime,
            location: document.getElementById('task-location').value,
            priority: parseInt(document.getElementById('task-priority').value),
            category: document.getElementById('task-category').value,
            status: 'pending'
        };
        
        try {
            const method = this.editingTask ? 'PUT' : 'POST';
            const url = this.editingTask 
                ? `${API_BASE_URL}/tasks/${this.editingTask.id}`
                : `${API_BASE_URL}/tasks`;
            
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (response.ok) {
                this.closeTaskModal();
                await this.loadTasks();
                this.renderCombinedList();
            } else {
                const errorData = await response.json();
                alert('保存失败: ' + (errorData.error || '未知错误'));
            }
        } catch (error) {
            console.error('保存任务失败:', error);
            alert('保存任务失败，请检查网络连接');
        }
    }
    
    async deleteTask(id) {
        try {
            console.log(`[DEBUG] Deleting task with id: ${id}`);
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, { 
                method: 'DELETE',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                const result = await response.json();
                console.log(`[DEBUG] Delete response:`, result);
                await this.loadTasks(1);
                this.renderCombinedList();
            } else {
                const error = await response.json();
                console.error(`[DEBUG] Delete failed:`, error);
            }
        } catch (error) {
            console.error('删除任务失败:', error);
        }
    }
    
    async deleteTaskAndRefresh(id) {
        try {
            console.log(`[DEBUG] Deleting task with id: ${id}`);
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, { 
                method: 'DELETE',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.ok) {
                const result = await response.json();
                console.log(`[DEBUG] Delete response:`, result);
                location.reload();
            } else {
                const error = await response.json();
                console.error(`[DEBUG] Delete failed:`, error);
            }
        } catch (error) {
            console.error('删除任务失败:', error);
        }
    }
    
    openTripModal(trip = null) {
        this.editingTrip = trip;
        const modal = document.getElementById('trip-modal');
        if (trip) {
            document.getElementById('trip-modal-title').textContent = '编辑行程';
            document.getElementById('trip-title').value = trip.title;
            document.getElementById('trip-description').value = trip.description || '';
            document.getElementById('trip-destination').value = trip.destination;
            document.getElementById('trip-start').value = trip.start_date;
            document.getElementById('trip-end').value = trip.end_date;
            document.getElementById('trip-budget').value = trip.budget || '';
        } else {
            document.getElementById('trip-modal-title').textContent = '添加行程';
            this.clearTripForm();
        }
        modal.style.display = 'flex';
    }
    
    clearTripForm() {
        document.getElementById('trip-title').value = '';
        document.getElementById('trip-description').value = '';
        document.getElementById('trip-destination').value = '';
        document.getElementById('trip-start').value = '';
        document.getElementById('trip-end').value = '';
        document.getElementById('trip-budget').value = '';
    }
    
    closeTripModal() {
        document.getElementById('trip-modal').style.display = 'none';
        this.editingTrip = null;
    }
    
    async saveTrip() {
        const data = {
            user_id: this.currentUser.id,
            title: document.getElementById('trip-title').value,
            description: document.getElementById('trip-description').value,
            destination: document.getElementById('trip-destination').value,
            start_date: document.getElementById('trip-start').value,
            end_date: document.getElementById('trip-end').value,
            budget: parseFloat(document.getElementById('trip-budget').value) || null,
            status: 'planned'
        };
        
        try {
            const method = this.editingTrip ? 'PUT' : 'POST';
            const url = this.editingTrip 
                ? `${API_BASE_URL}/trips/${this.editingTrip.id}`
                : `${API_BASE_URL}/trips`;
            
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (response.ok) {
                this.closeTripModal();
                await this.loadTrips();
                this.renderCombinedList();
            }
        } catch (error) {
            console.error('保存行程失败:', error);
        }
    }
    
    async deleteTrip(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/trips/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await this.loadTrips();
                this.renderCombinedList();
            }
        } catch (error) {
            console.error('删除行程失败:', error);
        }
    }
    
    async viewItinerary(trip) {
        this.selectedTrip = trip;
        document.getElementById('itinerary-title').textContent = `${trip.title}`;
        
        const loading = document.getElementById('itinerary-loading');
        const content = document.getElementById('itinerary-content');
        
        loading.style.display = 'flex';
        content.style.display = 'none';
        
        document.getElementById('itinerary-destination').textContent = trip.destination || '未设置';
        document.getElementById('itinerary-dates').textContent = `${trip.start_date} - ${trip.end_date}`;
        document.getElementById('itinerary-budget').textContent = trip.budget ? `¥${trip.budget.toLocaleString()}` : '未设置';
        
        try {
            const startDate = new Date(trip.start_date);
            const endDate = new Date(trip.end_date);
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            document.getElementById('itinerary-days').textContent = `${days} 天`;
        } catch {
            document.getElementById('itinerary-days').textContent = '计算中';
        }
        
        document.getElementById('itinerary-desc').textContent = trip.description || '暂无描述';
        
        try {
            const response = await fetch(`${API_BASE_URL}/trips/${trip.id}/itinerary`);
            if (response.ok) {
                this.itineraryItems = await response.json();
            }
        } catch (error) {
            console.error('加载行程详情失败:', error);
            this.itineraryItems = [];
        }
        
        setTimeout(() => {
            this.renderItinerary();
            loading.style.display = 'none';
            content.style.display = 'block';
        }, 300);
        
        document.getElementById('itinerary-modal').style.display = 'flex';
    }
    
    renderItinerary() {
        const container = document.getElementById('itinerary-list');
        const emptyState = document.getElementById('itinerary-empty');
        
        if (this.itineraryItems.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState.style.display = 'none';
        
        const sortedItems = [...this.itineraryItems].sort((a, b) => a.day_number - b.day_number);
        
        container.innerHTML = sortedItems.map((item, index) => `
            <div class="timeline-item animate-fade-in" style="animation-delay: ${index * 0.1}s;">
                <div class="timeline-marker">
                    <div class="marker-dot"></div>
                    ${index < sortedItems.length - 1 ? '<div class="marker-line"></div>' : ''}
                </div>
                <div class="timeline-content">
                    <div class="timeline-day">
                        <span class="day-badge">第 ${item.day_number} 天</span>
                        ${item.time_slot ? `<span class="time-badge">${item.time_slot}</span>` : ''}
                    </div>
                    <h4 class="timeline-title">${item.title}</h4>
                    ${item.location ? `<div class="timeline-location">📍 ${item.location}</div>` : ''}
                    ${item.description ? `<p class="timeline-desc">${item.description}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    closeItineraryModal() {
        document.getElementById('itinerary-modal').style.display = 'none';
        this.selectedTrip = null;
        this.itineraryItems = [];
    }
    
    async addItineraryItem() {
        const dayNumber = prompt('请输入天数:');
        if (!dayNumber) return;
        const title = prompt('请输入行程标题:');
        if (!title) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/trips/${this.selectedTrip.id}/itinerary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day_number: parseInt(dayNumber), title })
            });
            if (response.ok) await this.viewItinerary(this.selectedTrip);
        } catch (error) {
            console.error('添加行程项失败:', error);
        }
    }
    
    async aiPlan() {
        const prompt = document.getElementById('ai-prompt').value;
        if (!prompt.trim()) {
            alert('请输入您的需求');
            return;
        }
        
        document.getElementById('ai-prompt').disabled = true;
        document.getElementById('ai-submit').disabled = true;
        document.getElementById('ai-loading').style.display = 'block';
        document.getElementById('ai-results').innerHTML = '';
        document.getElementById('ai-analysis').innerHTML = '';
        
        try {
            const response = await fetch(`${API_BASE_URL}/ai/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: this.currentUser.id, prompt })
            });
            
            const data = await response.json();
            if (response.ok) {
                this.renderAIAnalysis(data.analysis);
                this.renderAIResults(data.suggestions);
            }
        } catch (error) {
            console.error('AI规划失败:', error);
            document.getElementById('ai-results').innerHTML = '<p style="color:red;">AI规划失败，请重试</p>';
        } finally {
            document.getElementById('ai-prompt').disabled = false;
            document.getElementById('ai-submit').disabled = false;
            document.getElementById('ai-loading').style.display = 'none';
        }
    }
    
    renderAIAnalysis(analysis) {
        const container = document.getElementById('ai-analysis');
        if (!analysis) {
            container.innerHTML = '';
            return;
        }
        
        let analysisHtml = `<div class="analysis-card">`;
        
        analysisHtml += `<div class="analysis-summary">
            <h4>📊 分析报告</h4>
            <p>${analysis.summary}</p>
        </div>`;
        
        if (analysis.has_conflicts && analysis.conflicts && analysis.conflicts.length > 0) {
            analysisHtml += `<div class="analysis-conflicts warning">
                <h5>⚠️ 时间冲突警告</h5>
                <ul>`;
            analysis.conflicts.forEach((conflict, index) => {
                const event1Priority = conflict.event1.priority_label || '未知优先级';
                const event2Priority = conflict.event2.priority_label || '未知优先级';
                const recommendation = conflict.recommendation || '暂无建议';
                const recommendedTitle = conflict.recommended_title || '';
                
                analysisHtml += `
                <li>
                    <div><strong>${conflict.event1.title}</strong> (${event1Priority}) 与 <strong>${conflict.event2.title}</strong> (${event2Priority}) 时间重叠</div>
                    <div style="margin-left: 20px; margin-top: 5px; color: #2ecc71; font-size: 14px;">
                        ⭐ 建议优先执行: ${recommendedTitle ? `<strong>${recommendedTitle}</strong>` : '无'}
                    </div>
                    <div style="margin-left: 20px; margin-top: 3px; color: #666; font-size: 13px;">
                        ${recommendation}
                    </div>
                </li>`;
            });
            analysisHtml += `</ul></div>`;
        }
        
        if (analysis.priority_summary) {
            const { high, medium, low } = analysis.priority_summary;
            analysisHtml += `<div class="analysis-priority">
                <h5>📈 优先级分布</h5>
                <div class="priority-bars">
                    <div class="priority-bar high" style="width: ${((high / (high + medium + low + 1)) * 100)}%">高优先级 (${high})</div>
                    <div class="priority-bar medium" style="width: ${((medium / (high + medium + low + 1)) * 100)}%">中优先级 (${medium})</div>
                    <div class="priority-bar low" style="width: ${((low / (high + medium + low + 1)) * 100)}%">低优先级 (${low})</div>
                </div>
            </div>`;
        }
        
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            analysisHtml += `<div class="analysis-recommendations">
                <h5>💡 建议</h5>
                <ul>`;
            analysis.recommendations.forEach(rec => {
                analysisHtml += `<li>• ${rec}</li>`;
            });
            analysisHtml += `</ul></div>`;
        }
        
        analysisHtml += `</div>`;
        
        container.innerHTML = analysisHtml;
    }
    
    renderAIResults(suggestions) {
        const container = document.getElementById('ai-results');
        if (suggestions.length === 0) {
            container.innerHTML = '<p style="text-align:center;">未生成任何建议</p>';
            return;
        }
        
        container.innerHTML = suggestions.map((item, index) => {
            const typeIcon = item.type === 'task' ? '📅' : '✈️';
            const typeText = item.type === 'task' ? '任务' : '行程';
            
            let metaHtml = '';
            if (item.type === 'task') {
                metaHtml = `<div class="suggestion-meta">
                    <span>⏰ ${this.formatDateTime(item.start_time)} - ${this.formatDateTime(item.end_time)}</span>
                    ${item.location ? `<span>📍 ${item.location}</span>` : ''}
                    <span>${this.getPriorityText(item.priority)}</span>
                </div>`;
            } else if (item.type === 'trip') {
                metaHtml = `<div class="suggestion-meta">
                    <span>📍 ${item.destination}</span>
                    <span>📆 ${this.formatDate(item.start_date)} - ${this.formatDate(item.end_date)}</span>
                    ${item.budget ? `<span>💰 ¥${item.budget}</span>` : ''}
                </div>`;
            }
            
            return `<div class="suggestion-card">
                <h4>${typeIcon} ${item.title} <span style="font-size:12px;color:#999;">(${typeText})</span></h4>
                ${item.description ? `<p>${item.description}</p>` : ''}
                ${metaHtml}
                <button class="save-suggestion-btn" data-index="${index}">保存到我的任务</button>
            </div>`;
        }).join('');
        
        document.querySelectorAll('.save-suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.saveSuggestion(suggestions[index]);
            });
        });
    }
    
    saveSuggestion(item) {
        this.currentSuggestion = item;
        const modal = document.getElementById('suggestion-modal');
        const details = document.getElementById('suggestion-details');
        
        const typeText = item.type === 'task' ? '任务' : '行程';
        let detailsHtml = `<p><strong>类型:</strong> ${typeText}</p>`;
        detailsHtml += `<p><strong>标题:</strong> ${item.title}</p>`;
        if (item.description) detailsHtml += `<p><strong>描述:</strong> ${item.description}</p>`;
        
        if (item.type === 'task') {
            detailsHtml += `<p><strong>时间:</strong> ${this.formatDateTime(item.start_time)} - ${this.formatDateTime(item.end_time)}</p>`;
            if (item.location) detailsHtml += `<p><strong>地点:</strong> ${item.location}</p>`;
        } else if (item.type === 'trip') {
            detailsHtml += `<p><strong>目的地:</strong> ${item.destination}</p>`;
            detailsHtml += `<p><strong>日期:</strong> ${this.formatDate(item.start_date)} - ${this.formatDate(item.end_date)}</p>`;
            if (item.budget) detailsHtml += `<p><strong>预算:</strong> ¥${item.budget}</p>`;
        }
        
        details.innerHTML = detailsHtml;
        modal.style.display = 'flex';
    }
    
    async confirmSaveSuggestion() {
        if (!this.currentSuggestion) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/ai/save_suggestion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: this.currentUser.id, ...this.currentSuggestion })
            });
            
            if (response.ok) {
                alert('保存成功！');
                this.closeSuggestionModal();
                await this.loadData();
            }
        } catch (error) {
            console.error('保存建议失败:', error);
            alert('保存失败');
        }
    }
    
    closeSuggestionModal() {
        document.getElementById('suggestion-modal').style.display = 'none';
        this.currentSuggestion = null;
    }
    
    openFileUploadModal() {
        document.getElementById('file-upload-modal').style.display = 'flex';
        document.getElementById('file-results').innerHTML = '';
    }
    
    closeFileUploadModal() {
        document.getElementById('file-upload-modal').style.display = 'none';
        document.getElementById('file-input').value = '';
        document.getElementById('file-results').innerHTML = '';
    }
    
    async uploadFile() {
        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];
        const uploadBtn = document.getElementById('upload-file-submit');
        const resultsContainer = document.getElementById('file-results');
        
        if (!file) {
            alert('请选择文件');
            return;
        }
        
        // 禁用按钮并显示加载状态
        uploadBtn.disabled = true;
        uploadBtn.textContent = '识别中...';
        resultsContainer.innerHTML = '<div class="loading-spinner"></div><p style="text-align:center;margin-top:15px;">正在上传并识别文件...</p>';
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', this.currentUser.id);
        
        try {
            const response = await fetch(`${API_BASE_URL}/upload/file`, { method: 'POST', body: formData });
            const data = await response.json();
            if (response.ok) {
                this.showFileResults(data);
            } else {
                resultsContainer.innerHTML = `<p style="color:red;">${data.error}</p>`;
            }
        } catch (error) {
            console.error('上传文件失败:', error);
            resultsContainer.innerHTML = '<p style="color:red;">上传失败，请检查网络连接</p>';
        } finally {
            // 恢复按钮状态
            uploadBtn.disabled = false;
            uploadBtn.textContent = '上传并识别';
        }
    }
    
    showFileResults(data) {
        const container = document.getElementById('file-results');
        if (data.items && data.items.length > 0) {
            container.innerHTML = `<p style="color:green;">文件解析成功，识别到 ${data.items.length} 个行程项</p>
                <div class="extracted-text">
                    ${data.items.map((item, i) => `<p>${i+1}. ${item.title}</p>`).join('')}
                </div>
                <button id="save-file-items" style="margin-top:10px;">保存所有识别结果</button>`;
            
            document.getElementById('save-file-items').addEventListener('click', () => {
                this.saveFileItems(data.items);
            });
        } else {
            container.innerHTML = '<p style="color:orange;">未识别到行程内容</p>';
        }
    }
    
    async saveFileItems(items) {
        for (const item of items) {
            try {
                await fetch(`${API_BASE_URL}/ai/save_suggestion`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: this.currentUser.id, ...item })
                });
            } catch (error) {
                console.error('保存失败:', error);
            }
        }
        alert('已保存所有识别的行程！');
        this.closeFileUploadModal();
        await this.loadTasks();
        this.renderCombinedList();
    }
    
    openImageUploadModal() {
        document.getElementById('image-upload-modal').style.display = 'flex';
        document.getElementById('image-results').innerHTML = '';
        document.getElementById('preview-image').style.display = 'none';
    }
    
    closeImageUploadModal() {
        document.getElementById('image-upload-modal').style.display = 'none';
        document.getElementById('image-input').value = '';
        document.getElementById('image-results').innerHTML = '';
        document.getElementById('preview-image').style.display = 'none';
    }
    
    previewImage() {
        const fileInput = document.getElementById('image-input');
        const file = fileInput.files[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('preview-image').src = e.target.result;
                document.getElementById('preview-image').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
    
    async handleImageUpload() {
        const fileInput = document.getElementById('image-input');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('请选择图片');
            return;
        }
        
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert('请选择有效的图片格式 (JPG, PNG, GIF)');
            return;
        }
        
        document.getElementById('upload-image-submit').disabled = true;
        document.getElementById('image-results').innerHTML = '<div class="loading-spinner"></div><p style="text-align:center;margin-top:15px;">正在识别中...</p>';
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageData = e.target.result;
            
            try {
                const response = await fetch(`${API_BASE_URL}/upload/image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: this.currentUser.id, image: imageData })
                });
                
                const data = await response.json();
                if (response.ok) {
                    this.showImageResults(data);
                } else {
                    document.getElementById('image-results').innerHTML = `<p style="color:red;">❌ ${data.error}</p>`;
                }
            } catch (error) {
                console.error('图片识别失败:', error);
                document.getElementById('image-results').innerHTML = '<p style="color:red;">❌ 识别失败，请检查网络连接或图片质量</p>';
            } finally {
                document.getElementById('upload-image-submit').disabled = false;
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    showImageResults(data) {
        const container = document.getElementById('image-results');
        container.innerHTML = '';
        
        if (!data.tesseract_available && data.suggestion) {
            container.innerHTML = `
                <p style="color:red;">❌ OCR文字识别引擎未安装</p>
                <p style="font-size:14px;color:#666;">${data.suggestion}</p>
                <div style="margin-top:15px;">
                    <p><strong>手动输入图片中的文字:</strong></p>
                    <textarea id="manual-text-input" rows="6" cols="50" placeholder="请输入图片中的文字内容..."></textarea>
                    <br>
                    <button id="parse-manual-text-btn" style="margin-top:10px;">解析文字内容</button>
                </div>
            `;
            
            document.getElementById('parse-manual-text-btn').addEventListener('click', () => {
                const text = document.getElementById('manual-text-input').value;
                if (text.trim()) {
                    this.parseManualText(text);
                } else {
                    alert('请输入文字内容');
                }
            });
            return;
        }
        
        if (!data.text_found || !data.extracted_text || data.extracted_text.trim() === '') {
            container.innerHTML = `
                <p style="color:orange;">⚠️ 未识别到文字内容</p>
                <p style="font-size:14px;color:#666;">建议：</p>
                <ul style="font-size:14px;color:#666;margin-left:20px;">
                    <li>确保图片中的文字清晰可见</li>
                    <li>尽量拍摄正面、光线充足的图片</li>
                    <li>避免图片模糊或倾斜</li>
                </ul>
                <div style="margin-top:15px;">
                    <p><strong>手动输入图片中的文字:</strong></p>
                    <textarea id="manual-text-input-2" rows="6" cols="50" placeholder="请输入图片中的文字内容..."></textarea>
                    <br>
                    <button id="parse-manual-text-btn-2" style="margin-top:10px;">解析文字内容</button>
                </div>
            `;
            
            document.getElementById('parse-manual-text-btn-2').addEventListener('click', () => {
                const text = document.getElementById('manual-text-input-2').value;
                if (text.trim()) {
                    this.parseManualText(text);
                } else {
                    alert('请输入文字内容');
                }
            });
            return;
        }
        
        container.innerHTML = `
            <p style="color:green;">✅ 文字识别成功！</p>
            <p><strong>提取的文字:</strong></p>
            <div class="extracted-text">${data.extracted_text || '无'}</div>`;
        
        if (data.items && data.items.length > 0) {
            const itemsToSave = JSON.parse(JSON.stringify(data.items));
            container.innerHTML += `<p style="color:green;margin-top:10px;">识别到 ${data.items.length} 个任务项</p>
                <button id="save-image-items-btn" style="margin-top:10px;padding:8px 16px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;">保存识别结果</button>`;
            
            setTimeout(() => {
                const saveBtn = document.getElementById('save-image-items-btn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', async () => {
                        saveBtn.disabled = true;
                        saveBtn.textContent = '保存中...';
                        try {
                            await this.saveFileItems(itemsToSave);
                            // 关闭图片上传模态框并刷新任务列表
                            this.closeImageUploadModal();
                            await this.loadTasks();
                            await this.loadTrips();
                            this.renderCombinedList();
                        } finally {
                            saveBtn.disabled = false;
                            saveBtn.textContent = '保存识别结果';
                        }
                    });
                }
            }, 50);
        }
    }
    
    async parseManualText(text) {
        const container = document.getElementById('image-results');
        container.innerHTML = '<div class="loading-spinner"></div><p style="text-align:center;margin-top:15px;">正在解析...</p>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/upload/parse-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: this.currentUser.id, text: text })
            });
            
            const data = await response.json();
            if (response.ok) {
                let html = `<p style="color:green;">✅ 解析成功！</p>
                    <p><strong>解析的文字:</strong></p>
                    <div class="extracted-text">${data.text || '无'}</div>`;
                
                if (data.items && data.items.length > 0) {
                    const itemsToSave = JSON.parse(JSON.stringify(data.items));
                    html += `<p style="color:green;margin-top:10px;">识别到 ${data.items.length} 个行程项</p>
                        <button id="save-manual-items" style="margin-top:10px;">保存识别结果</button>`;
                    
                    container.innerHTML = html;
                    document.getElementById('save-manual-items').addEventListener('click', async () => {
                        await this.saveFileItems(itemsToSave);
                        // 关闭图片上传模态框并刷新任务列表
                        this.closeImageUploadModal();
                        await this.loadTasks();
                        await this.loadTrips();
                        this.renderCombinedList();
                    });
                } else {
                    html += `<p style="color:orange;margin-top:10px;">未识别到行程内容</p>`;
                    container.innerHTML = html;
                }
            } else {
                container.innerHTML = `<p style="color:red;">❌ 解析失败: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('解析失败:', error);
            container.innerHTML = '<p style="color:red;">❌ 解析失败，请重试</p>';
        }
    }
    
    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
    
    formatDateTimeLocal(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toISOString().slice(0, 16);
    }
    
    formatDateTimeForInput(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toISOString().slice(0, 16);
    }
    
    getPriorityClass(priority) {
        switch (priority) {
            case 1: return 'priority-high';
            case 2: return 'priority-medium';
            default: return 'priority-low';
        }
    }
    
    getPriorityText(priority) {
        switch (priority) {
            case 1: return '高优先级';
            case 2: return '中优先级';
            default: return '低优先级';
        }
    }
    
    getStatusClass(status) {
        switch (status) {
            case 'completed': return 'status-completed';
            case 'planned': return 'status-planned';
            default: return 'status-pending';
        }
    }
    
    bindPaginationEvents() {
        document.getElementById('prev-page')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.taskPage > 1) {
                this.taskPage--;
                this.renderCombinedList();
            }
        });
        
        document.getElementById('next-page')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const total = this.tasks.length + this.trips.length;
            const totalPages = Math.ceil(total / this.taskPerPage);
            if (this.taskPage < totalPages) {
                this.taskPage++;
                this.renderCombinedList();
            }
        });
        
        document.getElementById('per-page-select')?.addEventListener('change', (e) => {
            e.stopPropagation();
            this.taskPerPage = parseInt(e.target.value);
            this.taskPage = 1;
            this.renderCombinedList();
        });
    }
    
    bindBatchEvents() {
        // 全选复选框事件
        document.getElementById('select-all-tasks')?.addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('.item-checkbox').forEach(cb => {
                cb.checked = checked;
            });
            this.updateBatchButton();
        });
        
        // 按ESC退出批量选择模式
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.batchMode) {
                this.toggleBatchMode();
            }
        });
    }
    
    // 绑定单个复选框事件（每次渲染后调用）
    bindCheckboxEvents() {
        document.querySelectorAll('.item-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                this.updateBatchButton();
            });
        });
    }
    
    // 切换批量选择模式
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        this.selectedCount = 0;
        this.updateBatchModeUI();
    }
    
    // 清除选择但保持批量选择模式
    clearSelection() {
        this.selectedCount = 0;
        const checkboxes = document.querySelectorAll('.item-checkbox');
        const selectAll = document.getElementById('select-all-tasks');
        const batchDeleteBtn = document.getElementById('batch-delete-tasks');
        
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        if (selectAll) selectAll.checked = false;
        
        if (batchDeleteBtn) {
            batchDeleteBtn.disabled = true;
            const badge = batchDeleteBtn.querySelector('.badge');
            if (badge) badge.textContent = '0';
        }
    }
    
    // 更新批量删除按钮状态
    updateBatchButton() {
        const selected = document.querySelectorAll('.item-checkbox:checked');
        const batchDeleteBtn = document.getElementById('batch-delete-tasks');
        
        this.selectedCount = selected.length;
        
        if (batchDeleteBtn) {
            batchDeleteBtn.disabled = selected.length === 0;
            const badge = batchDeleteBtn.querySelector('.badge');
            if (badge) {
                badge.textContent = selected.length;
            }
        }
    }
    
    // 执行批量删除
    async batchDeleteSelected() {
        if (!this.batchMode) {
            // 如果没有进入批量选择模式，先进入
            this.toggleBatchMode();
            return;
        }
        
        const selected = document.querySelectorAll('.item-checkbox:checked');
        const taskItems = Array.from(selected).filter(cb => cb.dataset.type === 'task');
        const tripItems = Array.from(selected).filter(cb => cb.dataset.type === 'trip');
        
        const taskIds = taskItems.map(cb => parseInt(cb.dataset.id));
        const tripIds = tripItems.map(cb => parseInt(cb.dataset.id));
        
        // 如果没有选中任何项目，提示用户选择
        if (taskIds.length === 0 && tripIds.length === 0) {
            alert('请先勾选要删除的任务或行程');
            return;
        }
        
        let confirmMsg = '确定要删除选中的项目吗？\n';
        if (taskIds.length > 0) confirmMsg += `- ${taskIds.length} 个任务\n`;
        if (tripIds.length > 0) confirmMsg += `- ${tripIds.length} 个行程`;
        
        if (!confirm(confirmMsg)) return;
        
        try {
            let success = true;
            
            // 删除选中的任务
            if (taskIds.length > 0) {
                const taskResponse = await fetch(`${API_BASE_URL}/tasks/batch`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: taskIds })
                });
                if (!taskResponse.ok) success = false;
            }
            
            // 删除选中的行程
            if (tripIds.length > 0) {
                const tripResponse = await fetch(`${API_BASE_URL}/trips/batch`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: tripIds })
                });
                if (!tripResponse.ok) success = false;
            }
            
            if (success) {
                await this.loadTasks(this.taskPage);
                await this.loadTrips();
                this.renderCombinedList();
                this.toggleBatchMode();
                alert(`成功删除 ${selected.length} 个项目`);
            } else {
                alert('部分删除失败，请重试');
            }
        } catch (error) {
            console.error('批量删除失败:', error);
            alert('批量删除失败，请重试');
        }
    }
    
    bindEvents() {
        document.getElementById('login-btn')?.addEventListener('click', () => this.login());
        document.getElementById('register-btn')?.addEventListener('click', () => this.register());
        document.getElementById('to-register')?.addEventListener('click', () => this.showRegisterForm());
        document.getElementById('to-login')?.addEventListener('click', () => this.showLoginForm());
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
        
        document.getElementById('tab-all')?.addEventListener('click', () => this.switchTab('all'));
        document.getElementById('tab-ai')?.addEventListener('click', () => this.switchTab('ai'));
        
        document.getElementById('cat-all')?.addEventListener('click', () => this.filterCategory('all'));
        document.getElementById('cat-task')?.addEventListener('click', () => this.filterCategory('task'));
        document.getElementById('cat-trip')?.addEventListener('click', () => this.filterCategory('trip'));
        
        // 过滤已结束任务/行程的复选框事件
        document.getElementById('hide-ended-tasks')?.addEventListener('change', () => this.renderCombinedList());
        document.getElementById('hide-ended-trips')?.addEventListener('change', () => this.renderCombinedList());
        
        document.getElementById('add-task')?.addEventListener('click', () => this.openTaskModal());
        document.getElementById('save-task')?.addEventListener('click', () => this.saveTask());
        document.getElementById('close-task-modal')?.addEventListener('click', () => this.closeTaskModal());
        
        document.getElementById('add-trip')?.addEventListener('click', () => this.openTripModal());
        document.getElementById('save-trip')?.addEventListener('click', () => this.saveTrip());
        document.getElementById('close-trip-modal')?.addEventListener('click', () => this.closeTripModal());
        
        document.getElementById('add-itinerary-item')?.addEventListener('click', () => this.addItineraryItem());
        document.getElementById('close-itinerary-modal')?.addEventListener('click', () => this.closeItineraryModal());
        
        document.getElementById('ai-submit')?.addEventListener('click', () => this.aiPlan());
        document.getElementById('save-suggestion')?.addEventListener('click', () => this.confirmSaveSuggestion());
        document.getElementById('close-suggestion-modal')?.addEventListener('click', () => this.closeSuggestionModal());
        
        document.getElementById('upload-file-btn')?.addEventListener('click', () => this.openFileUploadModal());
        document.getElementById('upload-file-submit')?.addEventListener('click', () => this.uploadFile());
        document.getElementById('close-file-modal')?.addEventListener('click', () => this.closeFileUploadModal());
        
        document.getElementById('upload-image-btn')?.addEventListener('click', () => this.openImageUploadModal());
        document.getElementById('image-input')?.addEventListener('change', () => this.previewImage());
        document.getElementById('upload-image-submit')?.addEventListener('click', () => this.handleImageUpload());
        document.getElementById('close-image-modal')?.addEventListener('click', () => this.closeImageUploadModal());
        
        document.getElementById('tab-all')?.classList.add('active');
        
        // 批量选择相关事件绑定
        document.getElementById('batch-select-mode')?.addEventListener('click', () => this.toggleBatchMode());
        document.getElementById('batch-delete-tasks')?.addEventListener('click', () => this.batchDeleteSelected());
        document.getElementById('batch-cancel')?.addEventListener('click', () => this.clearSelection());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});