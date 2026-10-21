// File: cart.js
// Persistent Stone E-Commerce Cart Manager

const CART_KEY = 'malvigano_ecom_cart';

function getCart() {
  const data = localStorage.getItem(CART_KEY);
  return data ? JSON.parse(data) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncCartUI();
}

function addItemToCart(title, rate, unit, quantity) {
  const user = getCurrentUser();
  if (!user) {
    alert('Please log in with your mobile/email and verify OTP before adding items to your order.');
    openAuthModal();
    return;
  }

  const qty = parseFloat(quantity);
  if (!qty || qty <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  const cart = getCart();
  const total = qty * rate;
  cart.push({ title, rate, unit, quantity: qty, total });
  saveCart(cart);
}

function removeItemFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function syncCartUI() {
  const cart = getCart();
  const countBadges = document.querySelectorAll('.cart-count');
  const totalBadges = document.querySelectorAll('.cart-total-value');
  const cartContainer = document.getElementById('cartItems');

  let totalSum = 0;
  cart.forEach(i => totalSum += i.total);
  const adv = totalSum * 0.70;
  const bal = totalSum * 0.30;

  countBadges.forEach(b => b.innerText = cart.length);
  totalBadges.forEach(b => b.innerText = `₹${Math.round(adv).toLocaleString('en-IN')}`);

  if (document.getElementById('grossTotal')) document.getElementById('grossTotal').innerText = `₹${totalSum.toLocaleString('en-IN')}`;
  if (document.getElementById('advTotal')) document.getElementById('advTotal').innerText = `₹${adv.toLocaleString('en-IN')}`;
  if (document.getElementById('balTotal')) document.getElementById('balTotal').innerText = `₹${bal.toLocaleString('en-IN')}`;

  if (cartContainer) {
    if (cart.length === 0) {
      cartContainer.innerHTML = '<p style="font-size:13px; color:#94a3b8;">Your cart is empty. Add stone slabs above.</p>';
      return;
    }
    cartContainer.innerHTML = '';
    cart.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div>
          <strong>${item.title}</strong><br>
          <span style="color:#64748b;">${item.quantity} ${item.unit} @ ₹${item.rate}/${item.unit}</span>
        </div>
        <div style="text-align:right;">
          <strong>₹${item.total.toLocaleString('en-IN')}</strong><br>
          <button onclick="removeItemFromCart(${idx})" style="background:none; border:none; color:#dc2626; font-size:11px; cursor:pointer;">Remove</button>
        </div>
      `;
      cartContainer.appendChild(div);
    });
  }
}

function triggerCheckout(method) {
  const user = getCurrentUser();
  if (!user) {
    alert('Please log in with mobile/email and verify OTP prior to booking.');
    openAuthModal();
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('Cart is empty.');
    return;
  }

  let totalSum = 0;
  let orderDetails = `*MalviganoMac Verified Stone Order*\nCustomer: ${user.identifier}\n\n`;
  cart.forEach(item => {
    totalSum += item.total;
    orderDetails += `• ${item.title}: ${item.quantity} ${item.unit} @ ₹${item.rate} = ₹${item.total.toLocaleString('en-IN')}\n`;
  });

  const adv = totalSum * 0.70;
  const bal = totalSum * 0.30;
  orderDetails += `\nGross Total: ₹${totalSum.toLocaleString('en-IN')}`;
  orderDetails += `\n70% Advance Payable: ₹${adv.toLocaleString('en-IN')}`;
  orderDetails += `\n30% Balance On Delivery: ₹${bal.toLocaleString('en-IN')}\n`;

  if (method === 'whatsapp') {
    window.open(`https://wa.me/918123502007?text=${encodeURIComponent(orderDetails)}`, '_blank');
  } else {
    window.location.href = `mailto:admin@malviganomac.live?subject=Confirmed Stone Order - ${user.identifier}&body=${encodeURIComponent(orderDetails)}`;
  }
}

document.addEventListener('DOMContentLoaded', syncCartUI);
