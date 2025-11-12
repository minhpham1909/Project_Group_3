import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Trong reducers
    login(state, action) {
      if (action.payload) {
        // ✅ Check payload tồn tại
        state.isLoggedIn = true;
        state.user = action.payload;
      } else {
        // Không set loggedIn nếu payload null
        state.isLoggedIn = false;
      }
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
