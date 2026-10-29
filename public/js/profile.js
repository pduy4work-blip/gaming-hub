/**
 * GameHub Community - User Profile Logic
 */

let profileUsername = '';
let profileUser = null;
let currentProfileTab = 'posts';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  profileUsername = urlParams.get('username');

  // Fallback if path is /users/:username
  if (!profileUsername) {
    const segments = window.location.pathname.split('/');
    if (segments[1] === 'users' && segments[2]) {
      profileUsername = segments[2];
    }
  }

  // Fallback to logged in user if not specified
  if (!profileUsername) {
    const currentUser = AuthState.getUser();
    if (currentUser) {
      profileUsername = currentUser.username;
    } else {
      window.location.href = '/login.html';
      return;
    }
  }

  await loadProfile();
  setupTabs();
  setupEditModal();
});

async function loadProfile() {
  try {
    const res = await api.get(`/users/profile/${encodeURIComponent(profileUsername)}`);
    if (!res.success) throw new Error(res.error);

    profileUser = res.data;
    document.title = `${profileUser.display_name} (@${profileUser.username}) - GameHub`;

    // Populate profile card
    document.getElementById('profile-avatar').src = profileUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    document.getElementById('profile-display-name').textContent = profileUser.display_name;
    document.getElementById('profile-username').textContent = `@${profileUser.username}`;
    document.getElementById('profile-bio').textContent = profileUser.bio || 'Chưa cập nhật tiểu sử.';
    document.getElementById('profile-joined').textContent = `Gia nhập từ ${new Date(profileUser.created_at).toLocaleDateString('vi-VN')}`;

    const roleBadge = document.getElementById('profile-role-badge');
    roleBadge.className = `role-badge ${profileUser.role}`;
    roleBadge.textContent = profileUser.role;

    // Stats
    document.getElementById('stat-posts').textContent = profileUser.posts_count;
    document.getElementById('stat-likes').textContent = profileUser.total_likes_received;
    document.getElementById('stat-games').textContent = profileUser.followed_games_count;

    // Check if viewing own profile
    const currentUser = AuthState.getUser();
    const isOwner = currentUser && (currentUser.id === profileUser.id || currentUser.username === profileUser.username);

    if (isOwner) {
      document.getElementById('tab-bookmarks-btn').style.display = 'flex';
      document.getElementById('profile-action-area').innerHTML = `
        <button id="edit-profile-btn" class="btn btn-outline btn-sm">Chỉnh sửa hồ sơ</button>
      `;
      document.getElementById('edit-profile-btn').addEventListener('click', openEditModal);
    }

    loadTabContent();
  } catch (err) {
    document.getElementById('profile-card').innerHTML = `
      <div style="text-align: center; color: var(--color-danger); padding: 2rem;">
        <p>Lỗi: ${escapeHtml(err.message)}</p>
        <a href="/" class="btn btn-secondary btn-sm" style="margin-top: 1rem;">Về trang chủ</a>
      </div>
    `;
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.feed-tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentProfileTab = btn.dataset.tab;
      loadTabContent();
    });
  });
}

async function loadTabContent() {
  const container = document.getElementById('profile-tab-content');
  container.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="loading-spinner"></div></div>';

  if (currentProfileTab === 'posts') {
    try {
      const res = await api.get(`/posts?author=${encodeURIComponent(profileUsername)}&limit=50`);
      const posts = res.data;
      if (posts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Chưa có bài viết nào</div><p>Thành viên này chưa đăng bài viết nào trên diễn đàn.</p></div>';
        return;
      }
      container.innerHTML = `<div class="post-list">${posts.map(p => renderSimplePostCard(p)).join('')}</div>`;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--color-danger); text-align: center;">Lỗi tải bài viết.</div>`;
    }
  } else if (currentProfileTab === 'bookmarks') {
    try {
      const res = await api.get(`/users/bookmarks/${encodeURIComponent(profileUsername)}`);
      const bookmarks = res.data;
      if (bookmarks.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Chưa lưu bài viết nào</div><p>Bạn chưa lưu bài viết nào vào danh sách dấu trang.</p></div>';
        return;
      }
      container.innerHTML = `<div class="post-list">${bookmarks.map(p => renderSimplePostCard(p)).join('')}</div>`;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--color-danger); text-align: center;">Lỗi tải bài viết đã lưu.</div>`;
    }
  } else if (currentProfileTab === 'games') {
    try {
      const res = await api.get(`/users/followed-games/${encodeURIComponent(profileUsername)}`);
      const games = res.data;
      if (games.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-title">Chưa theo dõi game nào</div><p>Thành viên này chưa theo dõi cộng đồng game nào.</p></div>';
        return;
      }
      container.innerHTML = `
        <div class="games-grid">
          ${games.map(g => `
            <div class="game-card">
              <img src="${g.cover_image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'}" class="game-card-cover" alt="">
              <div class="game-card-content">
                <h3 class="game-card-title"><a href="/?game=${encodeURIComponent(g.slug)}">${escapeHtml(g.name)}</a></h3>
                <p class="game-card-desc">${escapeHtml(g.description || '')}</p>
                <div class="game-card-footer">
                  <span style="font-size: 0.85rem; color: var(--text-muted);">${g.posts_count} bài viết</span>
                  <a href="/?game=${encodeURIComponent(g.slug)}" class="btn btn-outline btn-sm">Xem diễn đàn</a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--color-danger); text-align: center;">Lỗi tải danh sách game.</div>`;
    }
  }
}

function renderSimplePostCard(p) {
  return `
    <article class="post-card">
      <div class="post-card-meta">
        <span style="font-size: 0.82rem; color: var(--text-muted);">${formatRelativeTime(p.created_at)}</span>
        ${p.game_name ? `<span class="post-game-badge">${escapeHtml(p.game_name)}</span>` : ''}
      </div>
      <h3 class="post-card-title">
        <a href="/post.html?slug=${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>
      </h3>
      <p class="post-card-excerpt">${escapeHtml(p.excerpt || '')}</p>
      <div class="post-card-actions">
        <div class="post-actions-group">
          <span class="action-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> ${p.likes_count}</span>
          <span class="action-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${p.comments_count}</span>
          <span class="action-btn"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> ${p.view_count}</span>
        </div>
      </div>
    </article>
  `;
}

function setupEditModal() {
  const modal = document.getElementById('edit-profile-modal');
  const closeBtn = document.getElementById('close-profile-modal');
  const cancelBtn = document.getElementById('cancel-profile-btn');
  const form = document.getElementById('edit-profile-form');

  window.openEditModal = () => {
    document.getElementById('edit-display-name').value = profileUser.display_name;
    document.getElementById('edit-bio').value = profileUser.bio || '';
    document.getElementById('edit-avatar-url').value = profileUser.avatar_url || '';
    modal.classList.add('active');
  };

  function closeModal() {
    modal.classList.remove('active');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // Avatar file input upload
  document.getElementById('avatar-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showToast('Đang tải ảnh đại diện...', 'info');
    try {
      const res = await api.upload(file);
      if (res.success) {
        document.getElementById('edit-avatar-url').value = res.url;
        showToast('Tải ảnh đại diện thành công!', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const displayName = document.getElementById('edit-display-name').value.trim();
      const bio = document.getElementById('edit-bio').value.trim();
      const avatarUrl = document.getElementById('edit-avatar-url').value.trim();

      try {
        const res = await api.put('/users/profile', {
          displayName,
          bio,
          avatarUrl
        });

        if (res.success) {
          AuthState.setUser(res.user);
          showToast(res.message, 'success');
          closeModal();
          await loadProfile();
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}
