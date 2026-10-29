const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const app = require('../src/app');
const { initDatabase } = require('../src/database');
const { seed } = require('../src/database/seed');

// Helper to simulate HTTP requests in memory without needing network socket permissions
function dispatchRequest(method, url, { body, headers = {}, cookies = {} } = {}) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url, 'http://localhost');
    const req = new EventEmitter();
    req.method = method.toUpperCase();
    req.url = parsedUrl.pathname + parsedUrl.search;
    req.originalUrl = req.url;
    req.path = parsedUrl.pathname;
    req.query = Object.fromEntries(parsedUrl.searchParams.entries());
    req.headers = {
      'content-type': 'application/json',
      ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
    };
    req.cookies = { ...cookies };
    req.body = body || {};
    req.socket = { remoteAddress: '127.0.0.1' };

    const resHeaders = {};
    let statusCode = 200;
    let responseData = '';

    const res = {
      statusCode: 200,
      setHeader(name, val) {
        resHeaders[name.toLowerCase()] = val;
      },
      getHeader(name) {
        return resHeaders[name.toLowerCase()];
      },
      status(code) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      cookie(name, val, opts) {
        resHeaders['set-cookie'] = `${name}=${val}`;
      },
      clearCookie(name) {
        resHeaders['set-cookie'] = `${name}=; Max-Age=0`;
      },
      json(obj) {
        responseData = obj;
        resolve({ status: statusCode, headers: resHeaders, data: obj });
      },
      send(data) {
        responseData = data;
        resolve({ status: statusCode, headers: resHeaders, data });
      },
      end(data) {
        if (data) responseData = data;
        resolve({ status: statusCode, headers: resHeaders, data: responseData });
      }
    };

    app.handle(req, res, (err) => {
      if (err) {
        resolve({ status: 500, headers: resHeaders, data: { error: err.message } });
      } else {
        resolve({ status: 404, headers: resHeaders, data: { error: 'Not found' } });
      }
    });
  });
}

async function runTests() {
  console.log('🧪 Starting GameHub Community Test Suite (In-Memory Engine)...\n');

  initDatabase();
  seed();

  let testCount = 0;
  let passCount = 0;

  async function test(name, fn) {
    testCount++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error('    ', err.message);
    }
  }

  // --- AUTH TESTS ---
  console.log('1. Authentication Tests:');

  const testUser = {
    username: `tester_${Date.now().toString(36)}`,
    email: `tester_${Date.now().toString(36)}@test.com`,
    password: 'TestPassword@123',
    displayName: 'Test User'
  };

  let testUserToken = '';

  await test('Register new user successfully', async () => {
    const res = await dispatchRequest('POST', '/api/auth/register', { body: testUser });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.username, testUser.username);
    testUserToken = res.data.token;
  });

  await test('Reject duplicate username registration', async () => {
    const res = await dispatchRequest('POST', '/api/auth/register', { body: testUser });
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.code, 'USERNAME_TAKEN');
  });

  await test('Login with incorrect password fails', async () => {
    const res = await dispatchRequest('POST', '/api/auth/login', {
      body: {
        usernameOrEmail: testUser.username,
        password: 'WrongPassword999'
      }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  await test('Login with correct credentials returns user and token', async () => {
    const res = await dispatchRequest('POST', '/api/auth/login', {
      body: {
        usernameOrEmail: testUser.username,
        password: testUser.password
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.username, testUser.username);
  });

  await test('Admin login works with seeded account', async () => {
    const res = await dispatchRequest('POST', '/api/auth/login', {
      body: {
        usernameOrEmail: 'admin',
        password: 'Admin@123456'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.role, 'admin');
  });

  // --- POSTS TESTS ---
  console.log('\n2. Posts & Feeds Tests:');

  await test('Fetch public posts list with real database records', async () => {
    const res = await dispatchRequest('GET', '/api/posts?limit=5');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length > 0);
  });

  let createdPostId;
  let createdPostSlug;

  await test('Create new post requires authentication', async () => {
    const res = await dispatchRequest('POST', '/api/posts', {
      body: {
        title: 'Unauthorized Post',
        content: 'This should fail.'
      }
    });
    assert.strictEqual(res.status, 401);
  });

  await test('Create new post as authenticated member', async () => {
    const res = await dispatchRequest('POST', '/api/posts', {
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: {
        title: 'Bí kíp leo rank Thách Đấu mùa 2026',
        content: '<p>Tập trung vào farm lính và cắm mắt kiểm soát mục tiêu lớn.</p>',
        gameId: 1
      }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    createdPostId = res.data.data.id;
    createdPostSlug = res.data.data.slug;
    assert.ok(createdPostSlug);
  });

  await test('Get post by slug with real view counter increment', async () => {
    const res1 = await dispatchRequest('GET', `/api/posts/${createdPostSlug}`);
    assert.strictEqual(res1.status, 200);
    const initialViews = res1.data.data.view_count;

    const res2 = await dispatchRequest('GET', `/api/posts/${createdPostSlug}`);
    assert.strictEqual(res2.data.data.view_count, initialViews + 1);
  });

  // --- INTERACTIONS TESTS ---
  console.log('\n3. Likes, Bookmarks & Comments Tests:');

  await test('Toggle like post twice (like then unlike)', async () => {
    const likeRes = await dispatchRequest('POST', `/api/posts/${createdPostId}/like`, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    assert.strictEqual(likeRes.status, 200);
    assert.strictEqual(likeRes.data.liked, true);

    const unlikeRes = await dispatchRequest('POST', `/api/posts/${createdPostId}/like`, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    assert.strictEqual(unlikeRes.status, 200);
    assert.strictEqual(unlikeRes.data.liked, false);
  });

  await test('Toggle bookmark post', async () => {
    const bmRes = await dispatchRequest('POST', `/api/posts/${createdPostId}/bookmark`, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    assert.strictEqual(bmRes.status, 200);
    assert.strictEqual(bmRes.data.bookmarked, true);
  });

  let createdCommentId;
  await test('Create comment and nested reply with hierarchy', async () => {
    const commentRes = await dispatchRequest('POST', `/api/comments/post/${createdPostId}`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: { content: 'Bài viết rất chất lượng!' }
    });
    assert.strictEqual(commentRes.status, 201);
    createdCommentId = commentRes.data.data.id;

    const replyRes = await dispatchRequest('POST', `/api/comments/post/${createdPostId}`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
      body: {
        content: 'Cảm ơn bạn đã đọc!',
        parentId: createdCommentId
      }
    });
    assert.strictEqual(replyRes.status, 201);
    assert.strictEqual(replyRes.data.data.parent_id, createdCommentId);

    const treeRes = await dispatchRequest('GET', `/api/comments/post/${createdPostId}`);
    assert.strictEqual(treeRes.status, 200);
    const rootComment = treeRes.data.data.find(c => c.id === createdCommentId);
    assert.ok(rootComment);
    assert.strictEqual(rootComment.replies.length, 1);
  });

  // --- ACCESS CONTROL & ADMIN TESTS ---
  console.log('\n4. Access Control & Admin Tests:');

  await test('Regular member cannot access admin stats (403 Forbidden)', async () => {
    const res = await dispatchRequest('GET', '/api/admin/stats', {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    assert.strictEqual(res.status, 403);
  });

  await test('Admin can access admin stats and users list', async () => {
    const adminLogin = await dispatchRequest('POST', '/api/auth/login', {
      body: {
        usernameOrEmail: 'admin',
        password: 'Admin@123456'
      }
    });
    const adminToken = adminLogin.data.token;

    const statsRes = await dispatchRequest('GET', '/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(statsRes.status, 200);
    assert.ok(statsRes.data.data.totalUsers >= 5);

    const usersRes = await dispatchRequest('GET', '/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(usersRes.status, 200);
    assert.ok(Array.isArray(usersRes.data.data));
  });

  console.log(`\n🏁 Test Run Completed: ${passCount}/${testCount} passed!`);
  if (passCount === testCount) {
    console.log('🎉 ALL 14 BACKEND TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
