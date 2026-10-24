// Shared auth modal for all pages
// Works with Home, Gallery, Granite & Marble, Quartz & Slabs

const AUTH_CONFIG = {
  storageKey: 'malvigano_user_session',
  accountsKey: 'malvigano_user_accounts'
};

let authState = { mode: 'login' };

function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return (value || '').trim().replace(/\s+/g, '');
}

function getUserAccounts() {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG.accountsKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUserAccounts(accounts) {
  localStorage.setItem(AUTH_CONFIG.accountsKey, JSON.stringify(accounts));
}

function getCurrentUser() {
  try {
    const data = localStorage.getItem(AUTH_CONFIG.storageKey);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function persistCurrentUser(user) {
  localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(user));
}

function getUserDisplayName(user) {
  if (!user) return 'Guest';
  if (user.name && user.name.trim()) return user.name.trim();
  if (user.email && user.email.trim()) return user.email.trim().split('@')[0];
  return 'Client';
}

function updateNavAuthUI() {
  const user = getCurrentUser();
  const authNavSlots = document.querySelectorAll('.auth-nav-slot');
  const mobileMenus = document.querySelectorAll('.mobile-auth-slot');

  authNavSlots.forEach((slot) => {
    if (user) {
      slot.innerHTML = `
        <div style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:12.5px;font-weight:700;color:#003366;background:#f1f5f9;padding:6px 12px;border-radius:6px;border:1px solid #cbd5e1;">
            👤 ${getUserDisplayName(user)}
          </span>
          <button type="button" onclick="handleLogout()" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;">
            Logout
          </button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button type="button" class="auth-open-trigger" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;background:transparent;border:1.5px solid #003366;color:#003366;">
          Login / Register
        </button>
      `;
    }
  });

  mobileMenus.forEach((slot) => {
    if (user) {
      slot.innerHTML = `
        <div style="padding:10px 14px;background:#f8fafc;border-radius:8px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <span style="font-size:13px;font-weight:700;color:#003366;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            👤 ${getUserDisplayName(user)}
          </span>
          <button type="button" onclick="handleLogout()" style="background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;padding:5px 8px;font-size:12px;font-weight:700;cursor:pointer;">
            Logout
          </button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button type="button" class="auth-open-trigger" style="width:100%;height:42px;border-radius:8px;background:#003366;color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;">
          Login / Register
        </button>
      `;
    }
  });

  if (typeof syncCartUI === 'function') syncCartUI();
}

function bindAuthButtons() {
  document.querySelectorAll('.auth-open-trigger').forEach((button) => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      openAuthModal('login');
    });
  });
}

function injectAuthModalStyles() {
  if (document.getElementById('mm-stone-auth-modal-style')) return;

  const style = document.createElement('style');
  style.id = 'mm-stone-auth-modal-style';
  style.textContent = `
    .auth-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 26, 43, 0.7);
      backdrop-filter: blur(5px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 4000;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .auth-modal-backdrop.open {
      display: flex;
      opacity: 1;
    }
    .auth-modal-box {
      width: 100%;
      max-width: 480px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 34, 68, 0.35);
      overflow: hidden;
      transform: scale(0.95);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .auth-modal-backdrop.open .auth-modal-box {
      transform: scale(1);
    }
    .auth-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
      background: #fdfdfd;
    }
    .auth-modal-header h3 {
      margin: 0;
      font-size: 22px;
      color: #003366;
      font-family: 'Cinzel', serif;
      font-weight: 800;
    }
    .auth-modal-close {
      background: none;
      border: none;
      font-size: 28px;
      color: #64748b;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
    }
    .auth-modal-close:hover {
      color: #b32d2d;
      background: #fee2e2;
    }
    .auth-modal-body {
      padding: 24px;
    }
    .auth-tab-row {
      display: flex;
      gap: 8px;
      margin-bottom: 18px;
    }
    .auth-tab {
      flex: 1;
      height: 44px;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      background: #e2e8f0;
      color: #334155;
    }
    .auth-tab.active {
      background: #003366;
      color: #fff;
    }
    .auth-field {
      margin-bottom: 16px;
      text-align: left;
    }
    .auth-field label {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #2b3a4a;
    }
    .auth-field input {
      width: 100%;
      height: 46px;
      padding: 0 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      color: #1f2937;
      background: #f8fafc;
      outline: none;
    }
    .auth-field input:focus {
      border-color: #003366;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.12);
    }
    .auth-submit-btn {
      width: 100%;
      height: 46px;
      border: none;
      border-radius: 8px;
      background: #003366;
      color: #fff;
      font-weight: 800;
      cursor: pointer;
    }
    .auth-submit-btn:hover {
      background: #002244;
    }
    @media (max-width: 480px) {
      .auth-modal-header h3 {
        font-size: 18px;
      }
    }
  `;
  document.head.appendChild(style);
}

function injectAuthModal() {
  if (document.getElementById('authModalBackdrop')) return;

  injectAuthModalStyles();

  const modal = document.createElement('div');
  modal.id = 'authModalBackdrop';
  modal.className = 'auth-modal-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="auth-modal-box">
      <div class="auth-modal-header">
        <h3 id="authModalTitle">Customer Login</h3>
        <button type="button" class="auth-modal-close" aria-label="Close dialog" onclick="closeAuthModal()">&times;</button>
      </div>

      <div class="auth-modal-body">
        <div class="auth-tab-row">
          <button id="authTabLogin" type="button" class="auth-tab active" onclick="openAuthModal('login')">Login</button>
          <button id="authTabRegister" type="button" class="auth-tab" onclick="openAuthModal('register')">Register</button>
        </div>

        <div id="authLoginView" style="display:block;">
          <form onsubmit="submitLoginForm(event)">
            <div class="auth-field">
              <label for="loginEmailOrPhone">Email or Mobile *</label>
              <input id="loginEmailOrPhone" type="text" required placeholder="name@company.com or 9876543210">
            </div>

            <div class="auth-field">
              <label for="loginPassword">Password *</label>
              <input id="loginPassword" type="password" required placeholder="Enter your password">
            </div>

            <button type="submit" class="auth-submit-btn">Login</button>
          </form>
        </div>

        <div id="authRegisterView" style="display:none;">
          <form onsubmit="submitRegisterForm(event)">
            <div class="auth-field">
              <label for="regName">Full Name *</label>
              <input id="regName" type="text" required placeholder="e.g. John Doe">
            </div>

            <div class="auth-field">
              <label for="regEmail">Email Address *</label>
              <input id="regEmail" type="email" required placeholder="name@company.com">
            </div>

            <div class="auth-field">
              <label for="regPhone">Mobile / WhatsApp *</label>
              <input id="regPhone" type="tel" required placeholder="+91 9876543210">
            </div>

            <div class="auth-field">
              <label for="regPassword">Password *</label>
              <input id="regPassword" type="password" required placeholder="Create a password">
            </div>

            <div class="auth-field">
              <label for="regConfirmPassword">Confirm Password *</label>
              <input id="regConfirmPassword" type="password" required placeholder="Re-enter password">
            </div>

            <button type="submit" class="auth-submit-btn">Create Account</button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeAuthModal();
  });
}

function openAuthModal(mode = 'login') {
  authState.mode = mode;
  injectAuthModal();

  const modal = document.getElementById('authModalBackdrop');
  const title = document.getElementById('authModalTitle');
  const loginView = document.getElementById('authLoginView');
  const registerView = document.getElementById('authRegisterView');
  const loginTab = document.getElementById('authTabLogin');
  const registerTab = document.getElementById('authTabRegister');

  if (!modal) return;

  modal.classList.add('open');
  document.body.classList.add('modal-open');

  if (title) {
    title.textContent = mode === 'register' ? 'Create Customer Account' : 'Customer Login';
  }

  if (mode === 'register') {
    if (loginView) loginView.style.display = 'none';
    if (registerView) registerView.style.display = 'block';
    if (loginTab) loginTab.classList.remove('active');
    if (registerTab) registerTab.classList.add('active');
  } else {
    if (registerView) registerView.style.display = 'none';
    if (loginView) loginView.style.display = 'block';
    if (registerTab) registerTab.classList.remove('active');
    if (loginTab) loginTab.classList.add('active');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModalBackdrop');
  if (modal) modal.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function findAccountByEmailOrPhone(value) {
  const accounts = getUserAccounts();
  const normalized = normalizeEmail(value) || normalizePhone(value);

  return accounts.find((account) => {
    const email = normalizeEmail(account.email);
    const phone = normalizePhone(account.phone);
    return email === normalized || phone === normalized;
  });
}

function registerUser(data) {
  const accounts = getUserAccounts();

  const name = (data.name || '').trim();
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const password = (data.password || '').trim();

  if (!name || !email || !phone || !password) {
    alert('Please fill in all required fields.');
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return false;
  }

  if (phone.length < 8) {
    alert('Please enter a valid phone number.');
    return false;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters long.');
    return false;
  }

  const existing = accounts.find((account) => {
    return normalizeEmail(account.email) === email || normalizePhone(account.phone) === phone;
  });

  if (existing) {
    alert('This email or mobile number is already registered. Please log in instead.');
    openAuthModal('login');
    return false;
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    phone,
    password,
    createdAt: new Date().toISOString()
  };

  accounts.push(newUser);
  saveUserAccounts(accounts);

  const session = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    verifiedAt: new Date().toISOString()
  };

  persistCurrentUser(session);
  updateNavAuthUI();
  closeAuthModal();
  alert('Registration successful. You are now logged in.');
  return true;
}

function loginUser(data) {
  const identifier = (data.emailOrPhone || '').trim();
  const password = (data.password || '').trim();

  if (!identifier || !password) {
    alert('Please enter both your email/mobile and password.');
    return false;
  }

  const account = findAccountByEmailOrPhone(identifier);

  if (!account) {
    alert('No account found for this email or mobile number.');
    return false;
  }

  if (account.password !== password) {
    alert('Incorrect password. Please try again.');
    return false;
  }

  const session = {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    verifiedAt: new Date().toISOString()
  };

  persistCurrentUser(session);
  updateNavAuthUI();
  closeAuthModal();
  alert('Login successful.');
  return true;
}

function submitLoginForm(event) {
  if (event) event.preventDefault();
  const emailOrPhone = document.getElementById('loginEmailOrPhone')?.value || '';
  const password = document.getElementById('loginPassword')?.value || '';

  return loginUser({
    emailOrPhone,
    password
  });
}

function submitRegisterForm(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('regName')?.value || '';
  const email = document.getElementById('regEmail')?.value || '';
  const phone = document.getElementById('regPhone')?.value || '';
  const password = document.getElementById('regPassword')?.value || '';
  const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';

  if (password !== confirmPassword) {
    alert('Passwords do not match.');
    return false;
  }

  return registerUser({
    name,
    email,
    phone,
    password
  });
}

function handleLogout() {
  localStorage.removeItem(AUTH_CONFIG.storageKey);
  updateNavAuthUI();
  alert('You have successfully logged out.');
}

document.addEventListener('DOMContentLoaded', () => {
  injectAuthModal();
  bindAuthButtons();
  updateNavAuthUI();

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const authModal = document.getElementById('authModalBackdrop');
      if (authModal && authModal.classList.contains('open')) {
        closeAuthModal();
      }
    }
  });
});
