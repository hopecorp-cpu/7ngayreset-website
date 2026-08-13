/**
 * CHẶN SỐ ĐIỆN THOẠI ẢO TRÊN SALE PAGE — dán một lần, tự tìm ô điện thoại trong mọi form.
 *
 * VÌ SAO CÓ FILE NÀY (12/08/2026): bên kỹ thuật Google Ads rà soát sale page
 * thanhhuongtra.ikihealing.com và báo form chưa ràng buộc định dạng số điện thoại, nên khi chạy
 * quảng cáo sẽ thu về lead ảo (họ đã test đặt một đơn tên "abc" để chứng minh form vẫn nhận).
 * Lead ảo đắt gấp đôi: vừa tính tiền click, vừa làm sale gọi vào số không có thật.
 *
 * DÙNG Ở ĐÂU: dán cho cả 3 sale page (Thanh Hương, Tuệ Minh, True Vegan) — chúng chung một khung
 * code nên cùng đoạn này chạy được hết. Dán INLINE vào trang, ĐỪNG trỏ <script src> sang domain
 * khác: sale page phải sống độc lập, mượn một file từ ops-hub là thêm một chỗ có thể chết.
 *
 * CÁCH DÁN: bỏ nguyên nội dung file này vào một thẻ <script> đặt NGAY TRƯỚC </body>.
 * Trang phải có <meta charset="utf-8"> (cả 3 sale page đều có) thì lời báo lỗi mới đúng dấu.
 *
 * QUAN TRỌNG — JS MỘT MÌNH LÀ CHƯA ĐỦ. Phải đặt luôn thuộc tính trên thẻ input trong HTML
 * (pattern/required/inputmode), vì hai lẽ: (1) máy rà soát của Google đọc HTML tĩnh chứ không
 * chạy hết JS; (2) JS tắt là form hớ hênh trở lại. Xem docs/SETUP-FORM-SDT-SALEPAGE.md.
 */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------- *
   * CẤU HÌNH
   * ---------------------------------------------------------------------- */

  // Nhận số máy bàn 11 số (024xxxxxxxx, 028xxxxxxxx)? Mặc định TẮT vì khách mua lẻ trên sale page
  // gần như đều dùng di động, và mở thêm dạng này là mở thêm cửa cho số bấm bừa.
  var NHAN_MAY_BAN = false;

  // Di động VN sau đợt đổi đầu số 2018: 10 số, bắt đầu 0, số thứ hai thuộc {3,5,7,8,9}.
  // CỐ Ý để rộng ở mức đầu số (không liệt kê từng nhà mạng): thiếu một đầu số hiếm thì mất khách
  // thật, còn lọt một dãy số vô nghĩa thì các chốt bên dưới vẫn bắt.
  var DI_DONG = /^0[35789]\d{8}$/;
  var MAY_BAN = /^02\d{9}$/;

  var LOI_MAC_DINH = "Số điện thoại phải đủ 10 số và bắt đầu bằng số 0 (ví dụ 0987654321)";

  /* ---------------------------------------------------------------------- *
   * CHUẨN HOÁ + KIỂM
   * ---------------------------------------------------------------------- */

  /**
   * Bỏ mọi ký tự không phải số, rồi quy dạng quốc tế về dạng 0.
   * Khách dán số từ danh bạ rất hay ra "+84 987 654 321" hoặc "0987.654.321" — chặn thẳng thì họ
   * tưởng mình nhập sai rồi bỏ đi, trong khi đó là số THẬT và chỉ lệch cách viết.
   */
  function chuanHoa(s) {
    var v = String(s == null ? "" : s).replace(/\D/g, "");
    if (v.slice(0, 4) === "0084") v = "0" + v.slice(4);
    else if (v.slice(0, 2) === "84") v = "0" + v.slice(2);   // "84..." chứ không phải "084..."
    return v;
  }

  /**
   * Dãy số bấm bừa một phím: 0000000000, hoặc số 0 rồi chín chữ số giống hệt nhau (0999999999).
   * Phải có VẾ THỨ HAI: "0999999999" không lọt vế đầu vì chữ số mở đầu là 0 khác phần còn lại,
   * mà đó lại đúng là dạng người ta bấm bừa nhiều nhất.
   * CỐ Ý không chặn dãy tăng dần (0912345678) — đầu số đó có thật, chặn là mất khách thật.
   */
  function toanSoLap(v) {
    return /^(\d)\1+$/.test(v) || /^0(\d)\1{8}$/.test(v);
  }

  /** Trả về chuỗi lỗi, hoặc "" nếu hợp lệ. */
  function loiCuaSo(raw) {
    var v = chuanHoa(raw);
    if (!v) return "Vui lòng nhập số điện thoại";
    if (v[0] !== "0") return "Số điện thoại phải bắt đầu bằng số 0";
    if (toanSoLap(v)) return "Số điện thoại không hợp lệ";
    if (DI_DONG.test(v)) return "";
    if (NHAN_MAY_BAN && MAY_BAN.test(v)) return "";
    if (v.length !== 10) return "Số điện thoại phải đủ 10 số (đang nhập " + v.length + " số)";
    // Tới đây là đủ 10 số và đã bắt đầu bằng 0, chỉ còn sai đầu số. Nhắc lại "đủ 10 số, bắt đầu
    // bằng 0" ở chỗ này là báo sai chỗ, khách đếm lại thấy đúng 10 số rồi loay hoay không hiểu.
    return "Đầu số không đúng — vui lòng kiểm tra lại (ví dụ 0987654321)";
  }

  /* ---------------------------------------------------------------------- *
   * TÌM Ô ĐIỆN THOẠI
   * ---------------------------------------------------------------------- */

  var DAU_HIEU = /(phone|tel|sdt|mobile|dien.?thoai|so.?dt)/i;

  function laODienThoai(el) {
    if (!el || el.tagName !== "INPUT") return false;
    if (el.type === "hidden" || el.disabled) return false;
    if (el.type === "tel") return true;
    return DAU_HIEU.test((el.name || "") + " " + (el.id || "") + " " + (el.placeholder || "") +
      " " + (el.getAttribute("autocomplete") || ""));
  }

  function timTrong(goc) {
    var ra = [];
    var ds = (goc || document).querySelectorAll("input");
    for (var i = 0; i < ds.length; i++) if (laODienThoai(ds[i])) ra.push(ds[i]);
    return ra;
  }

  /* ---------------------------------------------------------------------- *
   * HIỆN LỖI CẠNH Ô NHẬP
   * ---------------------------------------------------------------------- */

  function oLoi(el) {
    var n = el.nextElementSibling;
    if (n && n.getAttribute && n.getAttribute("data-sdt-loi") === "1") return n;
    var s = document.createElement("div");
    s.setAttribute("data-sdt-loi", "1");
    s.style.cssText = "color:#c0392b;font-size:13px;line-height:1.4;margin-top:4px;display:none";
    if (el.parentNode) el.parentNode.insertBefore(s, el.nextSibling);
    return s;
  }

  function baoLoi(el, loi) {
    var s = oLoi(el);
    if (loi) {
      s.textContent = loi;
      s.style.display = "block";
      el.setAttribute("aria-invalid", "true");
      el.style.borderColor = "#c0392b";
    } else {
      s.style.display = "none";
      el.removeAttribute("aria-invalid");
      el.style.borderColor = "";
    }
    // setCustomValidity để trình duyệt KHÔNG tự submit khi form dùng validate mặc định
    if (el.setCustomValidity) el.setCustomValidity(loi || "");
  }

  /* ---------------------------------------------------------------------- *
   * GẮN VÀO Ô NHẬP
   * ---------------------------------------------------------------------- */

  function gan(el) {
    if (el.getAttribute("data-sdt-gan") === "1") return;
    el.setAttribute("data-sdt-gan", "1");

    // Đặt luôn thuộc tính HTML — để bản phòng rà soát của Google đọc được, và để điện thoại bật
    // bàn phím số thay vì bàn phím chữ.
    if (!el.getAttribute("type") || el.getAttribute("type") === "text") el.setAttribute("type", "tel");
    el.setAttribute("inputmode", "numeric");
    el.setAttribute("autocomplete", "tel");
    // CỐ Ý KHÔNG đặt maxlength. Đo bằng trình duyệt thật 13/08/2026: maxlength="10" cắt chuỗi
    // NGAY LÚC DÁN, tức trước khi chuanHoa() kịp quy "+84 987 654 321" về "0987654321" — khách
    // dán số từ danh bạ (dạng phổ biến nhất) bị chặn oan. Ràng buộc độ dài đã có ở pattern và ở
    // loiCuaSo(), cả hai đều chạy SAU khi chuẩn hoá nên không vướng lỗi này.
    if (!el.getAttribute("pattern")) el.setAttribute("pattern", NHAN_MAY_BAN ? "0[0-9]{9,10}" : "0[35789][0-9]{8}");
    if (!el.getAttribute("title")) el.setAttribute("title", LOI_MAC_DINH);
    el.required = true;

    // Vừa gõ: chỉ lọc ký tự lạ, KHÔNG báo lỗi — báo lỗi ngay từ chữ số đầu tiên là kiểu form đỏ
    // lòm suốt lúc khách đang gõ, họ bỏ đi trước khi kịp nhập xong.
    el.addEventListener("input", function () {
      var v = chuanHoa(el.value);
      // CỐ Ý KHÔNG cắt bớt phần thừa. Cắt âm thầm thì "09876543210" gõ nhầm thành "0987654321" —
      // một số HỢP LỆ nhưng của NGƯỜI KHÁC, và khách không hề thấy mình vừa mất một chữ số.
      // Thà báo "đang nhập 11 số" để họ sửa. Dạng quốc tế đã được chuanHoa() lo, không cần cắt.
      if (v !== el.value) el.value = v;
      if (el.getAttribute("aria-invalid") === "true") baoLoi(el, loiCuaSo(el.value));
    });

    // Rời ô mới chấm điểm
    el.addEventListener("blur", function () { baoLoi(el, loiCuaSo(el.value)); });
  }

  function quet(goc) {
    var ds = timTrong(goc);
    for (var i = 0; i < ds.length; i++) gan(ds[i]);
    return ds;
  }

  /* ---------------------------------------------------------------------- *
   * CHẶN LÚC GỬI
   * ---------------------------------------------------------------------- */

  /**
   * Kiểm mọi ô điện thoại trong phạm vi gốc. Sai thì báo lỗi, đưa con trỏ về ô đầu tiên sai,
   * trả về false.
   */
  function kiem(goc) {
    var ds = quet(goc);
    var oSaiDauTien = null;
    for (var i = 0; i < ds.length; i++) {
      var loi = loiCuaSo(ds[i].value);
      baoLoi(ds[i], loi);
      if (loi && !oSaiDauTien) oSaiDauTien = ds[i];
    }
    if (oSaiDauTien) {
      try { oSaiDauTien.focus(); oSaiDauTien.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { }
      return false;
    }
    return true;
  }

  // Form gửi theo kiểu chuẩn
  document.addEventListener("submit", function (ev) {
    var f = ev.target;
    if (!f || f.tagName !== "FORM") return;
    if (!timTrong(f).length) return;
    if (!kiem(f)) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);

  /**
   * Nút đặt hàng không nằm trong <form> (gọi hàm JS bằng onclick) — kiểu này rất phổ biến ở sale
   * page một trang. Chỉ chặn nút đã được đánh dấu data-sdt-gate, hoặc nút type=submit: chặn bừa
   * mọi nút là chặn luôn nút "chọn combo" và khách không mua được gì.
   */
  document.addEventListener("click", function (ev) {
    var t = ev.target;
    var nut = t && t.closest ? t.closest("[data-sdt-gate],button[type=submit],input[type=submit]") : null;
    if (!nut) return;
    var goc = nut.closest("form") || document;
    if (!timTrong(goc).length) return;
    if (!kiem(goc)) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);

  /* ---------------------------------------------------------------------- *
   * KHỞI ĐỘNG + CỬA RA CHO CODE SẴN CÓ
   * ---------------------------------------------------------------------- */

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { quet(document); });
  else quet(document);

  // Ô nhập hiện ra sau (mở popup đặt hàng) thì vẫn được gắn.
  if (window.MutationObserver) {
    new MutationObserver(function () { quet(document); })
      .observe(document.documentElement, { childList: true, subtree: true });
  }

  /**
   * Cửa ra cho code sẵn có của trang. Nếu nút đặt hàng gọi thẳng một hàm JS (ví dụ
   * onclick="datHang()") thì thêm dòng này vào ĐẦU hàm đó:
   *     if (!IKI_SDT.kiem()) return;
   * Còn muốn tự xử lý thì dùng IKI_SDT.loi(so) — trả về chuỗi lỗi, "" là hợp lệ.
   */
  window.IKI_SDT = { kiem: function (goc) { return kiem(goc || document); }, loi: loiCuaSo, chuanHoa: chuanHoa };
})();
