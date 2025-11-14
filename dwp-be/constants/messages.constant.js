const messages = {
  MESSAGE001: (username, authCode) => `
    Hello, ${username}

** This is an automated message -- please do not reply as you will not receive a response. **

This message is in response to your request to reset your account password. 
Please click the link below and follow the instructions to change your password.
Your password is: ${authCode}

https://chgpwd.fpt.edu.vn
Thank you.
CutMate-Team.
  `,

  MESSAGE002: (username, authCode) => `
Kính gửi ${username},

Chúc mừng! Bạn đã đặt thành công dịch vụ tại CutMate!

Thông tin chi tiết về lịch hẹn của bạn:
- Trạng thái: ${authCode.message}
- Dịch vụ: ${authCode.service_name}
- Mức phí: ${authCode.service_price}
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

Chúng tôi rất mong được chào đón bạn tại CutMate. Nếu có bất kỳ thay đổi nào về lịch hẹn, bạn vui lòng liên hệ với chúng tôi qua email support@cutmate.vn hoặc hotline 1900-1234 để điều chỉnh kịp thời.

Lưu ý quan trọng:
- Vui lòng đến đúng giờ để tránh mất lượt.
- Mang theo mã xác nhận để check-in nhanh chóng.
- Nếu hủy lịch ít hơn 24h trước, có thể áp dụng phí hủy 50%.

Cảm ơn bạn đã lựa chọn sử dụng dịch vụ booking của CutMate. Hẹn gặp lại bạn sớm!

Trân trọng,
Đội ngũ CutMate
Email: support@cutmate.vn
Hotline: 1900-1234
Website: www.cutmate.vn
`,

  MESSAGE_ERROR: "ERROR: Unknown action code.",
};

module.exports = messages;
