/**
 * GameHub Community - Post Details & Comments Logic
 */

let currentPost = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let slug = urlParams.get('slug');

  // If path is /post/:slug
  if (!slug) {
    const segments = window.location.pathname.split('/');
    if (segments[1] === 'post' && segments[2]) {
      slug = segments[2];
    }
  }

  if (!slug) {
    showError('Không tìm thấy thông tin bài viết.');
    return;
  }

  await loadPostDetails(slug);
  setupReportModal();
});

async function loadPostDetails(slug) {
  const loading = document.getElementById('post-loading');
  const container = document.getElementById('post-container');

  try {
    const res = await api.get(`/posts/${encodeURIComponent(slug)}`);
    if (!res.success) throw new Error(res.error);

    currentPost = res.data;

    // Set page title
    document.title = `${currentPost.title} - GameHub Community`;

    // Populate post fields
    document.getElementById('post-title').textContent = currentPost.title;
    document.getElementById('post-date').textContent = new Date(currentPost.created_at).toLocaleDateString('vi-VN');
    document.getElementById('post-views').textContent = currentPost.view_count;

    // Author info
    const authorAvatar = document.getElementById('post-author-avatar');
    authorAvatar.src = currentPost.author_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';
    authorAvatar.alt = currentPost.author_display_name;
    document.getElementById('post-author-avatar-link').href = `/profile.html?username=${encodeURIComponent(currentPost.author_username)}`;

    const authorName = document.getElementById('post-author-name');
    authorName.textContent = currentPost.author_display_name;
    authorName.href = `/profile.html?username=${encodeURIComponent(currentPost.author_username)}`;

    const roleBadge = document.getElementById('post-author-role');
    roleBadge.className = `role-badge ${currentPost.author_role}`;
    roleBadge.textContent = currentPost.author_role;

    // Game tag
    const gameTag = document.getElementById('post-game-tag');
    if (currentPost.game_name) {
      gameTag.innerHTML = `
        <a href="/?game=${encodeURIComponent(currentPost.game_slug)}" class="post-game-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="6 2 18 2 18 6 6 6 6 2"/><rect x="3" y="6" width="18" height="16" rx="2"/></svg>
          ${escapeHtml(currentPost.game_name)}
        </a>
      `;
    }

    // Body content (sanitized by backend)
    document.getElementById('post-body-content').innerHTML = currentPost.content;

    // Likes count & button
    const likeBtn = document.getElementById('post-like-btn');
    document.getElementById('post-likes-count').textContent = currentPost.likes_count;
    if (currentPost.is_liked) {
      likeBtn.classList.add('active-like');
      likeBtn.querySelector('svg').setAttribute('fill', 'currentColor');
    }
    likeBtn.addEventListener('click', toggleLike);

    // Bookmark button
    const bookmarkBtn = document.getElementById('post-bookmark-btn');
    if (currentPost.is_bookmarked) {
      bookmarkBtn.classList.add('active-bookmark');
      bookmarkBtn.querySelector('svg').setAttribute('fill', 'currentColor');
    }
    bookmarkBtn.addEventListener('click', toggleBookmark);

    // Share button
    document.getElementById('post-share-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Đã sao chép liên kết bài viết!', 'success');
      });
    });

    // Report button
    document.getElementById('post-report-btn').addEventListener('click', () => {
      openReportModal('post', currentPost.id);
    });

    // Author edit/delete actions
    const currentUser = AuthState.getUser();
    if (currentUser && (currentUser.id === currentPost.author_id || ['moderator', 'admin'].includes(currentUser.role))) {
      const actionsArea = document.getElementById('post-author-actions');
      actionsArea.innerHTML = `
        <a href="/create-post.html?edit=${currentPost.id}" class="btn btn-outline btn-sm">Sửa bài</a>
        <button id="delete-post-btn" class="btn btn-danger btn-sm">Xóa bài</button>
      `;

      document.getElementById('delete-post-btn').addEventListener('click', async () => {
        if (confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.')) {
          try {
            await api.delete(`/posts/${currentPost.id}`);
            showToast('Đã xóa bài viết.', 'success');
            setTimeout(() => window.location.href = '/', 1000);
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    }

    // Show container
    loading.style.display = 'none';
    container.style.display = 'block';

    // Load comments
    loadComments();

    // Bind submit comment
    document.getElementById('submit-comment-btn').addEventListener('click', () => submitComment());
  } catch (err) {
    showError(err.message);
  }
}

async function toggleLike() {
  const user = AuthState.getUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để thích bài viết.', 'error');
    return;
  }

  const btn = document.getElementById('post-like-btn');
  const countSpan = document.getElementById('post-likes-count');

  try {
    const res = await api.post(`/posts/${currentPost.id}/like`);
    if (res.success) {
      countSpan.textContent = res.likesCount;
      const svg = btn.querySelector('svg');
      if (res.liked) {
        btn.classList.add('active-like');
        svg.setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('active-like');
        svg.setAttribute('fill', 'none');
      }
      showToast(res.message, 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleBookmark() {
  const user = AuthState.getUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để lưu bài viết.', 'error');
    return;
  }

  const btn = document.getElementById('post-bookmark-btn');
  try {
    const res = await api.post(`/posts/${currentPost.id}/bookmark`);
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
}

async function loadComments() {
  const listContainer = document.getElementById('comments-list-container');
  const countSpan = document.getElementById('comments-count');

  try {
    const res = await api.get(`/comments/post/${currentPost.id}`);
    if (!res.success) return;

    countSpan.textContent = res.total;
    const comments = res.data;

    if (comments.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.95rem;">
          Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!
        </div>
      `;
      return;
    }

    listContainer.innerHTML = comments.map(c => renderCommentItem(c)).join('');
  } catch (err) {
    listContainer.innerHTML = `<div style="color: var(--color-danger); text-align: center;">Lỗi tải bình luận.</div>`;
  }
}

function renderCommentItem(c) {
  const currentUser = AuthState.getUser();
  const canDelete = currentUser && (currentUser.id === c.author_id || ['moderator', 'admin'].includes(currentUser.role));

  return `
    <div class="comment-item" id="comment-${c.id}">
      <img src="${c.author_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}" class="avatar avatar-sm" alt="${escapeHtml(c.author_display_name)}">
      
      <div class="comment-content-box">
        <div class="comment-header">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <a href="/profile.html?username=${encodeURIComponent(c.author_username)}" class="comment-author-name">${escapeHtml(c.author_display_name)}</a>
            <span class="role-badge ${c.author_role}">${c.author_role}</span>
            <span style="font-size: 0.78rem; color: var(--text-muted); margin-left: 4px;">• ${formatRelativeTime(c.created_at)}</span>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            ${canDelete ? `
              <button class="btn btn-ghost btn-sm" onclick="handleDeleteComment(${c.id})" style="color: var(--color-danger); padding: 1px 4px; font-size: 0.78rem;">Xóa</button>
            ` : ''}
            <button class="btn btn-ghost btn-sm" onclick="openReportModal('comment', ${c.id})" style="color: var(--text-muted); padding: 1px 4px; font-size: 0.78rem;">Báo cáo</button>
          </div>
        </div>

        <div class="comment-text">${c.content}</div>

        <div class="comment-actions">
          <button class="btn btn-ghost btn-sm" onclick="toggleReplyBox(${c.id})" style="padding: 2px 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
            Trả lời
          </button>
        </div>

        <!-- Inline Reply Input Box (hidden by default) -->
        <div id="reply-box-${c.id}" style="display: none; margin-top: 0.75rem;">
          <textarea id="reply-input-${c.id}" class="comment-textarea" style="min-height: 60px;" placeholder="Viết phản hồi cho ${escapeHtml(c.author_display_name)}..."></textarea>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="toggleReplyBox(${c.id})">Hủy</button>
            <button class="btn btn-primary btn-sm" onclick="submitComment(${c.id})">Gửi phản hồi</button>
          </div>
        </div>

        <!-- Nested Replies -->
        ${c.replies && c.replies.length > 0 ? `
          <div class="replies-list">
            ${c.replies.map(r => renderCommentItem(r)).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

window.toggleReplyBox = (commentId) => {
  const box = document.getElementById(`reply-box-${commentId}`);
  if (box) {
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
  }
};

window.submitComment = async (parentId = null) => {
  const user = AuthState.getUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để bình luận.', 'error');
    return;
  }

  let inputEl;
  if (parentId) {
    inputEl = document.getElementById(`reply-input-${parentId}`);
  } else {
    inputEl = document.getElementById('comment-input');
  }

  const content = inputEl ? inputEl.value.trim() : '';
  if (!content) {
    showToast('Nội dung bình luận không được để trống.', 'error');
    return;
  }

  try {
    const res = await api.post(`/comments/post/${currentPost.id}`, {
      content,
      parentId
    });

    if (res.success) {
      showToast('Đã đăng bình luận!', 'success');
      inputEl.value = '';
      if (parentId) {
        toggleReplyBox(parentId);
      }
      loadComments();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleDeleteComment = async (commentId) => {
  if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

  try {
    const res = await api.delete(`/comments/${commentId}`);
    if (res.success) {
      showToast('Đã xóa bình luận.', 'success');
      loadComments();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

function setupReportModal() {
  const modal = document.getElementById('report-modal');
  const closeBtn = document.getElementById('close-report-modal');
  const cancelBtn = document.getElementById('cancel-report-btn');
  const form = document.getElementById('report-form');

  window.openReportModal = (targetType, targetId) => {
    const user = AuthState.getUser();
    if (!user) {
      showToast('Vui lòng đăng nhập để gửi báo cáo.', 'error');
      return;
    }
    document.getElementById('report-target-type').value = targetType;
    document.getElementById('report-target-id').value = targetId;
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
      const targetType = document.getElementById('report-target-type').value;
      const targetId = document.getElementById('report-target-id').value;
      const reason = document.getElementById('report-reason').value;
      const description = document.getElementById('report-description').value;

      try {
        const res = await api.post('/reports', {
          targetType,
          targetId,
          reason,
          description
        });
        if (res.success) {
          showToast(res.message, 'success');
          closeModal();
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function showError(msg) {
  const loading = document.getElementById('post-loading');
  if (loading) {
    loading.innerHTML = `
      <div class="card" style="text-align: center; color: var(--color-danger); padding: 2.5rem;">
        <h3>Không thể tải bài viết</h3>
        <p style="margin: 0.75rem 0 1.25rem;">${escapeHtml(msg)}</p>
        <a href="/" class="btn btn-secondary btn-sm">Quay về trang chủ</a>
      </div>
    `;
  }
}
