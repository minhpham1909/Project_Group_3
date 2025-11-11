import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { COLORS, FONTS, SPACING, API_ROOT } from "../utils/constant";

export default function CheckList({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API để lấy danh sách request pending
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_ROOT}/user/request-list`);
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Xử lý khi admin chấp thuận hoặc từ chối
  const handleApprove = async (userId, approved) => {
    try {
      await axios.put(`${API_ROOT}/user/approve-request/${userId}`, {
        approved,
      });
      Alert.alert(
        "Thành công",
        approved ? "Đã phê duyệt yêu cầu." : "Đã từ chối yêu cầu."
      );
      fetchRequests(); // load lại danh sách
    } catch (error) {
      console.error("Error approving request:", error);
      Alert.alert("Lỗi", "Không thể xử lý yêu cầu.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="people-circle" size={28} color={COLORS.WHITE} />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              Yêu cầu trở thành nhà cung cấp
            </Text>
            <Text style={styles.headerSubtitle}>
              Quản lý yêu cầu người dùng
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color={COLORS.GRAY} />
            <Text style={styles.emptyTitle}>Không có yêu cầu nào đang chờ</Text>
            <Text style={styles.emptyText}>Tất cả yêu cầu đã được xử lý.</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {requests.map((item) => (
              <View key={item._id} style={styles.card}>
                <View style={styles.userInfo}>
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color={COLORS.PRIMARY}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.userName}>{item.profile.name}</Text>
                    <Text style={styles.userEmail}>{item.account.email}</Text>
                    <Text style={styles.userPhone}>{item.profile.phone}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(item._id, true)}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.WHITE} />
                    <Text style={styles.buttonText}>Duyệt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleApprove(item._id, false)}
                  >
                    <Ionicons name="close" size={18} color={COLORS.WHITE} />
                    <Text style={styles.buttonText}>Từ chối</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.LARGE,
    paddingHorizontal: SPACING.LARGE,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MEDIUM,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: FONTS.SMALL,
    color: "rgba(255,255,255,0.9)",
  },
  container: {
    flex: 1,
    padding: SPACING.MEDIUM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.GRAY,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.LARGE,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginTop: 12,
  },
  emptyText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    textAlign: "center",
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    marginBottom: 16,
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  userEmail: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  userPhone: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  approveButton: {
    backgroundColor: COLORS.SUCCESS || "#4CAF50",
  },
  rejectButton: {
    backgroundColor: COLORS.ERROR || "#E53935",
  },
  buttonText: {
    color: COLORS.WHITE,
    marginLeft: 6,
    fontWeight: "600",
  },
});
