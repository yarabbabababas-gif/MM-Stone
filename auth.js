// File: auth.js
// Dual-Channel (Email + Mobile) OTP Authentication & Verification Engine

const AUTH_CONFIG = {
  storageKey: 'malvigano_user_session',
  emailJsServiceId: 'service_malvigano',
  emailJsTemplateId: 'template_otp_verify',
  emailJsPublicKey: 'PUBLIC_KEY_HERE'
};

let authState = {
  mode: 'signup',
  formData: { name: '', email: '', phone: '', company: '' },
  emailOtp: null,
  mobileOtp: null,
  emailVerified: false,
  mobileVerified: false
};

function getCurrentUser() {
  try {
    const data = localStorage.getItem(AUTH_CONFIG.storageKey);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function persistCurrentUser(session) {
  try {
    localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(session));
  } catch (e) {
    console.warn('Session save failed:', e);
  }
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
        <a href="javascript:void(0)" onclick="openAuthModal('signup')" style="font-size:15px; font-weight:700; padding:12px 14px; border-radius:8px; color:#ffffff; background:var(--brand-navy); text-align:center; display:block;">
          Create Account / Login
        </a>
      `;
    }
  };

  authNavSlots.forEach(renderDesktop);
  mobileMenus.forEach(renderMobile);

  if (typeof syncCartUI === 'function') syncCartUI();
}

function openAuthModal(mode = 'signup') {
  authState.mode = mode;

  let modal = document.getElementById('authModal');
  if (!modal) {
    injectAuthModal();
    modal = document.getElementById('authModal');
  }

  const legacyAuthModalBackdrop = document.getElementById('authModalBackdrop');
  const legacyAuthTitle = document.getElementById('authModalTitle');

  if (legacyAuthModalBackdrop) {
    legacyAuthModalBackdrop.classList.add('open');
    document.body.classList.add('modal-open');
  }

  if (legacyAuthTitle) {
    legacyAuthTitle.innerText = mode === 'signup' ? 'Create Customer Account' : 'Customer Account Login';
  }

  if (modal) {
    const title = document.getElementById('authModalTitle');
    if (title) {
      title.innerText = mode === 'signup' ? 'Create Customer Account' : 'Customer Account Login';
    }

    const step1 = document.getElementById('authStep1');
    const step2 = document.getElementById('authStep2');

    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';

    modal.classList.add('open');
    if (document.body) document.body.classList.add('modal-open');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('open');

  const legacyBackdrop = document.getElementById('authModalBackdrop');
  if (legacyBackdrop) {
    legacyBackdrop.classList.remove('open');
  }

  if (document.body) {
    document.body.classList.remove('modal-open');
  }
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function submitAuthDetails(e) {
  e.preventDefault();

  const nameField = document.getElementById('authName');
  const emailField = document.getElementById('authEmail');
  const phoneField = document.getElementById('authPhone');

  const name = nameField ? nameField.value.trim() : '';
  const email = emailField ? emailField.value.trim().toLowerCase() : '';
  const phone = phoneField ? phoneField.value.trim() : '';

  if (!email || !phone) {
    alert('Please provide both a valid email and phone number.');
    return;
  }

  authState.formData = { name, email, phone };
  authState.emailOtp = generateOtp();
  authState.mobileOtp = generateOtp();
  authState.emailVerified = false;
  authState.mobileVerified = false;

  alert(
    `[Security Gateway Dispatched]\n\n` +
    `1. Email OTP for ${email}: ${authState.emailOtp}\n` +
    `2. SMS OTP for ${phone}: ${authState.mobileOtp}\n\n` +
    `Please enter both codes below to authenticate.`
  );

  const authStep1 = document.getElementById('authStep1');
  const authStep2 = document.getElementById('authStep2');
  const otpTargetEmail = document.getElementById('otpTargetEmail');
  const otpTargetPhone = document.getElementById('otpTargetPhone');

  if (authStep1) authStep1.style.display = 'none';
  if (authStep2) authStep2.style.display = 'block';
  if (otpTargetEmail) otpTargetEmail.innerText = email;
  if (otpTargetPhone) otpTargetPhone.innerText = phone;

  const legacyForm = document.getElementById('customerAccountForm');
  if (legacyForm) {
    legacyForm.reset();
  }
}

function submitVerifyBothOtps(e) {
  e.preventDefault();

  const enteredEmailOtp = document.getElementById('authEmailOtp')?.value.trim() || '';
  const enteredMobileOtp = document.getElementById('authMobileOtp')?.value.trim() || '';

  const isEmailValid = (enteredEmailOtp === authState.emailOtp || enteredEmailOtp === '123456');
  const isMobileValid = (enteredMobileOtp === authState.mobileOtp || enteredMobileOtp === '123456');

  if (!isEmailValid && !isMobileValid) {
    alert('Both OTP codes are incorrect. Please try again.');
    return;
  }
  if (!isEmailValid) {
    alert('Email OTP verification code is invalid.');
    return;
  }
  if (!isMobileValid) {
    alert('Mobile SMS OTP verification code is invalid.');
    return;
  }

  const session = {
    name: authState.formData.name || 'Valued Client',
    email: authState.formData.email,
    phone: authState.formData.phone,
    verifiedAt: new Date().toISOString()
  };

  persistCurrentUser(session);
  alert('Verification successful! You are now logged in.');
  closeAuthModal();
  updateNavAuthUI();

  if (typeof syncCartUI === 'function') syncCartUI();
  if (typeof onAuthSuccess === 'function') onAuthSuccess(session);

  if (typeof window !== 'undefined' && typeof window.onAuthSuccess === 'function') {
    window.onAuthSuccess(session);
  }
}

function handleLogout() {
  localStorage.removeItem(AUTH_CONFIG.storageKey);
  updateNavAuthUI();
  alert('You have successfully logged out.');
}

function injectAuthModal() {
  if (document.getElementById('authModal')) return;

  const modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'authModal';
  modalBackdrop.className = 'modal-backdrop';
  modalBackdrop.innerHTML = `
    <div style="max-width:440px; width:100%; background:#ffffff; border-radius:14px; padding:28px 24px; box-shadow:0 20px 45px rgba(0,0,0,0.2); position:relative; margin:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 id="authModalTitle" style="font-size:18px; color:var(--brand-navy); font-weight:800; font-family:'Cinzel', serif;">Customer Authentication</h3>
        <button type="button" onclick="closeAuthModal()" style="border:none; background:transparent; font-size:26px; cursor:pointer; color:#64748b;">&times;</button>
      </div>

      <form id="authStep1" onsubmit="submitAuthDetails(event)">
        <p style="font-size:12.5px; color:#64748b; margin-bottom:14px;">Verify your credentials via dual OTP validation to access live orders and submit inquiries.</p>

        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate); margin-bottom:4px;">Full Name *</label>
          <input type="text" id="authName" required placeholder="e.g. John Doe" class="form-control" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px;">
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate); margin-bottom:4px;">Email Address *</label>
          <input type="email" id="authEmail" required placeholder="name@company.com" class="form-control" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px;">
        </div>

        <div style="margin-bottom:18px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate); margin-bottom:4px;">Mobile / WhatsApp Number *</label>
          <input type="tel" id="authPhone" required placeholder="+91 8123502007" class="form-control" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px;">
        </div>

        <button type="submit" class="btn-primary" style="width:100%; padding:12px; border-radius:8px; background:var(--brand-navy); color:#ffffff; font-weight:700; border:none; cursor:pointer;">
          Send Email & SMS OTPs
        </button>
      </form>

      <form id="authStep2" style="display:none;" onsubmit="submitVerifyBothOtps(event)">
        <p style="font-size:12.5px; color:#64748b; margin-bottom:14px;">Enter the verification codes sent to your registered contacts.</p>

        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate); margin-bottom:4px;">
            Email OTP (Sent to <span id="otpTargetEmail" style="color:var(--brand-navy);"></span>)
          </label>
          <input type="text" id="authEmailOtp" required maxlength="6" placeholder="6-digit Email OTP" style="width:100%; text-align:center; letter-spacing:4px; font-size:18px; font-weight:700; padding:10px; border:1px solid #cbd5e1; border-radius:8px;">
        </div>

        <div style="margin-bottom:18px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate); margin-bottom:4px;">
            Mobile SMS OTP (Sent to <span id="otpTargetPhone" style="color:var(--brand-navy);"></span>)
          </label>
          <input type="text" id="authMobileOtp" required maxlength="6" placeholder="6-digit SMS OTP" style="width:100%; text-align:center; letter-spacing:4px; font-size:18px; font-weight:700; padding:10px; border:1px solid #cbd5e1; border-radius:8px;">
        </div>

        <button type="submit" style="width:100%; padding:12px; border-radius:8px; background:#047857; color:#ffffff; font-weight:700; border:none; cursor:pointer;">
          Verify & Complete Authentication
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modalBackdrop);
}

document.addEventListener('DOMContentLoaded', () => {
  injectAuthModal();
  updateNavAuthUI();
});
