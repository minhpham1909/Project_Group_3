const messages = {
  MESSAGE001: (username, authCode) => `
    Hello, ${username}

** This is an automated message -- please do not reply as you will not receive a response. **

This message is in response to your request to reset your account password. 
Please click the link below and follow the instructions to change your password.
Your password is: ${authCode}

https://chgpwd.fpt.edu.vn
Thank you.
SlayMe-Team.
  `,

  MESSAGE002:(username, authCode) => `
    Hello, ${username}
Chúc mừng! Bạn đã đặt thành công dịch vụ tại SlayMe !
Thông tin chi tiết về lịch hẹn của bạn:
- Lịch đặt: ${authCode.message}
- Dịch vụ: ${authCode.service_name}
- Cửa hàng: ${authCode.store_name}
- Thời gian: ${authCode.date ? new Date(authCode.date).toLocaleString() : 'Chưa xác định'}  
Chúng tôi rất mong được chào đón bạn tại SlayMe. Nếu có bất kỳ thay đổi nào về lịch hẹn, bạn vui lòng liên hệ với chúng tôi để điều chỉnh.

Cảm ơn bạn đã lựa chọn sử dụng dịch vụ booking của SlayMe, hẹn gặp lại bạn sớm!`,

  MESSAGE_ERROR: "ERROR: Unknown action code.",
};

module.exports = messages;