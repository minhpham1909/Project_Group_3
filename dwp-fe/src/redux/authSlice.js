import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action) {
      state.isLoggedIn = true;
      state.user = action.payload;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.user = null;
    },
    updateUserName(state, action) {
      // Kiểm tra nếu user tồn tại thì cập nhật tên
      if (state.user) {
        state.user.name = action.payload;
      }
    },
  },
});

export const { login, logout, updateUserName } = authSlice.actions;
export default authSlice.reducer;
