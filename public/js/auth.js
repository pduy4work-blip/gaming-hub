/**
 * GameHub Community - Authentication Forms Handler
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect away from auth pages
  const user = AuthState.getUser();
  if (user && (window.location.pathname.includes('login') || window.location.pathname.includes('register'))) {
    window.location.href = '/';
    return;
  }

  // Handle Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameOrEmail = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');
      const submitBtn = document.getElementById('login-submit-btn');

      errorDiv.style.display = 'none';

      if (!usernameOrEmail || !password) {
        errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin đăng nhập.';
        errorDiv.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang đăng nhập...';

      try {
        const res = await api.post('/auth/login', { usernameOrEmail, password });
        if (res.success) {
          AuthState.setUser(res.user, res.token);
          showToast('Đăng nhập thành công! Đang chuyển hướng...', 'success');
          setTimeout(() => {
            window.location.href = '/';
          }, 600);
        }
      } catch (err) {
        errorDiv.textContent = err.message || 'Đăng nhập thất bại.';
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng nhập ngay';
      }
    });
  }

  // Handle Register Form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim().toLowerCase();
      const displayName = document.getElementById('reg-display-name').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;
      const errorDiv = document.getElementById('register-error');
      const submitBtn = document.getElementById('register-submit-btn');

      errorDiv.style.display = 'none';

      // Client validation
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        errorDiv.textContent = 'Tên đăng nhập phải từ 3 đến 20 ký tự và chỉ chứa chữ cái thường, số, dấu gạch dưới (_).';
        errorDiv.style.display = 'block';
        return;
      }

      if (password.length < 6) {
        errorDiv.textContent = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
        errorDiv.style.display = 'block';
        return;
      }

      if (password !== confirmPassword) {
        errorDiv.textContent = 'Mật khẩu xác nhận không khớp.';
        errorDiv.style.display = 'block';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang đăng ký tài khoản...';

      try {
        const res = await api.post('/auth/register', {
          username,
          displayName,
          email,
          password,
          confirmPassword
        });

        if (res.success) {
          AuthState.setUser(res.user, res.token);
          showToast('Đăng ký tài khoản thành công! Đang vào diễn đàn...', 'success');
          setTimeout(() => {
            window.location.href = '/';
          }, 800);
        }
      } catch (err) {
        errorDiv.textContent = err.message || 'Đăng ký thất bại.';
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Đăng ký tài khoản';
      }
    });
  }
});

window.togglePasswordVisibility = (inputId) => {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};
