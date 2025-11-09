const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema({
  account: {
    email: {
      type: String,
      unique: true,
      required: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format"], // Biểu thức chính quy cho email
    },
    password: {
      type: String,
      required: true,
      minlength: [6, 'Password must be at least 6 characters long'],
      validate: [
        {
          validator: function (value) {
            return /[a-zA-Z]/.test(value);
          },
          message: 'Password must contain at least one letter.',
        },
        {
          validator: function (value) {
            return /\d/.test(value);
          },
          message: 'Password must contain at least one number.',
        },
        {
          validator: function (value) {
            return /[@$!%*?&]/.test(value);
          },
          message: 'Password must contain at least one special character (@, $, !, %, *, ?, &).',
        }
      ]
    }
  },
  role: {
    type: Number,
    enum: [1, 2, 3],
    required: true,
  },
  profile: {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^0\d{9}$/, "Phone number must start with 0 and have 10 digits"],
    },
    avatar: String,
    gender: Boolean
  },
  status: {
    type: Number,
    default: 1,
    enum: [1, 2, 3, 4, 5],
    required: true,
  }
},{
  timestamps: true
});

module.exports = mongoose.model("Users", UsersSchema, "users");
