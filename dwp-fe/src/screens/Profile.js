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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import axios from "axios";
import { logout } from "../redux/authSlice";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";
import { useFocusEffect } from "@react-navigation/native";

export default function Profile({ navigation }) {
  const userName = useSelector((state) => state.auth.user?.name);
  const userId = useSelector((state) => state.auth.user?.id);
  const dispatch = useDispatch();
  const [userDetails, setUserDetails] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [modalVisible, setModalVisible] = useState(false); // Để kiểm soát trạng thái của modal
  const [isRequesting, setIsRequesting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!userId) return; // Nếu không có userId thì không gọi API

      userInfoDetail();
      getQuizByUserId();
    }, [userId])
  );

  const userInfoDetail = async () => {
    try {
      const res = await axios.get(`${API_ROOT}/user/${userId}`);
      setUserDetails(res.data);
      console.log("User details fetched:", res.data);
    } catch (error) {
      console.log("Error fetching user details:", error);
    }
  };

  const getQuizByUserId = async () => {
    try {
      const res = await axios.get(`${API_ROOT}/quiz/getQuizByUserId/${userId}`);
      setQuizData(res.data);
      console.log("Quizzes fetched:", res.data);
    } catch (error) {
      console.log("Error fetching quizzes:", error);
    }
  };

  const getQuizById = async (quizId) => {
    try {
      const res = await axios.get(`${API_ROOT}/quiz/${quizId}`);
      setSelectedQuiz(res.data);
      console.log("Quiz details fetched:", res.data);
      setModalVisible(true); // Hiển thị modal khi lấy thông tin quiz thành công
    } catch (error) {
      console.log("Error fetching quiz details:", error);
    }
  };

  const handleLogout = () => {
    const confirmLogout = async () => {
      try {
        await axios.post(`${API_ROOT}/auth/sign-out`);
      } catch (error) {
        console.log("Logout Error:", error.response || error);
      } finally {
        dispatch(logout()); // reset state dù API lỗi
      }
    };

    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: confirmLogout },
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
          // ⚠️ Không thể khai báo trực tiếp async ở đây, nên dùng hàm riêng
          onPress: () => sendSupplierRequest(),
        },
      ]
    );
  };

  // 🧩 Viết hàm async riêng để gửi yêu cầu
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
      await userInfoDetail();
      console.log("Request supplier response:", res.data);
    } catch (error) {
      console.log("Error sending supplier request:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message ||
          "Không thể gửi yêu cầu. Vui lòng thử lại sau."
      );
    } finally {
      setIsRequesting(false);
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

  // Show loading state only when userId exists but userDetails is still loading
  const isLoading = userId && !userDetails;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : (
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
                  uri:
                    userDetails?.profile?.avatar ||
                    "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
                }}
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={() => {
                  /* Handle edit avatar */
                }}
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
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                /* Handle edit action */
              }}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.WHITE} />
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

          {/* Quiz History Section */}
          {/* <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.sectionTitle}>Lịch sử Quiz</Text>
            </View>
            {quizData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-outline"
                  size={64}
                  color={COLORS.GRAY}
                />
                <Text style={styles.emptyText}>Chưa có lịch sử quiz nào</Text>
                <Text style={styles.emptySubtext}>
                  Bắt đầu làm quiz để xem lịch sử của bạn
                </Text>
              </View>
            ) : (
              quizData.map((quiz, index) => (
                <TouchableOpacity
                  key={quiz._id || index}
                  style={styles.quizCard}
                  onPress={() => getQuizById(quiz._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.quizHeader}>
                    <View style={styles.quizIconContainer}>
                      <Ionicons
                        name="document-text"
                        size={24}
                        color={COLORS.PRIMARY}
                      />
                    </View>
                    <View style={styles.quizInfo}>
                      <Text style={styles.quizTitle} numberOfLines={1}>
                        {quiz.title || "Quiz không có tiêu đề"}
                      </Text>
                      <Text style={styles.quizDescription} numberOfLines={2}>
                        {quiz.description || "Không có mô tả"}
                      </Text>
                      <View style={styles.quizMeta}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={COLORS.GRAY}
                        />
                        <Text style={styles.quizDate}>
                          {formatDate(quiz.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={COLORS.GRAY}
                  />
                </TouchableOpacity>
              ))
            )}
          </View> */}

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
              onPress={() => {
                /* Handle change password */
              }}
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
              <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
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
              <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY} />
            </TouchableOpacity>
          </View>

          {/* Modal for quiz details */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={COLORS.GRAY} />
                </TouchableOpacity>
                <View style={styles.modalIconContainer}>
                  <Ionicons
                    name="document-text"
                    size={48}
                    color={COLORS.PRIMARY}
                  />
                </View>
                <Text style={styles.modalTitle}>
                  {selectedQuiz?.title || "Chi tiết Quiz"}
                </Text>
                <View style={styles.modalContentContainer}>
                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={COLORS.GRAY}
                    />
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Mô tả</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedQuiz?.description || "Không có mô tả"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={COLORS.GRAY}
                    />
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Ngày tạo</Text>
                      <Text style={styles.modalInfoValue}>
                        {formatDate(selectedQuiz?.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons
                      name="help-circle-outline"
                      size={20}
                      color={COLORS.GRAY}
                    />
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>Số câu hỏi</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedQuiz?.questions?.length || 0} câu hỏi
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    paddingBottom: SPACING.XLARGE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
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
  avatarContainer: {
    position: "relative",
    marginBottom: SPACING.MEDIUM,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.WHITE,
    backgroundColor: COLORS.WHITE,
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
  userRole: {
    fontSize: FONTS.REGULAR,
    color: "rgba(255, 255, 255, 0.9)",
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.LARGE,
    marginHorizontal: SPACING.MEDIUM,
    marginBottom: SPACING.LARGE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.LARGE,
    gap: SPACING.SMALL,
  },
  cardTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.MEDIUM,
    paddingBottom: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.MEDIUM,
  },
  infoLabel: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginBottom: SPACING.TINY,
  },
  infoValue: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    fontWeight: "500",
  },
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
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  section: {
    marginBottom: SPACING.LARGE,
    paddingHorizontal: SPACING.MEDIUM,
  },
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.XLARGE * 2,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    paddingHorizontal: SPACING.LARGE,
  },
  emptyText: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginTop: SPACING.MEDIUM,
  },
  emptySubtext: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginTop: SPACING.TINY,
    textAlign: "center",
  },
  quizCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quizHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  quizIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.MEDIUM,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.TINY,
  },
  quizDescription: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginBottom: SPACING.TINY,
    lineHeight: 18,
  },
  quizMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: SPACING.TINY,
  },
  quizDate: {
    fontSize: FONTS.TINY,
    color: COLORS.GRAY,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.SMALL,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.MEDIUM,
  },
  logoutIconContainer: {
    backgroundColor: `${COLORS.ERROR}15`,
  },
  settingText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    fontWeight: "500",
  },
  logoutText: {
    color: COLORS.ERROR,
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
  modalCloseButton: {
    position: "absolute",
    top: SPACING.MEDIUM,
    right: SPACING.MEDIUM,
    padding: SPACING.SMALL,
    zIndex: 1,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.MEDIUM,
  },
  modalTitle: {
    fontSize: FONTS.XLARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.LARGE,
    textAlign: "center",
  },
  modalContentContainer: {
    width: "100%",
    marginBottom: SPACING.LARGE,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.MEDIUM,
    paddingBottom: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalInfoContent: {
    flex: 1,
    marginLeft: SPACING.MEDIUM,
  },
  modalInfoLabel: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginBottom: SPACING.TINY,
  },
  modalInfoValue: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    fontWeight: "500",
  },
  modalButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.XLARGE,
    borderRadius: 12,
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
