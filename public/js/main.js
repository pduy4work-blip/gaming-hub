/**
 * GameHub Community - Main Navigation & Layout Manager
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth state
  const currentUser = await AuthState.checkAuth();

  // Render Top Header
  renderHeader(currentUser);

  // Render Mobile Drawer
  renderMobileDrawer(currentUser);

  // Render Footer
  renderFooter();

  // If user is logged in, fetch notifications count
  if (currentUser) {
    updateNotificationBadge();
  }
});

function renderHeader(user) {
  const headerContainer = document.getElementById('site-header');
  if (!headerContainer) return;

  const currentPath = window.location.pathname;

  let userSectionHtml = '';
  if (user) {
    userSectionHtml = `
      <a href="/create-post.html" class="btn btn-primary btn-sm" title="Tạo bài viết mới">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Tạo bài</span>
      </a>

      <a href="/notifications.html" class="btn-icon" id="notification-btn" title="Thông báo" style="position: relative;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span id="unread-badge" style="display: none; position: absolute; top: -3px; right: -3px; background-color: var(--color-primary); color: #fff; font-size: 10px; font-weight: 700; width: 17px; height: 17px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--bg-surface);">0</span>
      </a>

      <div class="user-menu-dropdown-wrapper" style="position: relative;">
        <button id="user-avatar-btn" class="btn-ghost" style="padding: 2px; border-radius: var(--radius-full); display: flex; align-items: center; gap: 6px;">
          <img src="${user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" alt="${escapeHtml(user.displayName)}" class="avatar avatar-sm">
          <span style="font-weight: 600; font-size: 0.88rem; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(user.displayName)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <div id="user-dropdown-menu" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); width: 200px; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 0.5rem; z-index: 200;">
          <div style="padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-subtle); margin-bottom: 0.35rem;">
            <div style="font-weight: 700; font-size: 0.9rem;">${escapeHtml(user.displayName)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">@${escapeHtml(user.username)}</div>
            <span class="role-badge ${user.role}" style="margin-top: 4px;">${user.role}</span>
          </div>
          <a href="/profile.html?username=${encodeURIComponent(user.username)}" class="nav-link" style="width: 100%;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Hồ sơ của tôi
          </a>
          ${['moderator', 'admin'].includes(user.role) ? `
            <a href="/admin.html" class="nav-link" style="width: 100%;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Quản trị diễn đàn
            </a>
          ` : ''}
          <div style="border-top: 1px solid var(--border-subtle); margin: 0.35rem 0;"></div>
          <button id="logout-btn" class="nav-link" style="width: 100%; border: none; background: none; color: var(--color-danger); cursor: pointer; text-align: left;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Đăng xuất
          </button>
        </div>
      </div>
    `;
  } else {
    userSectionHtml = `
      <a href="/login.html" class="btn btn-outline btn-sm">Đăng nhập</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Đăng ký</a>
    `;
  }

  headerContainer.innerHTML = `
    <div class="header-container">
      <div class="header-left">
        <button id="mobile-menu-toggle" class="btn-icon" style="display: none;" aria-label="Mở menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <a href="/" class="brand-logo">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <span>GameHub</span>
        </a>

        <nav class="header-nav">
          <a href="/" class="nav-link ${currentPath === '/' || currentPath.endsWith('index.html') ? 'active' : ''}">Trang chủ</a>
          <a href="/games.html" class="nav-link ${currentPath.includes('games') ? 'active' : ''}">Khám phá Game</a>
        </nav>
      </div>

      <div class="header-search">
        <form id="global-search-form" class="search-input-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="global-search-input" class="search-input" placeholder="Tìm kiếm bài viết, chủ đề, thành viên..." autocomplete="off">
        </form>
      </div>

      <div class="header-actions">
        <button class="btn-icon theme-toggle-btn" title="Chuyển chế độ sáng/tối"></button>
        ${userSectionHtml}
      </div>
    </div>
  `;

  // Bind theme toggle
  const themeBtns = headerContainer.querySelectorAll('.theme-toggle-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.GameHubTheme.toggle();
    });
  });

  // Bind Search form
  const searchForm = document.getElementById('global-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const kw = document.getElementById('global-search-input').value.trim();
      if (kw) {
        window.location.href = `/?search=${encodeURIComponent(kw)}`;
      }
    });
  }

  // Bind User Dropdown Toggle
  const avatarBtn = document.getElementById('user-avatar-btn');
  const userMenu = document.getElementById('user-dropdown-menu');
  if (avatarBtn && userMenu) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      userMenu.style.display = 'none';
    });
  }

  // Bind Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.error(e);
      }
      AuthState.clear();
      showToast('Đã đăng xuất thành công.', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    });
  }

  // Responsive button check
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  if (mobileToggle && window.innerWidth <= 768) {
    mobileToggle.style.display = 'inline-flex';
  }
}

function renderMobileDrawer(user) {
  let drawer = document.getElementById('mobile-drawer');
  let overlay = document.getElementById('drawer-overlay');

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'mobile-drawer';
    drawer.className = 'mobile-drawer';
    document.body.appendChild(drawer);
  }

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'drawer-overlay';
    overlay.className = 'drawer-overlay';
    document.body.appendChild(overlay);
  }

  drawer.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
      <a href="/" class="brand-logo">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <span>GameHub</span>
      </a>
      <button id="close-drawer-btn" class="btn-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div style="margin-bottom: 1.5rem;">
      <form id="drawer-search-form" class="search-input-wrapper">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="drawer-search-input" class="search-input" placeholder="Tìm kiếm bài viết..." autocomplete="off">
      </form>
    </div>

    <ul class="sidebar-menu" style="flex: 1;">
      <li class="sidebar-menu-item"><a href="/"><span class="menu-item-left"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>Trang chủ</span></a></li>
      <li class="sidebar-menu-item"><a href="/games.html"><span class="menu-item-left"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 2 18 2 18 6 6 6 6 2"/><rect x="3" y="6" width="18" height="16" rx="2"/></svg>Khám phá Game</span></a></li>
      ${user ? `
        <li class="sidebar-menu-item"><a href="/create-post.html"><span class="menu-item-left"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Tạo bài viết mới</span></a></li>
        <li class="sidebar-menu-item"><a href="/notifications.html"><span class="menu-item-left"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>Thông báo</span></a></li>
        <li class="sidebar-menu-item"><a href="/profile.html?username=${encodeURIComponent(user.username)}"><span class="menu-item-left"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Hồ sơ cá nhân</span></a></li>
        ${['moderator', 'admin'].includes(user.role) ? `
          <li class="sidebar-menu-item"><a href="/admin.html"><span class="menu-item-left"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Quản trị</span></a></li>
        ` : ''}
      ` : `
        <li class="sidebar-menu-item"><a href="/login.html"><span class="menu-item-left">Đăng nhập</span></a></li>
        <li class="sidebar-menu-item"><a href="/register.html"><span class="menu-item-left">Đăng ký tài khoản</span></a></li>
      `}
    </ul>
  `;

  const toggle = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('close-drawer-btn');

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }

  if (toggle) toggle.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  const drawerSearch = document.getElementById('drawer-search-form');
  if (drawerSearch) {
    drawerSearch.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('drawer-search-input').value.trim();
      if (val) {
        window.location.href = `/?search=${encodeURIComponent(val)}`;
      }
    });
  }
}

function renderFooter() {
  const footerContainer = document.getElementById('site-footer');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <div class="footer-container">
      <div>
        <div style="font-weight: 700; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.25rem;">GameHub Community</div>
        <p style="font-size: 0.82rem; color: var(--text-muted);">Diễn đàn cộng đồng gaming hiện đại, tối giản và thân thiện.</p>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted);">
        © 2026 GameHub Community. All rights reserved.
      </div>
    </div>
  `;
}

async function updateNotificationBadge() {
  try {
    const res = await api.get('/notifications/unread-count');
    if (res.success && res.unreadCount > 0) {
      const badge = document.getElementById('unread-badge');
      if (badge) {
        badge.textContent = res.unreadCount > 99 ? '99+' : res.unreadCount;
        badge.style.display = 'flex';
      }
    }
  } catch (err) {
    // Non-critical background fetch
  }
}
