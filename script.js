/* 7ngayreset.com — Landing page interactions
   - Countdown to early-bird deadline
   - Form submission via Formspree (or mailto fallback)
*/
(function () {
  'use strict';

  // ===== Countdown timer =====
  // Set deadline: 7 days from page first load (stored in localStorage so it doesn't reset on refresh)
  const STORAGE_KEY = 'iki-reset-deadline';
  let deadline = parseInt(localStorage.getItem(STORAGE_KEY), 10);
  if (!deadline || deadline < Date.now()) {
    deadline = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    localStorage.setItem(STORAGE_KEY, deadline.toString());
  }

  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');

  function tick() {
    const diff = deadline - Date.now();
    if (diff <= 0) {
      if (dEl) dEl.textContent = '00';
      if (hEl) hEl.textContent = '00';
      if (mEl) mEl.textContent = '00';
      if (sEl) sEl.textContent = '00';
      return;
    }
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const secs = Math.floor((diff % (60 * 1000)) / 1000);
    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }
  if (dEl || hEl || mEl || sEl) {
    tick();
    setInterval(tick, 1000);
  }

  // ===== Smooth scroll for anchor links =====
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#' || id === '#!') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // ===== Signup form =====
  const form = document.querySelector('.signup-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = form.querySelector('[name="name"]');
      const email = form.querySelector('[name="email"]');
      const phone = form.querySelector('[name="phone"]');
      const city = form.querySelector('[name="city"]');
      const ticket = form.querySelector('[name="ticket"]:checked');
      const consent = form.querySelector('[name="consent"]');
      const success = document.querySelector('.signup-success');

      if (!name.value || !email.value || !phone.value) {
        alert('Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại.');
        return;
      }
      if (consent && !consent.checked) {
        consent.focus();
        alert('Vui lòng tích đồng ý xử lý dữ liệu cá nhân theo Nghị định 13/2023 trước khi gửi.');
        return;
      }

      // Try Formspree if endpoint configured, else fallback to mailto
      const formspreeEndpoint = form.getAttribute('action');
      if (formspreeEndpoint && formspreeEndpoint.startsWith('https://formspree.io/')) {
        const fd = new FormData(form);
        fetch(formspreeEndpoint, {
          method: 'POST',
          body: fd,
          headers: { Accept: 'application/json' },
        })
          .then(function (res) {
            if (res.ok) {
              if (success) {
                success.classList.add('is-visible');
                form.style.display = 'none';
              }
            } else {
              alert('Gửi đăng ký không thành công. Vui lòng thử lại hoặc liên hệ contact@ikihealing.com.');
            }
          })
          .catch(function () {
            alert('Lỗi mạng. Vui lòng thử lại hoặc gửi email tới contact@ikihealing.com.');
          });
      } else {
        // mailto fallback
        const subject = encodeURIComponent('Đăng ký Khoá 3 Ngày Reset');
        const body = encodeURIComponent(
          'Họ tên: ' + name.value + '\n' +
          'Email: ' + email.value + '\n' +
          'SĐT: ' + phone.value + '\n' +
          'Tỉnh/TP: ' + (city ? city.value : '(không cung cấp)') + '\n' +
          'Loại vé: ' + (ticket ? ticket.value : '(chưa chọn)') + '\n\n' +
          'Đã đồng ý xử lý dữ liệu cá nhân theo NĐ 13/2023.'
        );
        window.location.href = 'mailto:contact@ikihealing.com?subject=' + subject + '&body=' + body;
        if (success) {
          success.classList.add('is-visible');
          form.style.display = 'none';
        }
      }
    });
  }
})();
