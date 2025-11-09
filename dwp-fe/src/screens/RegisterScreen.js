import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";
import SLAYME from "../../assets/SLAYME.svg";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [confirmPassword, setConfirmPassword] = useState();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const api = process.env.REACT_APP_IP_Address;

  useEffect(() => {
    setName(`${lastName} ${firstName}`);
  }, [lastName, firstName]);

  const validateForm = () => {
    if (!firstName.trim()) {
      setErrorMessage("Vui lòng nhập tên");
      return false;
    }
    if (!lastName.trim()) {
      setErrorMessage("Vui lòng nhập họ");
      return false;
    }
    if (!phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại");
      return false;
    }
    if (!email || !email.includes("@")) {
      setErrorMessage("Vui lòng nhập email hợp lệ");
      return false;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu không khớp");
      return false;
    }
    return true;
  };

  const handleRegister = () => {
    if (!validateForm()) {
      setModalVisible(true);
      return;
    }

    axios
      .post(`${API_ROOT}/auth/sign-up`, {
        account: {
          email: email,
          password: password,
        },
        profile: {
          name: name.trim(),
          phone: phone.trim(),
          avatar: "",
        },
        role: 1,
        status: 1,
      })
      .then((res) => {
        console.log(res);
        Alert.alert("Thành công", "Đăng ký thành công!", [
          {
            text: "Đăng nhập",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      })
      .catch((error) => {
        const errorMessage =
          error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
        console.error("Lỗi:", errorMessage);
        setErrorMessage(errorMessage);
        setModalVisible(true);
      });
  };

  const backtoLogin = () => {
    navigation.navigate("Login");
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
          <View style={styles.logoContainer}>
            <SLAYME width={180} height={80} />
          </View>
          <Text style={styles.title}>Tạo tài khoản mới</Text>
          <Text style={styles.subtitle}>Đăng ký để bắt đầu sử dụng SlayMe</Text>
        </View>

        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Họ"
                placeholderTextColor={COLORS.GRAY}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  setErrorMessage("");
                }}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputWrapper, { marginLeft: SPACING.SMALL }]}>
              <Ionicons name="person-outline" size={20} color={COLORS.GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tên"
                placeholderTextColor={COLORS.GRAY}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setErrorMessage("");
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color={COLORS.GRAY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor={COLORS.GRAY}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setErrorMessage("");
              }}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={COLORS.GRAY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.GRAY}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.GRAY} style={styles.inputIcon} />
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

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.GRAY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor={COLORS.GRAY}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
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
            style={[
              styles.registerButton,
              (!email || !password || !firstName || !lastName || !phone) &&
                styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={!email || !password || !firstName || !lastName || !phone}
          >
            <Text style={styles.registerButtonText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={backtoLogin}>
            <Text style={styles.loginLink}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal thông báo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.GRAY} />
            </TouchableOpacity>
            <Ionicons
              name="alert-circle"
              size={48}
              color={COLORS.ERROR}
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>Thông báo</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
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
    marginBottom: SPACING.LARGE,
    marginTop: SPACING.MEDIUM,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.MEDIUM,
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
  avatarContainer: {
    alignItems: "center",
    marginBottom: SPACING.LARGE,
    marginTop: SPACING.SMALL,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  formContainer: {
    marginTop: SPACING.MEDIUM,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: SPACING.MEDIUM,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
    marginTop: SPACING.SMALL,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.ERROR,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: FONTS.SMALL,
    marginLeft: SPACING.SMALL,
    flex: 1,
  },
  registerButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.LARGE,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonDisabled: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
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
  loginLink: {
    fontSize: FONTS.REGULAR,
    color: COLORS.PRIMARY,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContainer: {
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
  closeIcon: {
    position: "absolute",
    top: SPACING.MEDIUM,
    right: SPACING.MEDIUM,
    padding: SPACING.SMALL,
    zIndex: 1,
  },
  modalIcon: {
    marginBottom: SPACING.MEDIUM,
    marginTop: SPACING.SMALL,
  },
  modalTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.MEDIUM,
  },
  modalMessage: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    textAlign: "center",
    marginBottom: SPACING.LARGE,
    paddingHorizontal: SPACING.SMALL,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.XLARGE,
    minWidth: 120,
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
});
