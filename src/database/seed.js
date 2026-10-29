const { initDatabase, queryRun, queryOne } = require('./index');
const { hashPassword } = require('../utils/crypto');

function seed() {
  console.log('--- Initializing database and running seed ---');
  initDatabase();

  // Check if admin already exists
  const existingAdmin = queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (existingAdmin) {
    console.log('Database already has seeded data. Skipping seed.');
    return;
  }

  // 1. Seed Users
  console.log('Seeding users...');
  const users = [
    {
      username: 'admin',
      email: 'admin@gamehub.community',
      password: hashPassword('Admin@123456'),
      displayName: 'System Administrator',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      bio: 'Quản trị viên hệ thống GameHub Community. Đam mê esports và công nghệ web.',
      role: 'admin'
    },
    {
      username: 'mod_gamer',
      email: 'mod@gamehub.community',
      password: hashPassword('Mod@123456'),
      displayName: 'Alex Moderator',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      bio: 'Kiểm duyệt viên cộng đồng. Giữ cho diễn đàn thân thiện, văn minh và bổ ích.',
      role: 'moderator'
    },
    {
      username: 'pro_ninja',
      email: 'ninja@gamehub.community',
      password: hashPassword('Ninja@123456'),
      displayName: 'Ninja Player',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      bio: 'Chuyên gia FPS và Valorant Radiant. Thích chia sẻ lineups và phản xạ nhanh.',
      role: 'member'
    },
    {
      username: 'cyber_v',
      email: 'cyber_v@gamehub.community',
      password: hashPassword('Cyber@123456'),
      displayName: 'Valerie Night',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      bio: 'Night City explorer. Yêu thích game RPG sâu sắc và đồ họa thế hệ mới.',
      role: 'member'
    },
    {
      username: 'pixel_hero',
      email: 'pixel@gamehub.community',
      password: hashPassword('Pixel@123456'),
      displayName: 'Retro Pixel',
      avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=200&q=80',
      bio: 'Minecraft builder & Redstone engineer. Đam mê tự động hóa trong thế giới mở.',
      role: 'member'
    }
  ];

  const userIds = {};
  for (const u of users) {
    const res = queryRun(
      `INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.username, u.email, u.password, u.displayName, u.avatarUrl, u.bio, u.role]
    );
    userIds[u.username] = Number(res.lastInsertRowid);
  }

  // 2. Seed Games
  console.log('Seeding games...');
  const games = [
    {
      name: 'Valorant',
      slug: 'valorant',
      description: 'Game bắn súng góc nhìn thứ nhất chiến thuật 5v5 từ Riot Games với kỹ năng đặc vụ sắc sảo.',
      coverImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'League of Legends',
      slug: 'league-of-legends',
      description: 'Tựa game MOBA huyền thoại. Thảo luận meta Summoner\'s Rift, Đấu Trường Chân Lý và esports quốc tế.',
      coverImageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Minecraft',
      slug: 'minecraft',
      description: 'Thế giới mở sinh tồn khối vuông sáng tạo vô hạn. Kỹ thuật Redstone, xây dựng và modding.',
      coverImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Cyberpunk 2077',
      slug: 'cyberpunk-2077',
      description: 'Khám phá thành phố đêm Night City rực rỡ, thảo luận cốt truyện Phantom Liberty và tối ưu phần cứng.',
      coverImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Elden Ring',
      slug: 'elden-ring',
      description: 'Siêu phẩm Souls-like thế giới mở từ FromSoftware. Thảo luận cách khắc chế Boss và build vũ khí.',
      coverImageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Genshin Impact',
      slug: 'genshin-impact',
      description: 'Hành trình phiêu lưu tại thế giới Teyvat. Hướng dẫn xây dựng thánh di vật và đội hình nguyên tố.',
      coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const gameIds = {};
  for (const g of games) {
    const res = queryRun(
      `INSERT INTO games (name, slug, description, cover_image_url)
       VALUES (?, ?, ?, ?)`,
      [g.name, g.slug, g.description, g.coverImageUrl]
    );
    gameIds[g.slug] = Number(res.lastInsertRowid);
  }

  // 3. Seed Posts
  console.log('Seeding posts...');
  const posts = [
    {
      author: 'pro_ninja',
      game: 'valorant',
      title: 'Tổng hợp lineup Sova recon dart cực chuẩn tại map Ascent (Patch mới nhất)',
      slug: 'tong-hop-lineup-sova-recon-dart-ascent-2026',
      excerpt: 'Hướng dẫn chi tiết vị trí đứng, căn góc ngắm và lực bắn mũi tên thám thính khu vực A site và B main map Ascent.',
      content: `<h3>Giới thiệu về lineup Sova map Ascent</h3>
<p>Ascent luôn là bản đồ mà Sova phát huy tối đa sức mạnh nhờ những bức tường mỏng và khu vực Mid rộng lớn. Dưới đây là 3 mũi tên recon quan trọng nhất mà bất kỳ người chơi Sova nào cũng nên thuộc lòng.</p>
<h4>1. Mũi tên quét toàn bộ A Site từ A Lobby</h4>
<p>Đứng sát góc tường gần thùng gỗ A Lobby, căn tâm vào góc lá cây thứ hai bên phải tháp chuông. Sử dụng <strong>1 vạch lực (1 charge)</strong> và <strong>không nảy (0 bounce)</strong>.</p>
<blockquote>Mẹo: Mũi tên này sẽ cắm trên đỉnh mái A Main, quét được toàn bộ góc nấp Heaven và sau hòm Radianite.</blockquote>
<h4>2. Mũi tên B Main sang B Backsite</h4>
<p>Khi đồng đội chuẩn bị rush B, hãy đứng tại B Lobby, canh mép cánh cửa gỗ và bắn 2 vạch với 1 lần nảy để quét sạch kẻ địch phòng thủ sau trụ site.</p>
<pre><code>// Công thức nhớ nhanh:
Lực = 2 Bars
Nảy = 1 Bounce
Góc = Đỉnh chóp ngọn cây bên trái</code></pre>
<p>Chúc anh em leo rank thành công! Hãy để lại bình luận nếu muốn hướng dẫn thêm map Haven hoặc Bind nhé.</p>`
    },
    {
      author: 'pixel_hero',
      game: 'minecraft',
      title: 'Thiết kế trang trại Redstone tự động thu hoạch lúa mì hiệu suất cao 1.21',
      slug: 'trang-trai-redstone-tu-dong-thu-hoach-lua-mi-121',
      excerpt: 'Mô hình farm lúa mì và cà rốt hoàn toàn tự động sử dụng dân làng nông dân và cơ chế hopper minecart mới nhất.',
      content: `<h3>Tại sao nên dùng mô hình Farmer Villager?</h3>
<p>Thay vì phải bấm nút xả nước thủ công rồi trồng lại từng hạt giống, việc tận dụng AI của Dân Làng (Villager) giúp bạn có được nguồn lương thực vô tận mà không tốn công sức.</p>
<h4>Nguyên lý hoạt động</h4>
<ul>
  <li>Dân làng nông dân tự động gieo hạt và thu hoạch cây trồng khi chín.</li>
  <li>Bên dưới sàn đất là hệ thống đường ray chạy liên tục với Hopper Minecart để gom vật phẩm xuyên qua khối đất.</li>
  <li>Lúa mì và hạt giống được phân loại tự động vào rương kho trung tâm.</li>
</ul>
<p>Hệ thống này tiết kiệm tài nguyên và hạn chế tối đa giật lag server so với các máy farm dùng piston cổ điển.</p>`
    },
    {
      author: 'cyber_v',
      game: 'cyberpunk-2077',
      title: 'Top 3 build Netrunner bá đạo nhất trong Cyberpunk 2077 Phantom Liberty',
      slug: 'top-3-build-netrunner-ba-dao-phantom-liberty',
      excerpt: 'Tối ưu hóa RAM Cyberdeck kết hợp Monowire và Smart Weapons để dọn dẹp căn cứ Dogtown trong nháy mắt.',
      content: `<h3>Sự tiến hóa của Netrunner trong bản 2.0+</h3>
<p>Bản cập nhật lớn đã thay đổi hoàn toàn cây kỹ năng và cơ chế Quickhack. Netrunner giờ đây không chỉ đứng từ xa bấm nút mà là một cỗ máy chiến đấu cơ động và nguy hiểm.</p>
<h4>1. Build "Blackwall Daemon" - Sát thương tuyệt đối</h4>
<p>Sử dụng Cyberdeck Militech Canto Mk.6, cho phép bạn tung ra sức mạnh của Blackwall Gateway gây lan tỏa sát thương điện tử cực mạnh tới 5 mục tiêu liên tiếp.</p>
<h4>2. Combo Quickhack gợi ý:</h4>
<pre><code>Contagion + Overheat = Vụ nổ hóa học diện rộng
Cyberware Malfunction + Short Circuit = Khắc chế hoàn toàn Mini-boss</code></pre>
<p>Các bạn yêu thích phong cách tàng hình hay tấn công trực diện hơn? Hãy chia sẻ build của bạn bên dưới nhé!</p>`
    },
    {
      author: 'admin',
      game: 'league-of-legends',
      title: 'Chào mừng thành viên đến với diễn đàn GameHub Community - Quy định chung',
      slug: 'chao-mung-den-voi-gamehub-community-quy-dinh',
      excerpt: 'Thông báo chính thức về định hướng phát triển, văn hóa ứng xử và nội quy diễn đàn gaming.',
      content: `<h3>Kính gửi toàn thể cộng đồng game thủ GameHub,</h3>
<p>Chúng tôi rất vui mừng chào đón bạn đến với <strong>GameHub Community</strong> — không gian thảo luận hiện đại, văn minh và nhiệt huyết dành riêng cho game thủ Việt Nam và quốc tế.</p>
<h4>Nội quy cốt lõi của diễn đàn:</h4>
<ol>
  <li><strong>Tôn trọng lẫn nhau:</strong> Không xúc phạm, miệt thị vùng miền, giới tính hay công kích cá nhân.</li>
  <li><strong>Nội dung chất lượng:</strong> Khuyến khích bài viết chia sẻ kinh nghiệm thực tế, phân tích chiến thuật và hỏi đáp có tâm.</li>
  <li><strong>Nói không với gian lận:</strong> Nghiêm cấm chia sẻ phần mềm hack/cheat phá hoại tính công bằng trong game.</li>
  <li><strong>Bảo mật tài khoản:</strong> Không chia sẻ thông tin đăng nhập hoặc giao dịch trái phép.</li>
</ol>
<p>Mọi thắc mắc hoặc báo cáo vi phạm, bạn có thể bấm nút <em>Báo cáo</em> tại bài viết hoặc liên hệ ban quản trị. Chúc các bạn có những giây phút trải nghiệm tuyệt vời cùng GameHub!</p>`
    },
    {
      author: 'mod_gamer',
      game: 'elden-ring',
      title: 'Hướng dẫn đánh bại Malenia, Blade of Miquella không cần triệu hồi Spirit Ash',
      slug: 'huong-dan-danh-bai-malenia-blade-of-miquella',
      excerpt: 'Phân tích kỹ lưỡng các đòn đánh, cách né chiêu Waterfowl Dance chết người và timing trừng phạt sơ hở.',
      content: `<h3>Chiến thuật né Waterfowl Dance cự ly gần</h3>
<p>Waterfowl Dance là nỗi ám ảnh lớn nhất của mọi người chơi Elden Ring khi đối đầu Malenia. Dưới đây là phương pháp né đòn đã được kiểm chứng bởi các cao thủ:</p>
<p>Khi Malenia nhảy lên không trung:</p>
<ul>
  <li><strong>Làn sóng thứ nhất:</strong> Chạy vòng quanh chân cô ấy theo chiều kim đồng hồ rồi lăn ngược lại đúng thời điểm hạ kiếm.</li>
  <li><strong>Làn sóng thứ hai:</strong> Lăn thẳng về phía trước xuyên qua người Malenia.</li>
  <li><strong>Làn sóng thứ ba:</strong> Đứng yên nửa nhịp rồi lùi lại một bước, xoay nhẹ camera.</li>
</ul>
<p>Vũ khí khuyến nghị: Giáo hoặc Katanas có kèm hiệu ứng Bleed / Frostbite để ngắt hoạt ảnh của boss.</p>`
    }
  ];

  const postIds = [];
  for (const p of posts) {
    const res = queryRun(
      `INSERT INTO posts (author_id, game_id, title, slug, excerpt, content, view_count, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'))`,
      [userIds[p.author], gameIds[p.game], p.title, p.slug, p.excerpt, p.content, Math.floor(Math.random() * 40) + 10]
    );
    postIds.push(Number(res.lastInsertRowid));
  }

  // 4. Seed Comments
  console.log('Seeding comments...');
  const c1 = queryRun(
    `INSERT INTO comments (post_id, author_id, parent_id, content)
     VALUES (?, ?, NULL, ?)`,
    [postIds[0], userIds['cyber_v'], 'Bài viết quá hữu ích! Mình vừa thử lineup A Site vào game thắng luôn round eco quan trọng. Cảm ơn bác nhé!']
  );

  queryRun(
    `INSERT INTO comments (post_id, author_id, parent_id, content)
     VALUES (?, ?, ?, ?)`,
    [postIds[0], userIds['pro_ninja'], Number(c1.lastInsertRowid), 'Rất vui vì đã giúp ích cho bạn! Chuẩn bị có bài viết hướng dẫn map Haven nữa nhé.']
  );

  queryRun(
    `INSERT INTO comments (post_id, author_id, parent_id, content)
     VALUES (?, ?, NULL, ?)`,
    [postIds[0], userIds['pixel_hero'], 'Mong chờ video demo minh họa góc ngắm cho trực quan hơn bạn ơi.']
  );

  queryRun(
    `INSERT INTO comments (post_id, author_id, parent_id, content)
     VALUES (?, ?, NULL, ?)`,
    [postIds[1], userIds['admin'], 'Mô hình farm dân làng này chạy trên PaperMC có bị despawn vật phẩm không bạn?']
  );

  queryRun(
    `INSERT INTO comments (post_id, author_id, parent_id, content)
     VALUES (?, ?, NULL, ?)`,
    [postIds[3], userIds['mod_gamer'], 'Chào mừng tất cả các bạn gia nhập GameHub! Hãy cùng nhau xây dựng cộng đồng lớn mạnh.']
  );

  // 5. Seed Likes & Bookmarks & Follows
  console.log('Seeding interactions...');
  queryRun('INSERT OR IGNORE INTO post_likes (user_id, post_id) VALUES (?, ?)', [userIds['admin'], postIds[0]]);
  queryRun('INSERT OR IGNORE INTO post_likes (user_id, post_id) VALUES (?, ?)', [userIds['cyber_v'], postIds[0]]);
  queryRun('INSERT OR IGNORE INTO post_likes (user_id, post_id) VALUES (?, ?)', [userIds['pixel_hero'], postIds[0]]);
  queryRun('INSERT OR IGNORE INTO post_likes (user_id, post_id) VALUES (?, ?)', [userIds['pro_ninja'], postIds[1]]);
  queryRun('INSERT OR IGNORE INTO post_likes (user_id, post_id) VALUES (?, ?)', [userIds['mod_gamer'], postIds[3]]);

  queryRun('INSERT OR IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)', [userIds['cyber_v'], postIds[0]]);
  queryRun('INSERT OR IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)', [userIds['pro_ninja'], postIds[1]]);

  queryRun('INSERT OR IGNORE INTO game_follows (user_id, game_id) VALUES (?, ?)', [userIds['pro_ninja'], gameIds['valorant']]);
  queryRun('INSERT OR IGNORE INTO game_follows (user_id, game_id) VALUES (?, ?)', [userIds['pixel_hero'], gameIds['minecraft']]);
  queryRun('INSERT OR IGNORE INTO game_follows (user_id, game_id) VALUES (?, ?)', [userIds['cyber_v'], gameIds['cyberpunk-2077']]);

  // 6. Seed Notifications
  console.log('Seeding notifications...');
  queryRun(
    `INSERT INTO notifications (recipient_id, actor_id, type, target_type, target_id, message)
     VALUES (?, ?, 'comment', 'post', ?, ?)`,
    [userIds['pro_ninja'], userIds['cyber_v'], postIds[0], 'Valerie Night đã bình luận về bài viết của bạn: "Tổng hợp lineup Sova recon dart..."']
  );

  queryRun(
    `INSERT INTO notifications (recipient_id, actor_id, type, target_type, target_id, message)
     VALUES (?, ?, 'like', 'post', ?, ?)`,
    [userIds['pro_ninja'], userIds['admin'], postIds[0], 'System Administrator đã thích bài viết của bạn.']
  );

  console.log('--- Seed completed successfully! ---');
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
