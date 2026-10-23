// File: cart.js
// Global Slide-Over E-Commerce Cart & Split Billing Engine

const CART_KEY = 'malvigano_ecom_cart';
const RAZORPAY_KEY_ID = 'rzp_test_placeholder'; // Replace with your live Razorpay Key ID

function getCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncCartUI();
}

function addItemToCart(title, rate, unit, quantity) {
  const qty = parseFloat(quantity);
  if (!qty || qty <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.title === title && item.unit === unit);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += qty;
    cart[existingIndex].total = cart[existingIndex].quantity * cart[existingIndex].rate;
  } else {
    cart.push({
      title,
      rate: parseFloat(rate),
      unit,
      quantity: qty,
      total: qty * parseFloat(rate)
    });
  }

  saveCart(cart);
  openCartDrawer();
}

function removeItemFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  syncCartUI();
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    overlay.classList.add('open');
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }
}

function syncCartUI() {
  const cart = getCart();
  const countBadges = document.querySelectorAll('.cart-count');
  const totalBadges = document.querySelectorAll('.cart-total-value');
  const drawerContainer = document.getElementById('drawerCartItems');
  const staticContainer = document.getElementById('cartItems');

  let totalSum = 0;
  cart.forEach(item => totalSum += item.total);
  const adv = Math.round(totalSum * 0.70);
  const bal = Math.round(totalSum * 0.30);

  countBadges.forEach(b => b.innerText = cart.length);
  totalBadges.forEach(b => b.innerText = `₹${adv.toLocaleString('en-IN')}`);

  ['grossTotal', 'drawerGrossTotal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = `₹${totalSum.toLocaleString('en-IN')}`;
  });
  ['advTotal', 'drawerAdvTotal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = `₹${adv.toLocaleString('en-IN')}`;
  });
  ['balTotal', 'drawerBalTotal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = `₹${bal.toLocaleString('en-IN')}`;
  });

  const renderItems = (target) => {
    if (!target) return;
    if (cart.length === 0) {
      target.innerHTML = `<p style="font-size:13px; color:#94a3b8; padding:24px 0; text-align:center;">Your order cart is empty.</p>`;
      return;
    }
    target.innerHTML = '';
    cart.forEach((item, idx) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-start; padding:12px 0; border-bottom:1px dashed #e2e8f0; font-size:13px;';
      row.innerHTML = `
        <div style="flex-grow:1; padding-right:10px;">
          <strong style="color:var(--brand-navy, #003366); font-size:13.5px;">${escapeHtml(item.title)}</strong><br>
          <span style="color:#64748b;">${item.quantity} ${item.unit} @ ₹${item.rate.toLocaleString('en-IN')}/${item.unit}</span>
        </div>
        <div style="text-align:right;">
          <strong style="color:#0f172a;">₹${Math.round(item.total).toLocaleString('en-IN')}</strong><br>
          <button onclick="removeItemFromCart(${idx})" style="background:none; border:none; color:#dc2626; font-size:11px; cursor:pointer; font-weight:700; padding:2px 0;">Remove</button>
        </div>
      `;
      target.appendChild(row);
    });
  };

  renderItems(drawerContainer);
  renderItems(staticContainer);
}

function initiateOnlinePayment() {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) {
    alert('Please log in or verify credentials prior to advance booking.');
    if (typeof openAuthModal === 'function') openAuthModal('login');
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  let totalSum = 0;
  cart.forEach(item => totalSum += item.total);
  const advanceAmount = Math.round(totalSum * 0.70);

  if (typeof Razorpay === 'undefined') {
    alert('Payment Gateway loading. Check connection or reload page.');
    return;
  }

  const options = {
    key: RAZORPAY_KEY_ID,
    amount: advanceAmount * 100,
    currency: "INR",
    name: "MalviganoMac Pvt Ltd",
    description: "70% Advance Stone Order Booking",
    image: "Logo.png",
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phone
    },
    theme: { color: "#003366" },
    handler: function (response) {
      let conf = `*PAID BOOKING ORDER - MalviganoMac*\n` +
        `Razorpay ID: ${response.razorpay_payment_id}\n` +
        `Advance Paid: ₹${advanceAmount.toLocaleString('en-IN')}\n` +
        `Customer: ${user.name} (${user.email}, ${user.phone})\n\n` +
        `*Items Ordered:*\n`;

      cart.forEach(i => {
        conf += `• ${i.title} — ${i.quantity} ${i.unit} @ ₹${i.rate} = ₹${Math.round(i.total).toLocaleString('en-IN')}\n`;
      });

      conf += `\nPlease initiate factory slab lot inspection and dispatch preparation.`;

      clearCart();
      closeCartDrawer();
      alert(`Payment Confirmed! Ref ID: ${response.razorpay_payment_id}`);
      window.open(`https://wa.me/918123502007?text=${encodeURIComponent(conf)}`, '_blank');
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

function triggerCheckout(method) {
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!user) {
    alert('Please verify your mobile/email before submitting your order.');
    if (typeof openAuthModal === 'function') openAuthModal('login');
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  let totalSum = 0;
  let orderDetails = `*MalviganoMac Verified Stone Order*\nVerified Customer: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}\n\n`;
  cart.forEach(item => {
    totalSum += item.total;
    orderDetails += `• ${item.title}: ${item.quantity} ${item.unit} @ ₹${item.rate} = ₹${Math.round(item.total).toLocaleString('en-IN')}\n`;
  });

  const adv = Math.round(totalSum * 0.70);
  const bal = Math.round(totalSum * 0.30);
  orderDetails += `\nGross Total: ₹${totalSum.toLocaleString('en-IN')}\n` +
    `70% Advance Payable: ₹${adv.toLocaleString('en-IN')}\n` +
    `30% Balance On Delivery: ₹${bal.toLocaleString('en-IN')}\n\n` +
    `Please prepare formal proforma invoice with freight calculations.`;

  if (method === 'whatsapp') {
    window.open(`https://wa.me/918123502007?text=${encodeURIComponent(orderDetails)}`, '_blank');
  } else {
    window.location.href = `mailto:admin@malviganomac.live?subject=Stone Order - ${encodeURIComponent(user.name)}&body=${encodeURIComponent(orderDetails)}`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function injectCartDrawer() {
  if (document.getElementById('cartDrawer')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cartDrawerOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 2500;
    opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
  `;
  overlay.onclick = closeCartDrawer;

  const drawer = document.createElement('div');
  drawer.id = 'cartDrawer';
  drawer.style.cssText = `
    position: fixed; top: 0; right: -430px; width: 100%; max-width: 410px; height: 100vh;
    background: #ffffff; z-index: 2600; box-shadow: -6px 0 28px rgba(0,0,0,0.16);
    display: flex; flex-direction: column; transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;
  drawer.innerHTML = `
    <div style="padding:16px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
      <div>
        <h3 style="font-size:17px; font-weight:800; color:var(--brand-navy, #003366); margin:0; font-family:'Cinzel', serif;">E-Commerce Cart</h3>
        <span style="font-size:11px; color:#64748b; font-weight:600;">70% Advance Booking Policy</span>
      </div>
      <button onclick="closeCartDrawer()" style="background:none; border:none; font-size:26px; color:#64748b; cursor:pointer;">&times;</button>
    </div>

    <div id="drawerCartItems" style="flex-grow:1; overflow-y:auto; padding:16px 20px;"></div>

    <div style="padding:16px 20px; border-top:1px solid #e2e8f0; background:#f8fafc;">
      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:12px; font-size:13px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span>Gross Value:</span><strong id="drawerGrossTotal">₹0</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#047857; font-weight:700;">
          <span>70% Advance Due:</span><strong id="drawerAdvTotal">₹0</strong>
        </div>
        <div style="display:flex; justify-content:space-between; color:#64748b; font-size:12px;">
          <span>30% Balance On Delivery:</span><span id="drawerBalTotal">₹0</span>
        </div>
      </div>

      <button onclick="initiateOnlinePayment()" style="width:100%; background:var(--brand-navy, #003366); color:#ffffff; padding:12px; border:none; border-radius:8px; font-weight:700; font-size:13.5px; cursor:pointer; margin-bottom:8px;">
        💳 Pay 70% Advance (UPI / Cards)
      </button>
      <button onclick="triggerCheckout('whatsapp')" style="width:100%; background:#25d366; color:#ffffff; padding:11px; border:none; border-radius:8px; font-weight:700; font-size:13.5px; cursor:pointer; margin-bottom:8px;">
        Order via WhatsApp
      </button>
      <button onclick="triggerCheckout('email')" style="width:100%; background:#f1f5f9; color:#1e293b; border:1px solid #cbd5e1; padding:9px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;">
        Request Proforma Invoice (Email)
      </button>
    </div>
  `;

  const sheet = document.createElement('style');
  sheet.textContent = `
    #cartDrawer.open { right: 0 !important; }
    #cartDrawerOverlay.open { opacity: 1 !important; pointer-events: auto !important; }
  `;

  document.head.appendChild(sheet);
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
}

document.addEventListener('DOMContentLoaded', () => {
  injectCartDrawer();
  syncCartUI();
});
