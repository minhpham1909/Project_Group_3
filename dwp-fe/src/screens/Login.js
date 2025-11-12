import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";
import axios from "axios";
import SLAYME from "../../assets/SLAYME.svg";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

export default function Login({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useDispatch();
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_ROOT}/auth/sign-in`, {
        identifier: identifier,
        password: password,
      });

      console.log("Login successful");
      dispatch(login(res.data.userInfo));
      console.log(res.data.userInfo);
      setErrorMessage("");
    } catch (error) {
      console.log("Login failed");
      if (error.response) {
        // Nếu có phản hồi từ server, hiển thị thông báo lỗi
        const message = error.response.data.message || "Đăng nhập thất bại";
        setErrorMessage(message);
      } else if (error.request) {
        // Nếu không nhận được phản hồi từ server
        setErrorMessage("Không thể kết nối đến server. Vui lòng thử lại sau.");
      } else {
        // Các lỗi khác (ví dụ: lỗi khi cấu hình yêu cầu)
        setErrorMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
      console.log(error.response || error.message);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const res = await axios.post(
        `${API_ROOT}/user/forget-password`,
        {
          email: email,
        }
      );
      console.log(res.data.message);
      setCodeSent(true);
      Alert.alert("Mã xác thực", "Mã xác thực đã được gửi đến email của bạn.");
    } catch (error) {
      console.log(error.response ? error.response.data : error);
      Alert.alert(
        "Lỗi",
        "Không thể gửi mã xác thực. Vui lòng kiểm tra lại email."
      );
    }
  };

  const handleResendCode = () => {
    handleForgotPassword();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.viewImage}>
            <SLAYME width={180} height={80} />
          </View>
          <Text style={styles.title}>Chào mừng trở lại!</Text>
          <Text style={styles.subtitle}>
            CutMate - Cắt ở đâu cũng đẹp - Vì có Mate
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color={COLORS.GRAY}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email hoặc tên đăng nhập"
              placeholderTextColor={COLORS.GRAY}
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                setErrorMessage("");
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={COLORS.GRAY}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={COLORS.GRAY}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage("");
              }}
              secureTextEntry={true}
              autoCapitalize="none"
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.ERROR} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loginButton,
              (!identifier || !password) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!identifier || !password}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Forgot Password */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setCodeSent(false);
          setEmail("");
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => {
                setModalVisible(false);
                setCodeSent(false);
                setEmail("");
              }}
            >
              <Ionicons name="close" size={24} color={COLORS.GRAY} />
            </TouchableOpacity>

            <Ionicons
              name="key-outline"
              size={48}
              color={COLORS.PRIMARY}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Quên mật khẩu?</Text>
            <Text style={styles.modalSubtitle}>
              {codeSent
                ? "Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư."
                : "Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu"}
            </Text>

            {!codeSent && (
              <View style={styles.modalInputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.GRAY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor={COLORS.GRAY}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            )}

            {codeSent ? (
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => {
                    setModalVisible(false);
                    setCodeSent(false);
                    setEmail("");
                  }}
                >
                  <Text style={styles.modalButtonSecondaryText}>Đóng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleResendCode}
                >
                  <Text style={styles.modalButtonText}>Gửi lại mã</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  !email && styles.modalButtonDisabled,
                ]}
                onPress={handleForgotPassword}
                disabled={!email}
              >
                <Text style={styles.modalButtonText}>Gửi mã xác thực</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.LARGE,
    paddingTop: SPACING.XLARGE,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.XLARGE,
    marginTop: SPACING.LARGE,
  },
  viewImage: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.LARGE,
  },
  title: {
    fontSize: FONTS.XLARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    textAlign: "center",
    paddingHorizontal: SPACING.MEDIUM,
  },
  formContainer: {
    marginTop: SPACING.XLARGE,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: SPACING.MEDIUM,
    paddingHorizontal: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: SPACING.SMALL,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    paddingVertical: 0,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    padding: SPACING.SMALL,
    borderRadius: 8,
    marginBottom: SPACING.MEDIUM,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.ERROR,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: FONTS.SMALL,
    marginLeft: SPACING.SMALL,
    flex: 1,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: SPACING.LARGE,
  },
  forgotPasswordText: {
    color: COLORS.PRIMARY,
    fontSize: FONTS.SMALL,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.SMALL,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.XLARGE,
    marginBottom: SPACING.LARGE,
  },
  footerText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  registerLink: {
    fontSize: FONTS.REGULAR,
    color: COLORS.PRIMARY,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalView: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: SPACING.LARGE,
    alignItems: "center",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.LARGE,
    marginTop: SPACING.MEDIUM,
  },
  modalButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.XLARGE,
    marginTop: SPACING.MEDIUM,
    minWidth: 150,
    alignItems: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  modalIcon: {
    marginBottom: SPACING.MEDIUM,
  },
  modalSubtitle: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    textAlign: "center",
    marginBottom: SPACING.LARGE,
    paddingHorizontal: SPACING.SMALL,
    lineHeight: 20,
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: SPACING.LARGE,
    paddingHorizontal: SPACING.MEDIUM,
    width: "100%",
  },
  modalInput: {
    flex: 1,
    height: 50,
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    paddingVertical: 0,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: SPACING.SMALL,
  },
  modalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    flex: 1,
  },
  modalButtonSecondaryText: {
    color: COLORS.PRIMARY,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  modalButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0,
    elevation: 0,
  },
  closeIcon: {
    position: "absolute",
    top: SPACING.MEDIUM,
    right: SPACING.MEDIUM,
    padding: SPACING.SMALL,
    zIndex: 1,
  },
});
