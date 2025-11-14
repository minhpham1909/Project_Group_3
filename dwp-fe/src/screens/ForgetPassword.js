import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CutMate from "../../assets/CutMate.svg";
import { COLORS, FONTS, SPACING, API_ROOT } from "../utils/constant"; // Giả sử có file constant

const ForgetPassword = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendResetLink = async () => {
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_ROOT}/user/forget-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lỗi không xác định");
      }

      Alert.alert(
        "Thành công",
        data.message || "Mã xác thực đã được gửi đến email của bạn!"
      );
      navigation.goBack(); // Quay về màn hình login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.GRAY} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.viewImage}>
            <CutMate width={180} height={80} />
          </View>
          <Ionicons name="lock-open-outline" size={80} color={COLORS.PRIMARY} />
          <Text style={styles.title}>Quên mật khẩu?</Text>
          <Text style={styles.subtitle}>
            Nhập email của bạn để nhận link đặt lại mật khẩu.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View
            style={[styles.inputGroup, error ? styles.inputGroupError : null]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={COLORS.GRAY}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập email của bạn"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              { width: "100%" },
              loading ? styles.buttonDisabled : null,
            ]}
            onPress={handleSendResetLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color={COLORS.WHITE} />
                <Text style={styles.buttonText}>Xác nhận</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.linkText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND || "#f5f5f5",
  },
  viewImage: {
    justifyContent: "center",
    alignItems: "center",
    // marginBottom: SPACING.SMALL,
  },
  innerContainer: {
    flex: 1,
    padding: SPACING.LARGE,
  },
  backButton: {
    marginTop: SPACING.SMALL,
    marginBottom: SPACING.SMALL,
    alignSelf: "flex-start",
  },
  header: {
    alignItems: "center",
    marginBottom: -200,
  },
  title: {
    fontSize: FONTS.XLARGE || 28,
    fontWeight: "bold",
    color: COLORS.TEXT || "#333",
    marginTop: SPACING.MEDIUM,
    marginBottom: SPACING.SMALL,
  },
  subtitle: {
    fontSize: FONTS.REGULAR || 16,
    color: COLORS.GRAY || "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE || "#fff",
    borderRadius: 12,
    marginBottom: SPACING.MEDIUM,
    paddingHorizontal: SPACING.MEDIUM,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inputGroupError: {
    borderWidth: 1,
    borderColor: COLORS.ERROR || "#d32f2f",
  },
  inputIcon: {
    marginRight: SPACING.SMALL,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.MEDIUM,
    fontSize: FONTS.REGULAR || 16,
    color: COLORS.TEXT || "#333",
  },
  errorText: {
    color: COLORS.ERROR || "#d32f2f",
    fontSize: FONTS.SMALL || 14,
    textAlign: "center",
    marginBottom: SPACING.MEDIUM,
  },
  button: {
    flexDirection: "row",
    backgroundColor: COLORS.PRIMARY || "#1976d2",
    paddingVertical: SPACING.LARGE,
    paddingHorizontal: SPACING.XLARGE,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.MEDIUM,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: COLORS.GRAY || "#ccc",
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR || 16,
    fontWeight: "bold",
    marginLeft: SPACING.SMALL,
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: COLORS.PRIMARY || "#1976d2",
    fontSize: FONTS.REGULAR || 16,
    textDecorationLine: "underline",
  },
});

export default ForgetPassword;
