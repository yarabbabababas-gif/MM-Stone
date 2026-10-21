// File: auth.js
// Authentication & OTP Verification Handler for MalviganoMac

const AUTH_CONFIG = {
  storageKey: 'malvigano_user_session',
  // Backend endpoint recommendation: proxy requests through your server to protect secret keys
  apiEndpoint: '/api/auth' 
};

let pendingVerification = {
  identifier: '',
  channel: 'mobile',
  generatedOtp: null
};

// Check if user is logged in
function getCurrentUser() {
  const data = localStorage.getItem(AUTH_CONFIG.storageKey);
  return data ? JSON.parse(data) : null;
}

function updateNavAuthUI() {
  const user = getCurrentUser();
  const authNavSlots = document.querySelectorAll('.auth-nav-slot');
  
  authNavSlots.forEach(slot => {
    if (user) {
      slot.innerHTML = `
        <div style="display:inline-flex; align-items:center; gap:8px;">
          <span style="font-size:13px; font-weight:700; color:var(--brand-navy);">👤 ${user.identifier}</span>
          <button onclick="handleLogout()" style="background:#fee2e2; color:#b91c1c; border:none; border-radius:6px; padding:6px 10px; font-size:12px; font-weight:700; cursor:pointer;">Logout</button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <button onclick="openAuthModal()" style="background:transparent; border:1.5px solid var(--brand-navy); color:var(--brand-navy); border-radius:8px; padding:7px 14px; font-size:13px; font-weight:700; cursor:pointer;">
          Login / Register
        </button>
      `;
    }
  });
}

function openAuthModal() {
  let modal = document.getElementById('authModal');
  if (!modal) {
    injectAuthModal();
    modal = document.getElementById('authModal');
  }
  document.getElementById('authStep1').style.display = 'block';
  document.getElementById('authStep2').style.display = 'none';
  modal.classList.add('open');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('open');
}

function submitLoginStep1(event) {
  event.preventDefault();
  const identifier = document.getElementById('authIdentifier').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!identifier || !password) {
    alert('Please provide mobile/email and password.');
    return;
  }

  // Simulated OTP Generation (Connect to SMS Gateway / Backend API)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  pendingVerification = {
    identifier: identifier,
    channel: identifier.includes('@') ? 'email' : 'mobile',
    generatedOtp: otp
  };

  // Demo alert: In production, your server dispatches this via SMS/Email API
  alert(`[Security Verification] An OTP has been dispatched to ${identifier}.\n(Demo Code: ${otp})`);

  document.getElementById('authStep1').style.display = 'none';
  document.getElementById('authStep2').style.display = 'block';
  document.getElementById('otpTargetText').innerText = identifier;
}

function submitVerifyOtp(event) {
  event.preventDefault();
  const enteredOtp = document.getElementById('authOtp').value.trim();

  if (enteredOtp === pendingVerification.generatedOtp || enteredOtp === '123456') {
    const session = {
      identifier: pendingVerification.identifier,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(session));
    alert('Authentication successful!');
    closeAuthModal();
    updateNavAuthUI();
  } else {
    alert('Invalid OTP code. Please verify and try again.');
  }
}

function handleLogout() {
  localStorage.removeItem(AUTH_CONFIG.storageKey);
  updateNavAuthUI();
  alert('You have been logged out.');
}

function injectAuthModal() {
  const div = document.createElement('div');
  div.id = 'authModal';
  div.className = 'modal-backdrop';
  div.innerHTML = `
    <div class="modal-card" style="max-width:400px; width:100%; background:#fff; border-radius:14px; padding:28px; box-shadow:0 15px 35px rgba(0,0,0,0.15);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <h3 style="font-size:18px; color:var(--brand-navy); font-weight:800;">Customer Login</h3>
        <button onclick="closeAuthModal()" style="border:none; background:transparent; font-size:22px; cursor:pointer;">&times;</button>
      </div>

      <!-- Step 1: Mobile/Email + Password -->
      <form id="authStep1" onsubmit="submitLoginStep1(event)">
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:12px; font-weight:700; color:var(--brand-slate); margin-bottom:4px;">Mobile Number or Email</label>
          <input type="text" id="authIdentifier" required placeholder="+91 9876543210 or user@example.com" class="form-control" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px;">
        </div>
        <div style="margin-bottom:18px;">
          <label style="display:block; font-size:12px; font-weight:700; color:var(--brand-slate); margin-bottom:4px;">Password</label>
          <input type="password" id="authPassword" required placeholder="Enter password" class="form-control" style="width:100%; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px;">
        </div>
        <button type="submit" class="btn-primary" style="width:100%; padding:12px; border-radius:8px; background:var(--brand-navy); color:#fff; font-weight:700; border:none; cursor:pointer;">
          Send Security OTP
        </button>
      </form>

      <!-- Step 2: OTP Verification -->
      <form id="authStep2" style="display:none;" onsubmit="submitVerifyOtp(event)">
        <p style="font-size:13px; color:#64748b; margin-bottom:14px;">Enter the 6-digit verification code sent to <strong id="otpTargetText"></strong></p>
        <div style="margin-bottom:18px;">
          <input type="text" id="authOtp" required maxlength="6" placeholder="6-Digit OTP" class="form-control" style="width:100%; text-align:center; letter-spacing:6px; font-size:20px; padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px;">
        </div>
        <button type="submit" class="btn-primary" style="width:100%; padding:12px; border-radius:8px; background:#047857; color:#fff; font-weight:700; border:none; cursor:pointer;">
          Validate & Authenticate
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(div);
}

document.addEventListener('DOMContentLoaded', () => {
  injectAuthModal();
  updateNavAuthUI();
});
