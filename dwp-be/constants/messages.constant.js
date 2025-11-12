const messages = {
  MESSAGE001: (username, authCode) => `
    Hello, ${username}

** This is an automated message -- please do not reply as you will not receive a response. **

This message is in response to your request to reset your account password. 
Please click the link below and follow the instructions to change your password.
Your password is: ${authCode}

https://chgpwd.fpt.edu.vn
Thank you.
StyleMe-Team.
  `,

  MESSAGE002: (username, authCode) => `
Kính gửi ${username},

Chúc mừng! Bạn đã đặt thành công dịch vụ tại StyleMe!

Thông tin chi tiết về lịch hẹn của bạn:
- Lịch đặt: ${authCode.message}
- Dịch vụ: ${authCode.service_name}
- Cửa hàng: ${authCode.store_name}
- Thời gian: ${
    authCode.date
      ? new Date(authCode.date).toLocaleString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Chưa xác định"
  }

Chúng tôi rất mong được chào đón bạn tại StyleMe. Nếu có bất kỳ thay đổi nào về lịch hẹn, bạn vui lòng liên hệ với chúng tôi qua email support@styleme.vn hoặc hotline 1900-1234 để điều chỉnh kịp thời.

Lưu ý quan trọng:
- Vui lòng đến đúng giờ để tránh mất lượt.
- Mang theo mã xác nhận để check-in nhanh chóng.
- Nếu hủy lịch ít hơn 24h trước, có thể áp dụng phí hủy 50%.

Cảm ơn bạn đã lựa chọn sử dụng dịch vụ booking của StyleMe. Hẹn gặp lại bạn sớm!

Trân trọng,
Đội ngũ StyleMe
Email: support@styleme.vn
Hotline: 1900-1234
Website: www.styleme.vn
`,

  MESSAGE_ERROR: "ERROR: Unknown action code.",
};

module.exports = messages;
