const actions = require("../actions/requestController.action");
const userModel = require("../models/user.model");
const {
  sendEmail,
  generateAuthCode,
} = require("../services/mailService.service");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { getAllStore2 } = require("./store.controller");

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const user = await userModel.findOne({ "account.email": req.body.email });

    console.log(`Email: ${req.body.email}`);
    console.log(`User `, user);
    if (!user) {
      return res.status(404).json({ message: "Email không tồn tại." });
    }

    const authCode = generateAuthCode();
    console.log(authCode);
    const hashedPassword = await bcrypt.hash(
      authCode,
      parseInt(process.env.SECRET_PASSWORD)
    );
    console.log(hashedPassword);
    user.set((user.account.password = hashedPassword));
    console.log(user.account.password);
    await user.save();
    console.log(hashedPassword);
    await sendEmail(
      req.body.email,
      user.profile.name,
      authCode,
      actions.FORGET_PASSWORD
    );
    res
      .status(200)
      .json({ message: "Mã xác thực đã được gửi đến email của bạn." });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res
        .status(400)
        .json({ message: "User id is required in params." });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldPassword = req.body.oldPassword ?? req.body.password;
    const newPassword = req.body.newPassword ?? req.body.confirmPassword;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required",
      });
    }

    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from old password" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.account.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.account.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Change password successfully" });
  } catch (error) {
    next(error);
  }
};

const getUserId = async (req, res) => {
  try {
    const userId = await userModel.findById(req.params.userId);
    res.status(200).json(userId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const chatBot = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res
        .status(400)
        .json({ error: "Missing question in request body." });
    }

    console.log("Câu hỏi gửi đi AI:", question);

    // Kiểm tra nếu câu hỏi có chứa các từ khóa như "tư vấn", "chọn cửa hàng", "dịch vụ"
    let additionalPrompt = "";

    if (
      question.toLowerCase().includes("tư vấn") ||
      question.toLowerCase().includes("chọn cửa hàng") ||
      question.toLowerCase().includes("dịch vụ")
    ) {
      try {
        // Gọi hàm getAllStore để lấy tất cả cửa hàng
        const stores = await getAllStore2(); // Hàm này sẽ trả về danh sách các cửa hàng
        if (!stores || stores.length === 0) {
          return res
            .status(404)
            .json({ error: "Không tìm thấy cửa hàng nào." });
        }

        console.log("Danh sách cửa hàng:", stores);

        // Tạo câu hỏi phụ cho AI với thông tin dịch vụ và cửa hàng
        additionalPrompt = `Trả lời bằng văn bản thuần, không dùng ký tự #, *, - ở đầu dòng, không dùng code block, không dùng markdown. Dưới đây là các dịch vụ và cửa hàng mà tôi có thể gợi ý cho bạn:\n`;

        // Lặp qua các cửa hàng và dịch vụ để tạo danh sách gợi ý
        stores.forEach((store) => {
          store.services.forEach((service) => {
            additionalPrompt += `Cửa hàng: ${store.nameShop} - Dịch vụ: ${service.service_name} - Giá: ${service.service_price}\n`;
          });
        });
        additionalPrompt +=
          "Hãy chọn một dịch vụ hoặc cửa hàng phù hợp với bạn. Trả lời bằng văn bản thuần, không dùng ký tự #, *, - ở đầu dòng, không dùng code block, không dùng markdown";
      } catch (error) {
        return res
          .status(500)
          .json({ error: `Lỗi khi lấy thông tin cửa hàng: ${error.message}` });
      }
    }

    // Kết hợp câu hỏi ban đầu với câu hỏi phụ (nếu có)
    const finalQuestion = question + "\n" + additionalPrompt;

    // Gửi câu hỏi đã được bổ sung tới OpenAI API
    const response = await fetch("https://api.yescale.io/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY_GPT}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Bạn là một trợ lý thông minh. Trả lời NGẮN GỌN, rõ ràng, dễ hiểu. Tuyệt đối KHÔNG sử dụng ký tự markdown như #, ##, **, -, *, hoặc code block. Trả lời hoàn toàn bằng văn bản thuần, mỗi phần cách nhau bằng dòng trống nếu cần.",
          },
          {
            role: "user",
            content: finalQuestion,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content?.trim();

    if (!aiMessage) {
      throw new Error("No valid response from OpenAI API.");
    }

    console.log("Phản hồi từ OpenAI:", aiMessage);

    res.json({ message: aiMessage });
  } catch (error) {
    console.error("Lỗi khi lấy phản hồi từ AI:", error);
    res
      .status(500)
      .json({ error: `Không thể lấy phản hồi từ AI: ${error.message}` });
  }
};

const requestRoleSupplier = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.roleRequestStatus === "pending") {
      return res.status(400).json({ message: "Request already pending" });
    }

    await userModel.findByIdAndUpdate(userId, {
      roleRequestStatus: "pending",
    });

    console.log(`User ${userId} requested to become a supplier. `);

    res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    if (error.name === "CastError")
      res.status(400).json({ message: "Invalid user ID" });
    else res.status(500).json({ error: error.message });
  }
};

// Admin duyệt hoặc từ chối

const getRequest = async (req, res) => {
  try {
    const user = await userModel.find({ roleRequestStatus: "pending" });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    if (error.name === "CastError")
      res.status(400).json({ message: "Invalid user ID" });
    else res.status(500).json({ error: error.message });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { approved } = req.body;
    const user = await userModel.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.roleRequestStatus = approved ? "approved" : "rejected";
    if (approved) user.role = 2; // trở thành nhà cung cấp
    await user.save();

    res.status(200).json({ message: "Request processed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  const { userId } = req.params; // ID người dùng từ params
  const updateData = req.body; // dữ liệu update từ body

  console.log(updateData);

  try {
    // Loại bỏ email và password nếu người dùng gửi
    if (updateData.account) {
      delete updateData.account.email;
      delete updateData.account.password;
    }

    // Cập nhật user
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  forgotPassword,
  changePassword,
  getUserId,
  chatBot,
  requestRoleSupplier,
  getRequest,
  approveRequest,
  updateUser,
};
