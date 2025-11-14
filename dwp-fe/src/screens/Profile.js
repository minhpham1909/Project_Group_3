import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import { logout, updateUser } from "../redux/authSlice";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

export default function Profile({ navigation }) {
  const userName = useSelector((state) => state.auth.user?.name);
  const userId = useSelector((state) => state.auth.user?.id);
  const dispatch = useDispatch();

  const [userDetails, setUserDetails] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    gender: null,
    address: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return;
      fetchUserDetails();
      fetchQuizData();
    }, [userId])
  );

  const fetchUserDetails = async () => {
    try {
      const res = await axios.get(`${API_ROOT}/user/${userId}`);
      setUserDetails(res.data);
    } catch (error) {
      console.log("Error fetching user details:", error);
    }
  };

  const fetchQuizData = async () => {
    try {
      const res = await axios.get(`${API_ROOT}/quiz/getQuizByUserId/${userId}`);
      setQuizData(res.data);
    } catch (error) {
      console.log("Error fetching quizzes:", error);
    }
  };

  const getQuizById = async (quizId) => {
    try {
      const res = await axios.get(`${API_ROOT}/quiz/${quizId}`);
      console.log(res.data);
      setSelectedQuiz(res.data);
      setQuizModalVisible(true);
    } catch (error) {
      console.log("Error fetching quiz details:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.post(`${API_ROOT}/auth/sign-out`);
          } catch (error) {
            console.log("Logout Error:", error.response || error);
          } finally {
            dispatch(logout());
          }
        },
      },
    ]);
  };

  const handleRequestBecomeSupplier = () => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn gửi yêu cầu trở thành Nhà cung cấp không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gửi yêu cầu",
          onPress: sendSupplierRequest,
        },
      ]
    );
  };

  const sendSupplierRequest = async () => {
    setIsRequesting(true);
    try {
      const res = await axios.put(
        `${API_ROOT}/user/request-supplier/${userId}`
      );
      Alert.alert(
        "Thành công",
        "Yêu cầu của bạn đã được gửi đến quản trị viên!"
      );
      fetchUserDetails();
    } catch (error) {
      console.log("Error sending supplier request:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể gửi yêu cầu. Thử lại sau."
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const openEditModal = () => {
    setEditData({
      name: userDetails?.profile?.name || "",
      phone: userDetails?.profile?.phone || "",
      gender: userDetails?.profile?.gender,
      address: userDetails?.profile?.address || "",
    });
    setEditModalVisible(true);
  };

  const handleUpdateUser = async () => {
    setIsUpdating(true);
    try {
      const payload = {
        profile: {
          name: editData.name,
          phone: editData.phone,
          gender: editData.gender,
          address: editData.address,
        },
        ...(editData.address ? { isFirstLogin: false } : {}),
      };
      await axios.put(`${API_ROOT}/user/${userId}`, payload);

      // Update Redux ngay từ editData (fallback nếu fetch chậm)
      dispatch(
        updateUser({
          user: {
            ...userName, // Giữ các field cũ
            name: editData.name, // Update name mới
            profile: { ...userDetails?.profile, ...payload.profile }, // Merge profile
          },
        })
      );

      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
      fetchUserDetails(); // Vẫn gọi để sync full data
      setEditModalVisible(false);
    } catch (error) {
      console.log("Error updating user:", error.response || error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể cập nhật. Thử lại sau."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa có thông tin";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const isLoading = userId && !userDetails;

  const defaultAvatar =
    "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg";

  const genderOptions = [
    { label: "Nam", value: true },
    { label: "Nữ", value: false },
  ];

  const selectGender = (value) => {
    setEditData({ ...editData, gender: value });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: userDetails?.profile?.avatar || defaultAvatar,
                  }}
                  style={styles.profileImage}
                />
                <TouchableOpacity
                  style={styles.editAvatarButton}
                  onPress={openEditModal}
                >
                  <Ionicons name="camera" size={16} color={COLORS.WHITE} />
                </TouchableOpacity>
              </View>
              <Text style={styles.username}>{userName || "Người dùng"}</Text>
              <Text style={styles.userRole}>
                {userDetails?.role === 1
                  ? "Khách hàng"
                  : userDetails?.role === 2
                  ? "Chủ cửa hàng"
                  : "Quản trị viên"}
              </Text>
            </View>

            {/* User Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={COLORS.GRAY} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>
                    {userDetails?.account?.email || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={COLORS.GRAY} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Số điện thoại</Text>
                  <Text style={styles.infoValue}>
                    {userDetails?.profile?.phone || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={COLORS.GRAY} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Giới tính</Text>
                  <Text style={styles.infoValue}>
                    {userDetails?.profile?.gender === true
                      ? "Nam"
                      : userDetails?.profile?.gender === false
                      ? "Nữ"
                      : "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="home-outline" size={20} color={COLORS.GRAY} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Địa chỉ</Text>
                  <Text style={styles.infoValue}>
                    {userDetails?.profile?.address || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              {/* Buttons */}
              <TouchableOpacity
                style={styles.editButton}
                onPress={openEditModal}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={COLORS.WHITE}
                />
                <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
              </TouchableOpacity>

              {userDetails?.role === 1 && (
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    (isRequesting ||
                      userDetails?.roleRequestStatus === "pending") && {
                      opacity: 0.6,
                    },
                  ]}
                  disabled={
                    isRequesting || userDetails?.roleRequestStatus === "pending"
                  }
                  onPress={handleRequestBecomeSupplier}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={20}
                    color={COLORS.WHITE}
                  />
                  <Text style={styles.editButtonText}>
                    {isRequesting
                      ? "Đang gửi yêu cầu..."
                      : userDetails?.roleRequestStatus === "pending"
                      ? "Đã gửi yêu cầu - Chờ duyệt"
                      : "Yêu cầu trở thành Nhà cung cấp"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Quizzes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="book-outline"
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.sectionTitle}>Lịch sử khảo sát</Text>
              </View>
              {quizData.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Ionicons name="book-outline" size={48} color={COLORS.GRAY} />
                  <Text style={styles.noDataText}>
                    Chưa có bài phân tích nào.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.quizScroll}
                >
                  {quizData.map((quiz, index) => (
                    <TouchableOpacity
                      key={quiz._id || index}
                      style={styles.quizCard}
                      onPress={() =>
                        navigation.navigate("QuizzDetail", { quizId: quiz._id })
                      }
                    >
                      <Ionicons name="book" size={32} color={COLORS.PRIMARY} />
                      <Text style={styles.quizTitle} numberOfLines={2}>
                        {quiz.title}
                      </Text>
                      <Text style={styles.quizDate}>
                        {formatDate(quiz.createdAt)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Settings Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.sectionTitle}>Cài đặt</Text>
              </View>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => navigation.navigate("ChangePassword")}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={COLORS.PRIMARY}
                    />
                  </View>
                  <Text style={styles.settingText}>Đổi mật khẩu</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.GRAY}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleLogout}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconContainer,
                      styles.logoutIconContainer,
                    ]}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color={COLORS.ERROR}
                    />
                  </View>
                  <Text style={[styles.settingText, styles.logoutText]}>
                    Đăng xuất
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.GRAY}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Edit User Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.editModalContainer}>
                {/* Header */}
                <View style={styles.editModalHeader}>
                  <Text style={styles.editModalTitle}>Chỉnh sửa thông tin</Text>
                  <TouchableOpacity
                    onPress={() => setEditModalVisible(false)}
                    style={styles.editModalClose}
                  >
                    <Ionicons name="close" size={24} color={COLORS.GRAY} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.editModalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.editInputGroup}>
                    <Text style={styles.editInputLabel}>Tên tài khoản</Text>
                    <TextInput
                      value={editData.name}
                      onChangeText={(text) =>
                        setEditData({ ...editData, name: text })
                      }
                      placeholder="Nhập tên tài khoản"
                      style={styles.editInput}
                    />
                  </View>

                  {/* Phone */}
                  <View style={styles.editInputGroup}>
                    <Text style={styles.editInputLabel}>Số điện thoại</Text>
                    <TextInput
                      value={editData.phone}
                      onChangeText={(text) =>
                        setEditData({ ...editData, phone: text })
                      }
                      placeholder="Nhập số điện thoại"
                      style={styles.editInput}
                      keyboardType="phone-pad"
                    />
                  </View>

                  {/* Gender */}
                  <View style={styles.editInputGroup}>
                    <Text style={styles.editInputLabel}>Giới tính</Text>
                    <View style={styles.genderContainer}>
                      {genderOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value?.toString() || "null"}
                          style={[
                            styles.genderOption,
                            editData.gender === option.value &&
                              styles.genderOptionSelected,
                          ]}
                          onPress={() => selectGender(option.value)}
                        >
                          <Text
                            style={[
                              styles.genderOptionText,
                              editData.gender === option.value &&
                                styles.genderOptionTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Address */}
                  <View style={styles.editInputGroup}>
                    <Text style={styles.editInputLabel}>Địa chỉ</Text>
                    <TextInput
                      value={editData.address}
                      onChangeText={(text) =>
                        setEditData({ ...editData, address: text })
                      }
                      placeholder="Nhập địa chỉ"
                      style={[
                        styles.editInput,
                        { minHeight: 80, textAlignVertical: "top" },
                      ]}
                      multiline
                    />
                  </View>
                </ScrollView>

                {/* Update Button */}
                <TouchableOpacity
                  style={[
                    styles.editModalButton,
                    { opacity: isUpdating ? 0.6 : 1 },
                  ]}
                  onPress={handleUpdateUser}
                  disabled={isUpdating}
                >
                  <Text style={styles.editModalButtonText}>
                    {isUpdating ? "Đang cập nhật..." : "Cập nhật thông tin"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Quiz Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={quizModalVisible}
            onRequestClose={() => setQuizModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedQuiz?.title || "Chi tiết bài kiểm tra"}
                  </Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setQuizModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.GRAY} />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Ngày tạo */}
                  <Text style={styles.infoValue}>
                    Ngày tạo: {formatDate(selectedQuiz?.createdAt)}
                  </Text>

                  {/* Mô tả */}
                  {selectedQuiz?.description && (
                    <View style={{ marginVertical: SPACING.MEDIUM }}>
                      <Text style={styles.sectionTitle}>Mô tả:</Text>
                      <Text style={styles.quizDescription}>
                        {selectedQuiz.description}
                      </Text>
                    </View>
                  )}

                  {/* Nhận xét AI */}
                  {selectedQuiz?.commentAI && (
                    <View style={styles.commentAIContainer}>
                      <Text style={styles.sectionTitle}>Nhận xét AI:</Text>
                      <Text style={styles.commentAIText}>
                        {selectedQuiz.commentAI}
                      </Text>
                    </View>
                  )}

                  {/* Danh sách câu hỏi */}
                  {selectedQuiz?.questions?.length > 0 && (
                    <View style={styles.questionsList}>
                      <Text style={styles.sectionTitle}>Câu hỏi:</Text>
                      {selectedQuiz.questions.map((q, index) => {
                        const question = q.questionId; // questionId đã được populate
                        if (!question) return null;
                        return (
                          <View key={index} style={styles.questionItem}>
                            <Text style={styles.questionTitle}>
                              {index + 1}. {question.content}
                            </Text>
                            {question.options?.map((opt, idx) => {
                              const isSelected = q.answers?.includes(opt);
                              return (
                                <Text
                                  key={idx}
                                  style={[
                                    styles.optionText,
                                    isSelected && styles.selectedOptionText,
                                  ]}
                                >
                                  • {opt}
                                  {isSelected && " (Đã chọn)"}
                                </Text>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>

                {/* Button đóng */}
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setQuizModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { paddingBottom: SPACING.XLARGE },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: SPACING.MEDIUM,
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  profileHeader: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: SPACING.XLARGE,
    paddingBottom: SPACING.LARGE,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: SPACING.LARGE,
  },
  avatarContainer: { position: "relative", marginBottom: SPACING.MEDIUM },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.WHITE,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.SECONDARY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  username: {
    fontSize: FONTS.XLARGE,
    fontWeight: "bold",
    color: COLORS.WHITE,
    marginBottom: SPACING.TINY,
  },
  userRole: { fontSize: FONTS.REGULAR, color: "rgba(255,255,255,0.9)" },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.LARGE,
    marginHorizontal: SPACING.MEDIUM,
    marginBottom: SPACING.LARGE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.LARGE,
    gap: SPACING.SMALL,
  },
  cardTitle: { fontSize: FONTS.LARGE, fontWeight: "bold", color: COLORS.TEXT },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.MEDIUM,
    paddingBottom: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoContent: { flex: 1, marginLeft: SPACING.MEDIUM },
  infoLabel: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginBottom: SPACING.TINY,
  },
  infoValue: { fontSize: FONTS.REGULAR, color: COLORS.TEXT, fontWeight: "500" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.LARGE,
    borderRadius: 12,
    marginTop: SPACING.SMALL,
    gap: SPACING.SMALL,
  },
  editButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  section: { marginBottom: SPACING.LARGE, paddingHorizontal: SPACING.MEDIUM },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.MEDIUM,
    gap: SPACING.SMALL,
  },
  sectionTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: SPACING.LARGE,
  },
  noDataText: {
    marginTop: SPACING.SMALL,
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    textAlign: "center",
  },
  quizScroll: { marginTop: SPACING.SMALL },
  quizCard: {
    width: 140,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.MEDIUM,
    marginRight: SPACING.SMALL,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quizTitle: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: SPACING.TINY,
    marginBottom: SPACING.TINY,
  },
  quizDate: { fontSize: FONTS.SMALL, color: COLORS.GRAY },
  quizDescription: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    marginVertical: SPACING.MEDIUM,
    lineHeight: 20,
  },
  questionsList: { marginTop: SPACING.MEDIUM },
  questionItem: {
    backgroundColor: "#F9F9F9",
    padding: SPACING.SMALL,
    borderRadius: 8,
    marginBottom: SPACING.SMALL,
  },
  // NEW: Style for question titles (avoid centering from quizTitle)
  questionTitle: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    marginBottom: SPACING.SMALL,
    color: COLORS.TEXT,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.SMALL,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EAF0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIconContainer: { backgroundColor: "#FFEAEA" },
  settingText: { fontSize: FONTS.REGULAR, color: COLORS.TEXT },
  logoutText: { color: COLORS.ERROR },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: SPACING.LARGE, // thêm khoảng padding để modal không chạm viền
},
modalContainer: {
  backgroundColor: COLORS.WHITE,
  borderRadius: 16,
  width: "90%",
  maxHeight: "95%", // tăng chiều cao tối đa gần full màn hình
  padding: 0,
},
modalScroll: {
  flexGrow: 1, // cho ScrollView chiếm đủ height
  padding: SPACING.LARGE,
},
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  modalCloseButton: {
    padding: SPACING.SMALL,
  },
  modalScroll: {
    flex: 1,
    padding: SPACING.LARGE,
  },
  inputGroup: {
    marginBottom: SPACING.LARGE,
  },
  inputLabel: {
    fontSize: FONTS.REGULAR,
    fontWeight: "600",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: SPACING.MEDIUM,
    fontSize: FONTS.REGULAR,
    backgroundColor: "#F9F9F9",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#F9F9F9",
  },
  picker: {
    width: "100%",
    height: 50,
    color: COLORS.TEXT,
  },
  modalButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: SPACING.MEDIUM,
    alignItems: "center",
    margin: SPACING.LARGE,
  },
  modalButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  editModalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.LARGE,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  editModalTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  editModalClose: { padding: SPACING.SMALL },
  editModalBody: { padding: SPACING.LARGE },
  editInputGroup: { marginBottom: SPACING.MEDIUM },
  editInputLabel: {
    fontSize: FONTS.REGULAR,
    fontWeight: "600",
    color: COLORS.TEXT,
    marginBottom: SPACING.TINY,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: SPACING.MEDIUM,
    backgroundColor: "#FAFAFA",
    fontSize: FONTS.REGULAR,
  },
  editPickerContainer: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },
  editPicker: { width: "100%", height: 50, color: COLORS.TEXT },
  editModalButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: SPACING.MEDIUM,
    alignItems: "center",
    margin: SPACING.LARGE,
  },
  editModalButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.TINY,
  },
  genderOption: {
    flex: 1,
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    marginHorizontal: SPACING.TINY,
  },
  genderOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  genderOptionText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    fontWeight: "500",
  },
  genderOptionTextSelected: {
    color: COLORS.WHITE,
    fontWeight: "bold",
  },
  infoLabel: {
    fontWeight: "bold",
    color: COLORS.DARK,
  },
  optionText: {
    color: COLORS.GRAY,
    marginLeft: 10,
    marginBottom: 4,
  },
  // NEW: Missing styles for quiz modal
  commentAIContainer: {
    marginVertical: SPACING.MEDIUM,
  },
  commentAIText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    lineHeight: 20,
    marginTop: SPACING.SMALL,
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
});
