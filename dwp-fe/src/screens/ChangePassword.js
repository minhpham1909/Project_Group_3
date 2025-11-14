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
import axios from "axios";
import { useSelector } from "react-redux";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

export default function ChangePassword({ navigation }) {
  const userId = useSelector((state) => state.auth.user?.id);

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");

  // Toggle show/hide
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!password || !newPassword || !confirmNew) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    if (newPassword !== confirmNew) {
      Alert.alert("Lỗi", "Xác nhận mật khẩu không khớp!");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_ROOT}/user/reset-password/${userId}`,
        {
          oldPassword: password,
          newPassword: newPassword,
        }
      );

      Alert.alert("Thành công", res.data.message, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể đổi mật khẩu"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, value, setValue, show, setShow) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          secureTextEntry={!show}
          style={styles.input}
          placeholder={label}
          value={value}
          onChangeText={setValue}
        />

        <TouchableOpacity onPress={() => setShow(!show)}>
          <Ionicons
            name={show ? "eye-off" : "eye"}
            size={22}
            color={COLORS.GRAY}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
      </View>

      {/* Body */}
      <View style={styles.container}>
        {renderInput(
          "Mật khẩu hiện tại",
          password,
          setPassword,
          showOld,
          setShowOld
        )}

        {renderInput(
          "Mật khẩu mới",
          newPassword,
          setNewPassword,
          showNew,
          setShowNew
        )}

        {renderInput(
          "Xác nhận mật khẩu mới",
          confirmNew,
          setConfirmNew,
          showConfirm,
          setShowConfirm
        )}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.WHITE} />
          ) : (
            <Text style={styles.buttonText}>Cập nhật mật khẩu</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.MEDIUM,
    backgroundColor: COLORS.PRIMARY,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  backButton: {
    padding: 6,
    marginRight: SPACING.MEDIUM,
  },

  headerTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },

  container: {
    padding: SPACING.LARGE,
  },

  inputGroup: {
    marginBottom: SPACING.LARGE,
  },

  label: {
    marginBottom: SPACING.SMALL,
    color: COLORS.GRAY,
    fontSize: FONTS.REGULAR,
  },

  inputWrapper: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 10,
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    alignItems: "center",
  },

  input: {
    flex: 1,
    paddingVertical: SPACING.MEDIUM,
    fontSize: FONTS.REGULAR,
  },

  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: 12,
    alignItems: "center",
    marginTop: SPACING.LARGE,
  },

  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
});
