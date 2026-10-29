/**
 * GameHub Community - Administration & Moderation Logic
 */

let currentUser = null;
let currentTab = 'reports';

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await AuthState.checkAuth();

  if (!currentUser || !['moderator', 'admin'].includes(currentUser.role)) {
    document.getElementById('admin-forbidden-view').style.display = 'block';
    return;
  }

  document.getElementById('admin-dashboard-view').style.display = 'block';
  document.getElementById('admin-role-indicator').innerHTML = `
    <span class="role-badge ${currentUser.role}" style="font-size: 0.85rem; padding: 0.35rem 0.85rem;">
      Tài khoản: ${currentUser.role.toUpperCase()}
    </span>
  `;

  // Only admin sees Users and Games tabs
  if (currentUser.role !== 'admin') {
    const usersBtn = document.getElementById('tab-users-btn');
    if (usersBtn) usersBtn.style.display = 'none';
    const gamesBtn = document.getElementById('tab-games-btn');
    if (gamesBtn) gamesBtn.style.display = 'none';
  }

  await loadStats();
  setupTabs();
  loadTabContent();
  setupAddGameModal();
});

async function loadStats() {
  try {
    const res = await api.get('/admin/stats');
    if (res.success) {
      document.getElementById('stat-total-users').textContent = res.data.totalUsers;
      document.getElementById('stat-total-posts').textContent = res.data.totalPosts;
      document.getElementById('stat-total-comments').textContent = res.data.totalComments;
      document.getElementById('stat-pending-reports').textContent = res.data.pendingReports;
    }
  } catch (err) {
    console.error('Stats load error:', err);
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.feed-tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      loadTabContent();
    });
  });
}

function loadTabContent() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = '<div style="text-align: center; padding: 2.5rem;"><div class="loading-spinner"></div></div>';

  if (currentTab === 'reports') {
    loadReportsTab();
  } else if (currentTab === 'users') {
    loadUsersTab();
  } else if (currentTab === 'games') {
    loadGamesTab();
  } else if (currentTab === 'logs') {
    loadLogsTab();
  }
}

// 1. Reports Tab
async function loadReportsTab() {
  const container = document.getElementById('admin-tab-content');
  try {
    const res = await api.get('/admin/reports?status=pending');
    const reports = res.data;

    if (reports.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Không có báo cáo chờ xử lý</div>
          <p>Tất cả các báo cáo vi phạm đã được giải quyết hoặc chưa có vi phạm mới.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
              <th style="padding: 0.75rem;">Đối tượng</th>
              <th style="padding: 0.75rem;">Lý do</th>
              <th style="padding: 0.75rem;">Mô tả</th>
              <th style="padding: 0.75rem;">Người báo cáo</th>
              <th style="padding: 0.75rem;">Thời gian</th>
              <th style="padding: 0.75rem; text-align: right;">Hành động</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 0.75rem;">
                  <span class="role-badge" style="background-color: var(--bg-surface-elevated);">${r.target_type.toUpperCase()} #${r.target_id}</span>
                </td>
                <td style="padding: 0.75rem; font-weight: 600; color: var(--color-danger);">${escapeHtml(r.reason)}</td>
                <td style="padding: 0.75rem; color: var(--text-secondary); max-width: 250px;">${escapeHtml(r.description || 'Không có mô tả')}</td>
                <td style="padding: 0.75rem;">@${escapeHtml(r.reporter_username)}</td>
                <td style="padding: 0.75rem; color: var(--text-muted);">${formatRelativeTime(r.created_at)}</td>
                <td style="padding: 0.75rem; text-align: right; white-space: nowrap;">
                  <button class="btn btn-primary btn-sm" onclick="handleReviewReport(${r.id}, 'resolved')" style="margin-right: 0.35rem;">Giải quyết</button>
                  <button class="btn btn-outline btn-sm" onclick="handleReviewReport(${r.id}, 'dismissed')">Bỏ qua</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger); padding: 1rem;">Lỗi tải báo cáo: ${escapeHtml(err.message)}</div>`;
  }
}

window.handleReviewReport = async (reportId, status) => {
  const notes = prompt(`Ghi chú xử lý báo cáo (${status}):`, status === 'resolved' ? 'Đã xử lý nội dung vi phạm' : 'Nội dung hợp lệ');
  if (notes === null) return;

  try {
    const res = await api.put(`/admin/reports/${reportId}`, {
      status,
      actionNotes: notes
    });
    if (res.success) {
      showToast(res.message, 'success');
      loadStats();
      loadReportsTab();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// 2. Users Tab (Admin Only)
async function loadUsersTab() {
  const container = document.getElementById('admin-tab-content');
  try {
    const res = await api.get('/admin/users');
    const users = res.data;

    container.innerHTML = `
      <div class="card" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
              <th style="padding: 0.75rem;">Thành viên</th>
              <th style="padding: 0.75rem;">Email</th>
              <th style="padding: 0.75rem;">Vai trò</th>
              <th style="padding: 0.75rem;">Trạng thái</th>
              <th style="padding: 0.75rem;">Bài viết</th>
              <th style="padding: 0.75rem; text-align: right;">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 0.75rem; display: flex; align-items: center; gap: 0.6rem;">
                  <img src="${u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=80'}" class="avatar avatar-sm" alt="">
                  <div>
                    <div style="font-weight: 600;">${escapeHtml(u.display_name)}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">@${escapeHtml(u.username)}</div>
                  </div>
                </td>
                <td style="padding: 0.75rem; color: var(--text-secondary);">${escapeHtml(u.email)}</td>
                <td style="padding: 0.75rem;">
                  <select onchange="handleRoleChange(${u.id}, this.value)" class="form-control" style="padding: 2px 6px; font-size: 0.82rem; width: auto;" ${u.id === currentUser.id ? 'disabled' : ''}>
                    <option value="member" ${u.role === 'member' ? 'selected' : ''}>Member</option>
                    <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                  </select>
                </td>
                <td style="padding: 0.75rem;">
                  <span class="role-badge" style="background-color: ${u.status === 'active' ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)'}; color: ${u.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)'};">
                    ${u.status}
                  </span>
                </td>
                <td style="padding: 0.75rem;">${u.posts_count}</td>
                <td style="padding: 0.75rem; text-align: right;">
                  ${u.id !== currentUser.id ? `
                    <button 
                      class="btn ${u.status === 'active' ? 'btn-danger' : 'btn-secondary'} btn-sm"
                      onclick="handleStatusToggle(${u.id}, '${u.status}')"
                      style="padding: 2px 8px; font-size: 0.8rem;"
                    >
                      ${u.status === 'active' ? 'Khóa' : 'Kích hoạt'}
                    </button>
                  ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">(Bạn)</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger); padding: 1rem;">Lỗi tải thành viên.</div>`;
  }
}

window.handleRoleChange = async (userId, newRole) => {
  if (!confirm(`Bạn có chắc chắn muốn đổi vai trò thành viên này thành "${newRole}"?`)) {
    loadUsersTab();
    return;
  }

  try {
    const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
    if (res.success) {
      showToast(res.message, 'success');
      loadUsersTab();
    }
  } catch (err) {
    showToast(err.message, 'error');
    loadUsersTab();
  }
};

window.handleStatusToggle = async (userId, currentStatus) => {
  const newStatus = currentStatus === 'active' ? 'banned' : 'active';
  const actionText = newStatus === 'banned' ? 'khóa' : 'mở khóa';
  if (!confirm(`Bạn có chắc muốn ${actionText} tài khoản này?`)) return;

  try {
    const res = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
    if (res.success) {
      showToast(res.message, 'success');
      loadUsersTab();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// 3. Games Tab (Admin Only)
async function loadGamesTab() {
  const container = document.getElementById('admin-tab-content');
  try {
    const res = await api.get('/games');
    const games = res.data;

    container.innerHTML = `
      <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
        <button class="btn btn-primary btn-sm" onclick="openAddGameModal()">+ Thêm game mới</button>
      </div>

      <div class="card" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
              <th style="padding: 0.75rem;">Tên Game</th>
              <th style="padding: 0.75rem;">Slug</th>
              <th style="padding: 0.75rem;">Bài viết</th>
              <th style="padding: 0.75rem;">Người theo dõi</th>
            </tr>
          </thead>
          <tbody>
            ${games.map(g => `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 0.75rem; font-weight: 600;">${escapeHtml(g.name)}</td>
                <td style="padding: 0.75rem; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(g.slug)}</td>
                <td style="padding: 0.75rem;">${g.posts_count}</td>
                <td style="padding: 0.75rem;">${g.followers_count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger); padding: 1rem;">Lỗi tải game.</div>`;
  }
}

function setupAddGameModal() {
  const modal = document.getElementById('add-game-modal');
  const closeBtn = document.getElementById('close-game-modal');
  const cancelBtn = document.getElementById('cancel-game-btn');
  const form = document.getElementById('add-game-form');

  window.openAddGameModal = () => {
    modal.classList.add('active');
  };

  function closeModal() {
    modal.classList.remove('active');
    form.reset();
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('game-name-input').value.trim();
      const description = document.getElementById('game-desc-input').value.trim();
      const coverImageUrl = document.getElementById('game-cover-input').value.trim();

      try {
        const res = await api.post('/games', { name, description, coverImageUrl });
        if (res.success) {
          showToast(res.message, 'success');
          closeModal();
          loadGamesTab();
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

// 4. Moderation Logs Tab
async function loadLogsTab() {
  const container = document.getElementById('admin-tab-content');
  try {
    const res = await api.get('/admin/moderation-logs');
    const logs = res.data;

    if (logs.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-title">Chưa có nhật ký kiểm duyệt</div></div>`;
      return;
    }

    container.innerHTML = `
      <div class="card" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
              <th style="padding: 0.75rem;">Người thực hiện</th>
              <th style="padding: 0.75rem;">Hành động</th>
              <th style="padding: 0.75rem;">Đối tượng</th>
              <th style="padding: 0.75rem;">Lý do / Ghi chú</th>
              <th style="padding: 0.75rem;">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 0.75rem; font-weight: 600;">@${escapeHtml(l.moderator_username)}</td>
                <td style="padding: 0.75rem; color: var(--color-primary);">${escapeHtml(l.action)}</td>
                <td style="padding: 0.75rem;"><span class="role-badge">${l.target_type} #${l.target_id}</span></td>
                <td style="padding: 0.75rem; color: var(--text-secondary);">${escapeHtml(l.reason || '—')}</td>
                <td style="padding: 0.75rem; color: var(--text-muted);">${formatRelativeTime(l.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger); padding: 1rem;">Lỗi tải nhật ký: ${escapeHtml(err.message)}</div>`;
  }
}
