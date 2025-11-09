const nodemailer = require('nodemailer');
const messages = require('../constants/messages.constant');
const actions = require('../actions/requestController.action');
require('dotenv').config();

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm gửi email
const sendEmail = async (recipientEmail, username, authCode, action) => {
  let emailText = '';
  let emailSubject = '';

  if (action === actions.FORGET_PASSWORD) {
    emailText = messages.MESSAGE001(username, authCode);
    emailSubject = "Request to Reset Your Password by SlayMe-Team";  
  }else if (action === actions.BOOKING_SERVICE) {
    emailText = messages.MESSAGE002(username, authCode);
    emailSubject = "Booking Service Successfully by SlayMe-Team";  
  }
   else {
    emailText = messages.MESSAGE_ERROR;
    emailSubject = "ERROR: Unknown action code.";
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: emailSubject,  
    text: emailText
  };

  return transporter.sendMail(mailOptions);
};

function generateAuthCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '@$!%*?&';

  // Chọn ngẫu nhiên ít nhất 1 chữ cái, 1 số và 1 ký tự đặc biệt
  const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNumber = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const randomSpecialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));

  // Tạo danh sách tất cả các ký tự để chọn các ký tự ngẫu nhiên khác
  const allChars = letters + numbers + specialChars;

  // Chọn thêm 5 ký tự ngẫu nhiên từ danh sách để đạt đủ 6 ký tự
  let remainingChars = '';
  for (let i = 0; i < 5; i++) {
    remainingChars += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Kết hợp tất cả các ký tự lại với nhau
  const authCode = randomLetter + randomNumber + randomSpecialChar + remainingChars;

  // Ngẫu nhiên sắp xếp lại các ký tự để tạo ra mã xác thực hoàn chỉnh
  return authCode.split('').sort(() => Math.random() - 0.5).join('');
}

const resetPassword = async (req, res, next) => {
  try {

  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendEmail,
  generateAuthCode
};
