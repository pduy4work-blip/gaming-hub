/**
 * GameHub Community - Posts Feed & Home Page Logic
 */

let currentTab = 'latest';
let currentGameSlug = '';
let currentSearch = '';
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
  // Parse URL query params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab')) currentTab = urlParams.get('tab');
  if (urlParams.get('game')) currentGameSlug = urlParams.get('game');
  if (urlParams.get('search')) currentSearch = urlParams.get('search');
  if (urlParams.get('page')) currentPage = parseInt(urlParams.get('page'), 10) || 1;

  // Sync Tabs UI
  const tabButtons = document.querySelectorAll('.feed-tab');
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === currentTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      currentPage = 1;
      updateUrlAndFetch();
    });
  });

  // Load Games filter dropdown and sidebar
  loadGamesList();

  // Load Active Members sidebar widget
  loadActiveMembers();

  // Load Posts
  fetchPosts();

  // Bind clear filter
  const clearBtn = document.getElementById('clear-filter-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentSearch = '';
      currentGameSlug = '';
      currentPage = 1;
      const gameSelect = document.getElementById('game-filter-select');
      if (gameSelect) gameSelect.value = '';
      updateUrlAndFetch();
    });
  }
});

function updateUrlAndFetch() {
  const params = new URLSearchParams();
  if (currentTab !== 'latest') params.set('tab', currentTab);
  if (currentGameSlug) params.set('game', currentGameSlug);
  if (currentSearch) params.set('search', currentSearch);
  if (currentPage > 1) params.set('page', currentPage);

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.pushState({}, '', newUrl);

  fetchPosts();
}

async function loadGamesList() {
  try {
    const res = await api.get('/games');
    if (!res.success) return;

    const games = res.data;

    // Populate filter dropdown
    const select = document.getElementById('game-filter-select');
    if (select) {
      games.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.slug;
        opt.textContent = `${g.name} (${g.posts_count})`;
        if (g.slug === currentGameSlug) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener('change', () => {
        currentGameSlug = select.value;
        currentPage = 1;
        updateUrlAndFetch();
      });
    }

    // Populate sidebar games list
    const sidebarList = document.getElementById('sidebar-games-list');
    if (sidebarList) {
      if (games.length === 0) {
        sidebarList.innerHTML = '<li style="padding: 0.5rem; color: var(--text-muted); font-size: 0.85rem;">Chưa có game nào.</li>';
        return;
      }

      sidebarList.innerHTML = games.slice(0, 6).map(g => `
        <li class="sidebar-menu-item">
          <a href="/?game=${encodeURIComponent(g.slug)}" class="${g.slug === currentGameSlug ? 'active' : ''}">
            <span class="menu-item-left">
              <img src="${g.cover_image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=60&q=80'}" style="width: 20px; height: 20px; border-radius: 4px; object-fit: cover;" alt="">
              ${escapeHtml(g.name)}
            </span>
            <span class="badge-count">${g.posts_count}</span>
          </a>
        </li>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load games:', err);
  }
}

async function loadActiveMembers() {
  const container = document.getElementById('active-members-list');
  if (!container) return;

  try {
    // Fetch recent users or top authors
    const res = await api.get('/posts?limit=50');
    if (!res.success) return;

    // Aggregate authors by post count
    const authorMap = new Map();
    res.data.forEach(p => {
      if (!authorMap.has(p.author_id)) {
        authorMap.set(p.author_id, {
          username: p.author_username,
          displayName: p.author_display_name,
          avatarUrl: p.author_avatar_url,
          role: p.author_role,
          count: 1
        });
      } else {
        authorMap.get(p.author_id).count += 1;
      }
    });

    const activeList = Array.from(authorMap.values()).slice(0, 4);

    if (activeList.length === 0) {
      container.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted);">Chưa có thành viên nào.</div>';
      return;
    }

    container.innerHTML = activeList.map(u => `
      <a href="/profile.html?username=${encodeURIComponent(u.username)}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.5rem; border-radius: var(--radius-sm); text-decoration: none; color: inherit; transition: background 150ms;" onmouseover="this.style.backgroundColor='var(--bg-hover)'" onmouseout="this.style.backgroundColor='transparent'">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <img src="${u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}" class="avatar avatar-sm" alt="${escapeHtml(u.displayName)}">
          <div>
            <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary); line-height: 1.2;">${escapeHtml(u.displayName)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">@${escapeHtml(u.username)}</div>
          </div>
        </div>
        <span class="role-badge ${u.role}">${u.role}</span>
      </a>
    `).join('');
  } catch (err) {
    console.error('Failed to load active members:', err);
  }
}

async function fetchPosts() {
  const container = document.getElementById('posts-container');
  const statusBar = document.getElementById('filter-status-bar');
  const statusText = document.getElementById('filter-status-text');

  // Update status bar if filtering
  if (currentSearch || currentGameSlug) {
    statusBar.style.display = 'flex';
    const parts = [];
    if (currentGameSlug) parts.push(`Trò chơi: <strong>${escapeHtml(currentGameSlug)}</strong>`);
    if (currentSearch) parts.push(`Từ khóa: <strong>"${escapeHtml(currentSearch)}"</strong>`);
    statusText.innerHTML = `Đang lọc theo: ${parts.join(', ')}`;
  } else {
    statusBar.style.display = 'none';
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 3rem;">
      <div class="loading-spinner"></div>
      <p style="margin-top: 0.75rem; color: var(--text-muted); font-size: 0.9rem;">Đang tải danh sách bài viết...</p>
    </div>
  `;

  try {
    const query = new URLSearchParams({
      page: currentPage,
      limit: 10,
      tab: currentTab
    });
    if (currentGameSlug) query.set('gameSlug', currentGameSlug);
    if (currentSearch) query.set('search', currentSearch);

    const res = await api.get(`/posts?${query.toString()}`);
    if (!res.success) throw new Error(res.error);

    const posts = res.data;
    const pagination = res.pagination;

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <div class="empty-state-title">Chưa có bài viết nào</div>
          <p style="margin-bottom: 1.25rem;">Hãy là người đầu tiên tạo bài viết thảo luận trong cộng đồng!</p>
          <a href="/create-post.html" class="btn btn-primary btn-sm">Tạo bài viết ngay</a>
        </div>
      `;
      document.getElementById('pagination-container').style.display = 'none';
      return;
    }

    container.innerHTML = posts.map(p => `
      <article class="post-card" id="post-card-${p.id}">
        <div class="post-card-meta">
          <div class="post-author-info">
            <a href="/profile.html?username=${encodeURIComponent(p.author_username)}" style="text-decoration: none;">
              <img src="${p.author_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}" class="avatar avatar-sm" alt="${escapeHtml(p.author_display_name)}">
            </a>
            <div>
              <a href="/profile.html?username=${encodeURIComponent(p.author_username)}" class="post-author-name">${escapeHtml(p.author_display_name)}</a>
              <span class="role-badge ${p.author_role}" style="margin-left: 4px;">${p.author_role}</span>
              <span style="margin: 0 4px; color: var(--border-color);">•</span>
              <span>${formatRelativeTime(p.created_at)}</span>
            </div>
          </div>

          ${p.game_name ? `
            <a href="/?game=${encodeURIComponent(p.game_slug)}" class="post-game-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="6 2 18 2 18 6 6 6 6 2"/><rect x="3" y="6" width="18" height="16" rx="2"/></svg>
              ${escapeHtml(p.game_name)}
            </a>
          ` : ''}
        </div>

        <h2 class="post-card-title">
          <a href="/post.html?slug=${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>
        </h2>

        <p class="post-card-excerpt">${escapeHtml(p.excerpt || '')}</p>

        <div class="post-card-actions">
          <div class="post-actions-group">
            <button class="action-btn ${p.is_liked ? 'active-like' : ''}" onclick="handleLikePost(${p.id}, this)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${p.is_liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span class="likes-count">${p.likes_count}</span>
            </button>

            <a href="/post.html?slug=${encodeURIComponent(p.slug)}#comments" class="action-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>${p.comments_count}</span>
            </a>

            <span class="action-btn" style="cursor: default;" title="Lượt xem thực tế">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>${p.view_count}</span>
            </span>
          </div>

          <div class="post-actions-group">
            <button class="action-btn ${p.is_bookmarked ? 'active-bookmark' : ''}" onclick="handleBookmarkPost(${p.id}, this)" title="Lưu bài viết">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${p.is_bookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="action-btn" onclick="handleSharePost('${p.slug}')" title="Chia sẻ bài viết">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    renderPagination(pagination);
  } catch (err) {
    container.innerHTML = `
      <div class="card" style="text-align: center; color: var(--color-danger); padding: 2rem;">
        <p>Lỗi tải bài viết: ${escapeHtml(err.message)}</p>
        <button class="btn btn-secondary btn-sm" onclick="fetchPosts()" style="margin-top: 1rem;">Thử lại</button>
      </div>
    `;
  }
}

function renderPagination(pg) {
  const container = document.getElementById('pagination-container');
  if (!pg || pg.totalPages <= 1) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  let html = '';

  html += `
    <button class="pagination-btn" ${!pg.hasPrev ? 'disabled' : ''} onclick="goToPage(${pg.page - 1})">
      &larr; Trang trước
    </button>
  `;

  for (let i = 1; i <= pg.totalPages; i++) {
    html += `
      <button class="pagination-btn ${i === pg.page ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="pagination-btn" ${!pg.hasNext ? 'disabled' : ''} onclick="goToPage(${pg.page + 1})">
      Trang sau &rarr;
    </button>
  `;

  container.innerHTML = html;
}

window.goToPage = (page) => {
  currentPage = page;
  updateUrlAndFetch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.handleLikePost = async (postId, btn) => {
  const user = AuthState.getUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để thích bài viết.', 'error');
    return;
  }

  try {
    const res = await api.post(`/posts/${postId}/like`);
    if (res.success) {
      const countSpan = btn.querySelector('.likes-count');
      const svg = btn.querySelector('svg');
      if (res.liked) {
        btn.classList.add('active-like');
        svg.setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('active-like');
        svg.setAttribute('fill', 'none');
      }
      countSpan.textContent = res.likesCount;
      showToast(res.message, 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleBookmarkPost = async (postId, btn) => {
  const user = AuthState.getUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để lưu bài viết.', 'error');
    return;
  }

  try {
    const res = await api.post(`/posts/${postId}/bookmark`);
    if (res.success) {
      const svg = btn.querySelector('svg');
      if (res.bookmarked) {
        btn.classList.add('active-bookmark');
        svg.setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('active-bookmark');
        svg.setAttribute('fill', 'none');
      }
      showToast(res.message, 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleSharePost = (slug) => {
  const shareUrl = `${window.location.origin}/post.html?slug=${encodeURIComponent(slug)}`;
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast('Đã sao chép liên kết bài viết vào bộ nhớ tạm!', 'success');
  }).catch(() => {
    prompt('Sao chép liên kết:', shareUrl);
  });
};
