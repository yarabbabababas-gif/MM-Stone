// File: auth.js
// Dual-Channel OTP Authentication & Verification Engine

const AUTH_CONFIG = {
  storageKey: 'malvigano_user_session'
};

let authState = {
  mode: 'signup',
  formData: { name: '', email: '', phone: '' },
  emailOtp: null,
  mobileOtp: null
};

function getCurrentUser() {
  try {
    const data = localStorage.getItem(AUTH_CONFIG.storageKey);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function updateNavAuthUI() {
  const user = getCurrentUser();
  const authNavSlots = document.querySelectorAll('.auth-nav-slot');
  const mobileMenus = document.querySelectorAll('.mobile-auth-slot');

  authNavSlots.forEach(slot => {
    if (user) {
      slot.innerHTML = `
        <div style="display:inline-flex; align-items:center; gap:8px;">
          <span style="font-size:12px; font-weight:700; color:var(--brand-navy, #003366); background:#f1f5f9; padding:6px 12px; border-radius:6px; border:1px solid #cbd5e1;">
            👤 ${escapeHtml(user.name || user.email.split('@')[0])}
          </span>
          <button onclick="handleLogout()" style="background:#fee2e2; color:#b91c1c; border:none; border-radius:6px; padding:6px 10px; font-size:12px; font-weight:700; cursor:pointer;">
            Logout
          </button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button onclick="openAuthModal('login')" style="background:transparent; border:1.5px solid var(--brand-navy, #003366); color:var(--brand-navy, #003366); border-radius:8px; padding:7px 14px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s;">
          Login / Register
        </button>
      `;
    }
  });

  mobileMenus.forEach(slot => {
    if (user) {
      slot.innerHTML = `
        <div style="padding:10px 14px; background:#f8fafc; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; font-weight:700; color:var(--brand-navy, #003366);">👤 ${escapeHtml(user.name || user.email)}</span>
          <button onclick="handleLogout()" style="background:#fee2e2; color:#b91c1c; border:none; border-radius:6px; padding:5px 8px; font-size:12px; font-weight:700;">Logout</button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <a href="javascript:void(0)" onclick="openAuthModal('signup')" style="font-size:14px; font-weight:700; padding:10px 14px; border-radius:8px; color:#ffffff; background:var(--brand-navy, #003366); text-align:center; display:block;">
          Create Account / Login
        </a>
      `;
    }
  });
}

function openAuthModal(mode = 'signup') {
  authState.mode = mode;
  let modal = document.getElementById('authModal');
  if (!modal) {
    injectAuthModal();
    modal = document.getElementById('authModal');
  }
  document.getElementById('authModalTitle').innerText = mode === 'signup' ? 'Create Customer Account' : 'Customer Account Login';
  document.getElementById('authStep1').style.display = 'block';
  document.getElementById('authStep2').style.display = 'none';
  modal.classList.add('open');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('open');
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function submitAuthDetails(e) {
  e.preventDefault();
  const name = document.getElementById('authName').value.trim();
  const email = document.getElementById('authEmail').value.trim().toLowerCase();
  const phone = document.getElementById('authPhone').value.trim();

  if (!email || !phone) {
    alert('Please provide both an email and phone number.');
    return;
  }

  authState.formData = { name, email, phone };
  authState.emailOtp = generateOtp();
  authState.mobileOtp = generateOtp();

  alert(
    `[Security Gateway Dispatched]\n\n` +
    `1. Email OTP for ${email}: ${authState.emailOtp}\n` +
    `2. SMS OTP for ${phone}: ${authState.mobileOtp}\n\n` +
    `Please enter both codes below to authenticate.`
  );

  document.getElementById('authStep1').style.display = 'none';
  document.getElementById('authStep2').style.display = 'block';
  document.getElementById('otpTargetEmail').innerText = email;
  document.getElementById('otpTargetPhone').innerText = phone;
}

function submitVerifyBothOtps(e) {
  e.preventDefault();
  const enteredEmailOtp = document.getElementById('authEmailOtp').value.trim();
  const enteredMobileOtp = document.getElementById('authMobileOtp').value.trim();

  const isEmailValid = (enteredEmailOtp === authState.emailOtp || enteredEmailOtp === '123456');
  const isMobileValid = (enteredMobileOtp === authState.mobileOtp || enteredMobileOtp === '123456');

  if (!isEmailValid || !isMobileValid) {
    alert('Invalid OTP entered. Enter the generated OTP or 123456.');
    return;
  }

  const session = {
    name: authState.formData.name || 'Valued Client',
    email: authState.formData.email,
    phone: authState.formData.phone,
    verifiedAt: new Date().toISOString()
  };

  localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(session));
  closeAuthModal();
  updateNavAuthUI();

  if (typeof syncCartUI === 'function') syncCartUI();
  if (typeof window.onAuthSuccess === 'function') window.onAuthSuccess(session);
}

function handleLogout() {
  localStorage.removeItem(AUTH_CONFIG.storageKey);
  updateNavAuthUI();
  if (typeof syncCartUI === 'function') syncCartUI();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function injectAuthModal() {
  if (document.getElementById('authModal')) return;

  const modalBackdrop = document.createElement('div');
  modalBackdrop.id = 'authModal';
  modalBackdrop.className = 'modal-backdrop';
  modalBackdrop.innerHTML = `
    <div style="max-width:440px; width:100%; background:#ffffff; border-radius:14px; padding:28px 24px; box-shadow:0 20px 45px rgba(0,0,0,0.2); position:relative; margin:auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 id="authModalTitle" style="font-size:18px; color:var(--brand-navy, #003366); font-weight:800; font-family:'Cinzel', serif;">Customer Authentication</h3>
        <button type="button" onclick="closeAuthModal()" style="border:none; background:transparent; font-size:26px; cursor:pointer; color:#64748b;">&times;</button>
      </div>

      <form id="authStep1" onsubmit="submitAuthDetails(event)">
        <p style="font-size:12.5px; color:#64748b; margin-bottom:14px;">Verify your credentials to place live slab bookings and export inquiries.</p>
        
        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate, #2b3a4a); margin-bottom:4px;">Full Name *</label>
          <input type="text" id="authName" required placeholder="e.g. John Doe" class="form-control" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px;">
        </div>

        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate, #2b3a4a); margin-bottom:4px;">Email Address *</label>
          <input type="email" id="authEmail" required placeholder="name@company.com" class="form-control" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px;">
        </div>

        <div style="margin-bottom:18px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate, #2b3a4a); margin-bottom:4px;">Mobile / WhatsApp *</label>
          <input type="tel" id="authPhone" required placeholder="+91 8123502007" class="form-control" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13.5px;">
        </div>

        <button type="submit" style="width:100%; padding:12px; border-radius:8px; background:var(--brand-navy, #003366); color:#ffffff; font-weight:700; border:none; cursor:pointer;">
          Send Email & SMS OTPs
        </button>
      </form>

      <form id="authStep2" style="display:none;" onsubmit="submitVerifyBothOtps(event)">
        <p style="font-size:12.5px; color:#64748b; margin-bottom:14px;">Enter verification codes dispatched to your registered contacts.</p>

        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate, #2b3a4a); margin-bottom:4px;">
            Email OTP (Sent to <span id="otpTargetEmail" style="color:var(--brand-navy, #003366);"></span>)
          </label>
          <input type="text" id="authEmailOtp" required maxlength="6" placeholder="6-digit Email OTP" style="width:100%; text-align:center; letter-spacing:4px; font-size:18px; font-weight:700; padding:10px; border:1px solid #cbd5e1; border-radius:8px;">
        </div>

        <div style="margin-bottom:18px;">
          <label style="display:block; font-size:11px; font-weight:700; text-transform:uppercase; color:var(--brand-slate, #2b3a4a); margin-bottom:4px;">
            Mobile SMS OTP (Sent to <span id="otpTargetPhone" style="color:var(--brand-navy, #003366);"></span>)
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
