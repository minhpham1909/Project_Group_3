const db = require("../models");
const bcrypt = require("bcrypt");
const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function signUp(req, res, next) {
  try {
    if (req.body) {
      if (!req.body.account.email) {
        throw new createHttpError(400, "Username or email is required");
      }

      const hashedPassword = await bcrypt.hash(
        req.body.account.password,
        parseInt(process.env.SECRET_PASSWORD)
      );
      console.log(hashedPassword);
      let setRole;
      if (req.body.role) {
        setRole = req.body.role;
      } else {
        // Người dùng tự đăng ký, vai trò mặc định là 1 Customer
        setRole = 1;
      }

      const newUser = new db.user({
        account: {
          email: req.body.account.email,
          password: hashedPassword,
        },
        role: setRole,
        profile: {
          name: req.body.profile.name,
          phone: req.body.profile.phone,
          avatar: req.body.profile.avatar || "",
        },
        isFirstLogin: true,
        status: req.body.status || 1,
        roleRequestStatus: "none",
      });

      // Kiểm tra xem vai trò có hợp lệ không
      if (![1, 2, 3].includes(newUser.role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await db.user.create(newUser).then((addedUser) => {
        res.status(201).json({
          message: "Create successfully",
          result: addedUser,
        });
      });
    }
  } catch (error) {
    next(error);
  }
}

// Login
async function signIn(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (!identifier) {
      throw new createHttpError(400, "Username or email is required");
    }

    console.log("Identifier received:", password);

    if (!password) {
      throw new createHttpError(400, "Password is required");
    }

    console.log("Identifier:", identifier);
    console.log("Password:", password);

    const existUser = await db.user.findOne({
      $or: [{ "profile.name": identifier }, { "account.email": identifier }],
    });

    if (!existUser) {
      throw new createHttpError(404, "User not found");
    }

    // const isMatch = await bcrypt.compare(password, existUser.account.password);
    // if (!isMatch) {
    //   throw new createHttpError(401, "Invalid password");
    // }

    // Tạo access token
    const token = jwt.sign({ id: existUser._id }, process.env.SECRET_KEY, {
      algorithm: process.env.ALGORITHM,
      expiresIn: parseInt(process.env.ExpIn, 10), // Chuyển đổi thành số nguyên
    });

        res.status(200).json({
          success: true,
          token: token,
          userInfo: {
            name: existUser.profile.name,
            id: existUser._id,
            role: existUser.role,
          },
        });
    } catch (error) {
        next(error);
    }
}

// async function signInWithGoogle(req, res, next) {
//     const { idToken } = req.body;

//     try {
//         // Xác thực token ID với Google
//         const ticket = await client.verifyIdToken({
//             idToken: idToken,
//             audience: process.env.REACT_APP_CLIENT_ID,
//         });

//         const payload = ticket.getPayload();
//         const { sub, email, name, picture } = payload;

//         // Kiểm tra nếu người dùng đã tồn tại bằng email
//         let user = await db.user.findOne({ "account.email": email });
//         if (!user) {
//             // Tạo người dùng mới nếu chưa tồn tại
//             user = new db.user({
//                 account: {
//                     email: email,
//                     password: "", // Để trống vì Google Sign-In không cần mật khẩu
//                 },
//                 role: 2, // Có thể thiết lập vai trò mặc định (ví dụ: 2 cho người dùng bình thường)
//                 profile: {
//                     name: name || "Anonymous", // Tên từ Google hoặc tên mặc định
//                     phone: "", // Để trống, có thể yêu cầu bổ sung sau
//                     avatar: picture, // Ảnh đại diện từ Google
//                 },
//                 status: 1, // Trạng thái mặc định
//             });

//             // Lưu người dùng mới vào cơ sở dữ liệu
//             await user.save();
//         }

//         // Tạo JWT cho người dùng
//         const token = jwt.sign(
//             { userId: user._id, email: user.account.email },
//             process.env.SECRET_KEY,{
//                 algorithm: process.env.ALGORITHM,
//                 expiresIn: parseInt(process.env.ExpIn, 10) // Chuyển đổi thành số nguyên
//             });

//         // Trả về token và thông tin người dùng
//         res.status(200).json({
//             token,
//             userInfo: {
//                 id: user._id,
//                 name: user.profile.name,
//                 email: user.account.email,
//                 role: user.role,
//                 avatar: user.profile.avatar,
//             },
//         });
//     } catch (error) {
//         console.error("Error verifying Google ID Token:", error);
//         res.status(401).json({ message: "Invalid ID token" });
//     }
// }

async function signOut(req, res, next) {
  try {
    res.status(200).json({ message: "Sign out successful" });
    console.log("Sign out successful");
  } catch (error) {
    next(error);
  }
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Lấy token từ header

  if (!token)
    return res.status(401).json({ message: "Access token is missing" });

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    // `user` là thông tin đã giải mã từ token, bao gồm `userId`, `email`, `role`, etc.
    req.user = user; // Lưu thông tin người dùng vào req để sử dụng trong các route tiếp theo
    next();
  });
};

module.exports = authenticateToken;

const AuthController = {
  signUp,
  signIn,
  signOut,
};

module.exports = AuthController;
