/**
 * GameHub Community - Games Explore Logic
 */

let allGames = [];

document.addEventListener('DOMContentLoaded', () => {
  loadGames();

  const searchInput = document.getElementById('games-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const kw = e.target.value.toLowerCase().trim();
      const filtered = allGames.filter(g => 
        g.name.toLowerCase().includes(kw) || (g.description && g.description.toLowerCase().includes(kw))
      );
      renderGames(filtered);
    });
  }
});

async function loadGames() {
  const container = document.getElementById('games-grid-container');
  try {
    const res = await api.get('/games');
    if (!res.success) throw new Error(res.error);

    allGames = res.data;
    renderGames(allGames);
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--color-danger); padding: 2rem;">
        <p>Lỗi tải danh mục game: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function renderGames(games) {
  const container = document.getElementById('games-grid-container');
  if (!container) return;

  if (games.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-title">Không tìm thấy trò chơi phù hợp</div>
        <p>Thử tìm kiếm với từ khóa khác.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = games.map(g => `
    <div class="game-card">
      <img src="${g.cover_image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'}" alt="${escapeHtml(g.name)}" class="game-card-cover">
      
      <div class="game-card-content">
        <h3 class="game-card-title">
          <a href="/?game=${encodeURIComponent(g.slug)}">${escapeHtml(g.name)}</a>
        </h3>

        <p class="game-card-desc">${escapeHtml(g.description || 'Chưa có mô tả cho trò chơi này.')}</p>

        <div class="game-card-footer">
          <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; gap: 0.75rem;">
            <span><strong>${g.posts_count}</strong> bài viết</span>
            <span>•</span>
            <span id="followers-count-${g.id}"><strong>${g.followers_count}</strong> người theo dõi</span>
          </div>

          <button 
            id="follow-btn-${g.id}" 
            class="btn ${g.is_following ? 'btn-secondary' : 'btn-outline'} btn-sm"
            onclick="handleFollowGame(${g.id})"
          >
            ${g.is_following ? 'Đang theo dõi' : '+ Theo dõi'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

window.handleFollowGame = async (gameId) => {
  const user = AuthState.getUser();
  if (!user) {
    showToast('Vui lòng đăng nhập để theo dõi trò chơi.', 'error');
    return;
  }

  const btn = document.getElementById(`follow-btn-${gameId}`);
  const countSpan = document.getElementById(`followers-count-${gameId}`);

  try {
    const res = await api.post(`/games/${gameId}/follow`);
    if (res.success) {
      if (res.following) {
        btn.className = 'btn btn-secondary btn-sm';
        btn.textContent = 'Đang theo dõi';
      } else {
        btn.className = 'btn btn-outline btn-sm';
        btn.textContent = '+ Theo dõi';
      }

      if (countSpan) {
        countSpan.innerHTML = `<strong>${res.followersCount}</strong> người theo dõi`;
      }

      showToast(res.message, 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};
