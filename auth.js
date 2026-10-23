// auth.js
// Clean login/register flow using localStorage
// Saves user accounts and current session
// Prevents duplicate email/phone registration
// Keeps logged-in user across later visits

const AUTH_CONFIG = {
  storageKey: 'malvigano_user_session',
  accountsKey: 'malvigano_user_accounts'
};

let authState = {
  mode: 'login'
};

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

  const renderDesktop = (slot) => {
    const buttonStyles = `
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      height:40px;
      padding:0 18px;
      border-radius:8px;
      font-size:13px;
      font-weight:700;
      cursor:pointer;
      transition:all 0.2s ease;
      white-space:nowrap;
    `;

    if (user) {
      slot.innerHTML = `
        <div style="display:inline-flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span style="font-size:12.5px; font-weight:700; color:var(--brand-navy); background:#f1f5f9; padding:6px 12px; border-radius:6px; border:1px solid #cbd5e1;">
            👤 ${getUserDisplayName(user)}
          </span>
          <button type="button" onclick="handleLogout()" style="${buttonStyles} background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;">
            Logout
          </button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button type="button" onclick="openAuthModal('login')" style="${buttonStyles}; background:transparent; border:1.5px solid var(--brand-navy); color:var(--brand-navy);">
          Login / Register
        </button>
      `;
    }
  };

  const renderMobile = (slot) => {
    if (user) {
      slot.innerHTML = `
        <div style="padding:10px 14px; background:#f8fafc; border-radius:8px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <span style="font-size:13px; font-weight:700; color:var(--brand-navy); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            👤 ${getUserDisplayName(user)}
          </span>
          <button type="button" onclick="handleLogout()" style="background:#fee2e2; color:#b91c1c; border:none; border-radius:6px; padding:5px 8px; font-size:12px; font-weight:700; cursor:pointer;">
            Logout
          </button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <a href="javascript:void(0)" onclick="openAuthModal('login')" style="font-size:15px; font-weight:700; padding:12px 14px; border-radius:8px; color:#ffffff; background:var(--brand-navy); text-align:center; display:block;">
          Create Account / Login
        </a>
      `;
    }
  };

  authNavSlots.forEach(renderDesktop);
  mobileMenus.forEach(renderMobile);

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

function openAuthModal(mode = 'login') {
  authState.mode = mode;

  let modal = document.getElementById('authModal');
  if (!modal) {
    injectAuthModal();
    modal = document.getElementById('authModal');
  }

  const modalBackdrop = document.getElementById('authModal');
  if (modalBackdrop) {
    modalBackdrop.classList.add('open');
    document.body.classList.add('modal-open');
  }

  if (modal) {
    const title = document.getElementById('authModalTitle');
    const loginView = document.getElementById('authLoginView');
    const registerView = document.getElementById('authRegisterView');
    const loginTab = document.getElementById('authTabLogin');
    const registerTab = document.getElementById('authTabRegister');

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
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
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

function submitLoginForm(event) {
  if (event) event.preventDefault();

  const emailOrPhone = document.getElementById('loginEmailOrPhone')?.value || '';
  const password = document.getElementById('loginPassword')?.value || '';

  return loginUser({
    emailOrPhone,
    password
  });
}

function handleLogout() {
  localStorage.removeItem(AUTH_CONFIG.storageKey);
  updateNavAuthUI();
  alert('You have successfully logged out.');
}

function injectAuthModal() {
  if (document.getElementById('authModal')) return;

  const backdrop = document.createElement('div');
  backdrop.id = 'authModal';
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div style="max-width:520px; width:100%; background:#fff; border-radius:18px; box-shadow:0 25px 50px rgba(0,0,0,0.2); overflow:hidden; position:relative; margin:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px 12px 24px; border-bottom:1px solid #e2e8f0;">
        <h3 id="authModalTitle" style="font-size:28px; color:#003366; font-weight:800; font-family:'Cinzel', serif; margin:0;">Customer Login</h3>
        <button type="button" onclick="closeAuthModal()" style="background:none; border:none; font-size:30px; color:#64748b; cursor:pointer;">&times;</button>
      </div>

      <div style="padding:18px 24px 24px 24px;">
        <div style="display:flex; gap:8px; margin-bottom:18px;">
          <button id="authTabLogin" type="button" onclick="openAuthModal('login')" style="flex:1; height:44px; border:none; border-radius:10px; font-weight:700; cursor:pointer; background:#003366; color:#fff;">Login</button>
          <button id="authTabRegister" type="button" onclick="openAuthModal('register')" style="flex:1; height:44px; border:none; border-radius:10px; font-weight:700; cursor:pointer; background:#e2e8f0; color:#003366;">Register</button>
        </div>

        <div id="authLoginView" style="display:block;">
          <form onsubmit="submitLoginForm(event)">
            <div style="margin-bottom:16px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#2b3a4a; text-transform:uppercase; margin-bottom:6px;">Email or Mobile *</label>
              <input id="loginEmailOrPhone" type="text" required placeholder="name@company.com or 9876543210" style="width:100%; height:46px; padding:0 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px;">
            </div>

            <div style="margin-bottom:18px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#2b3a4a; text-transform:uppercase; margin-bottom:6px;">Password *</label>
              <input id="loginPassword" type="password" required placeholder="Enter your password" style="width:100%; height:46px; padding:0 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px;">
            </div>

            <button type="submit" style="width:100%; height:46px; border:none; border-radius:8px; background:#003366; color:#fff; font-weight:800; cursor:pointer;">
              Login
            </button>
          </form>
        </div>

        <div id="authRegisterView" style="display:none;">
          <form onsubmit="submitRegisterForm(event)">
            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#2b3a4a; text-transform:uppercase; margin-bottom:6px;">Full Name *</label>
              <input id="regName" type="text" required placeholder="e.g. John Doe" style="width:100%; height:46px; padding:0 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px;">
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#2b3a4a; text-transform:uppercase; margin-bottom:6px;">Email Address *</label>
              <input id="regEmail" type="email" required placeholder="name@company.com" style="width:100%; height:46px; padding:0 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px;">
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#2b3a4a; text-transform:uppercase; margin-bottom:6px;">Mobile / WhatsApp *</label>
              <input id="regPhone" type="tel" required placeholder="+91 9876543210" style="width:100%; height:46px; padding:0 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px;">
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#2b3a4a; text-transform:uppercase; margin-bottom:6px;">Password *</label>
              <input id="regPassword" type="password" required placeholder="Create a password" style="width:100%; height:46px; padding:0 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px;">
            </div>

            <div style="margin-bottom:18px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#2b3a4a; text-transform:uppercase; margin-bottom:6px;">Confirm Password *</label>
              <input id="regConfirmPassword" type="password" required placeholder="Re-enter password" style="width:100%; height:46px; padding:0 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:14px;">
            </div>

            <button type="submit" style="width:100%; height:46px; border:none; border-radius:8px; background:#003366; color:#fff; font-weight:800; cursor:pointer;">
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
}

document.addEventListener('DOMContentLoaded', () => {
  injectAuthModal();
  bindAuthButtons();
  updateNavAuthUI();
});
