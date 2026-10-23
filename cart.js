// File: cart.js
// Persistent Stone E-Commerce Cart & Payment Gateway Manager
const CART_KEY = 'malvigano_ecom_cart';
const RAZORPAY_KEY_ID = 'rzp_test_placeholder';

function safeParseJSON(data, fallback) {
  try {
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
}

function getCart() {
  const data = localStorage.getItem(CART_KEY);
  return safeParseJSON(data, []);
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  syncCartUI();
}

function addItemToCart(title, rate, unit, quantity) {
  const user = getCurrentUser();
  if (!user) {
    alert('Please authenticate your email and mobile before adding stone lots to your order.');
    openAuthModal('login');
    return;
  }

  const qty = Number(quantity);
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
      rate,
      unit,
      quantity: qty,
      total: qty * rate
    });
  }

  saveCart(cart);
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

function getCartTotals(cart) {
  const totalSum = cart.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const totalUnits = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const advanceAmount = Math.round(totalSum * 0.70);
  const balanceAmount = Math.round(totalSum * 0.30);

  return { totalSum, totalUnits, advanceAmount, balanceAmount };
}

function syncCartUI() {
  const cart = getCart();
  const countBadges = document.querySelectorAll('.cart-count');
  const totalBadges = document.querySelectorAll('.cart-total-value');
  const cartContainer = document.getElementById('cartItems');

  const totals = getCartTotals(cart);
  const { totalSum, totalUnits, advanceAmount, balanceAmount } = totals;

  countBadges.forEach(b => b.innerText = totalUnits);
  totalBadges.forEach(b => b.innerText = `₹${advanceAmount.toLocaleString('en-IN')}`);

  if (document.getElementById('grossTotal')) {
    document.getElementById('grossTotal').innerText = `₹${totalSum.toLocaleString('en-IN')}`;
  }
  if (document.getElementById('advTotal')) {
    document.getElementById('advTotal').innerText = `₹${advanceAmount.toLocaleString('en-IN')}`;
  }
  if (document.getElementById('balTotal')) {
    document.getElementById('balTotal').innerText = `₹${balanceAmount.toLocaleString('en-IN')}`;
  }

  if (cartContainer) {
    if (cart.length === 0) {
      cartContainer.innerHTML = '<p style="font-size:13px; color:#94a3b8; padding: 12px 0;">No slabs added. Select quantities above.</p>';
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
          <strong>₹${Math.round(item.total).toLocaleString('en-IN')}</strong><br>
          <button onclick="removeItemFromCart(${idx})" style="background:none; border:none; color:#dc2626; font-size:11px; cursor:pointer; font-weight:700;">Remove</button>
        </div>
      `;
      cartContainer.appendChild(div);
    });
  }
}

function initiateOnlinePayment() {
  const user = getCurrentUser();
  if (!user) {
    alert('Please verify your email & mobile OTP prior to checkout.');
    openAuthModal('login');
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  const totalSum = cart.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const advanceAmount = Math.round(totalSum * 0.70);

  if (typeof Razorpay === 'undefined') {
    alert('Payment Gateway is loading. Check your internet connection.');
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
      name: user.name || 'Valued Client',
      email: user.email,
      contact: user.phone
    },
    theme: { color: "#003366" },
    handler: function (response) {
      alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}\nOrder verified.`);

      let confMessage = `*PAID BOOKING ORDER - MalviganoMac*\nPayment ID: ${response.razorpay_payment_id}\nAdvance Paid: ₹${advanceAmount.toLocaleString('en-IN')}\nCustomer: ${user.name || 'Valued Client'} (${user.email}, ${user.phone})\n\n`;
      cart.forEach(i => confMessage += `• ${i.title} (${i.quantity} ${i.unit})\n`);
      confMessage += `\nPlease initiate slab inspection and factory loading.`;

      clearCart();
      window.open(`https://wa.me/918123502007?text=${encodeURIComponent(confMessage)}`, '_blank');
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

function triggerCheckout(method) {
  const user = getCurrentUser();
  if (!user) {
    alert('Please authenticate your phone and email before booking.');
    openAuthModal('login');
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  let totalSum = 0;
  let orderDetails = `*MalviganoMac Verified Stone Order*\nVerified Customer: ${user.name || 'Valued Client'}\nEmail: ${user.email}\nPhone: ${user.phone}\n\n`;
  cart.forEach(item => {
    totalSum += item.total;
    orderDetails += `• ${item.title}: ${item.quantity} ${item.unit} @ ₹${item.rate} = ₹${Math.round(item.total).toLocaleString('en-IN')}\n`;
  });

  const adv = Math.round(totalSum * 0.70);
  const bal = Math.round(totalSum * 0.30);
  orderDetails += `\nGross Total: ₹${totalSum.toLocaleString('en-IN')}`;
  orderDetails += `\n70% Advance Payable: ₹${adv.toLocaleString('en-IN')}`;
  orderDetails += `\n30% Balance On Delivery: ₹${bal.toLocaleString('en-IN')}\n`;

  if (method === 'whatsapp') {
    window.open(`https://wa.me/918123502007?text=${encodeURIComponent(orderDetails)}`, '_blank');
  } else {
    window.location.href = `mailto:admin@malviganomac.live?subject=Verified Stone Order - ${encodeURIComponent(user.name || 'Valued Client')}&body=${encodeURIComponent(orderDetails)}`;
  }
}

document.addEventListener('DOMContentLoaded', syncCartUI);
