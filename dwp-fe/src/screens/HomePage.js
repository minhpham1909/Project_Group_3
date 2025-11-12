import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl, // ✅ Thêm import RefreshControl
  Modal, // ✅ Thêm import Modal
  FlatList, // ✅ Thêm import FlatList cho danh sách thành phố
  ActivityIndicator, // ✅ Thêm import ActivityIndicator cho loading
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux"; // ✅ Thêm useDispatch nếu cần update Redux
import CutMate from "../../assets/CutMate.svg";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

const HomeScreen = ({ navigation }) => {
  // Redux state
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch(); // ✅ Thêm dispatch nếu cần update user trong Redux
  const role = user?.role;
  const userId = user?.id;
  const token = user?.token;

  // Local state
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [filterPrice, setFilterPrice] = useState("lowToHigh");
  const [filterLocation, setFilterLocation] = useState("All");
  const [filterSearch, setFilterSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false); // ✅ Thêm state cho refresh

  // ✅ Thêm state cho modal địa chỉ
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [updatingAddress, setUpdatingAddress] = useState(false); // Loading khi update

  // Cities list
  const cities = [
    "Hà Nội",
    "TP. Hồ Chí Minh",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "Nha Trang",
    "Đà Lạt",
  ];

  // Fetch all stores
  const getAllStore = async () => {
    try {
      const response = await axios.get(`${API_ROOT}/store/stores`);
      setStores(response.data || []);
      setFilteredStores(response.data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  // ✅ Hoàn thiện hàm getUser để fetch và update user data
  const getUser = async () => {
    // if (!userId || !token) return;
    try {
      const response = await axios.get(`${API_ROOT}/user/${userId}`);
console.log("user: ",response.data);

      if (response.status === 200 && response.data) {
        setIsFirstLogin(response.data.isFirstLogin);
        console.log("Updated user data:", response.data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    // getAllStore();
    getUser();
  }, []);

  // Fetch notifications / orders based on role
  const fetchNotifications = async () => {
    if (!user || !role) return;

    try {
      let response;

      if (role === 1) {
        // Customer
        response = await axios.get(
          `${API_ROOT}/service-orders/getNotification/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (role === 2) {
        // Supplier / Store owner
        response = await axios.get(`${API_ROOT}/service-orders`, {
          params: { userId, role },
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Check response
      if (response?.data?.orders && Array.isArray(response.data.orders)) {
        const orders = response.data.orders;
        const pending = orders.filter((o) => o.status === "Pending").length;
        setPendingCount(pending);
      } else {
        setPendingCount(0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // ✅ Hàm update địa chỉ người dùng
  const updateUserAddress = async () => {
    if (!selectedCity || !userAddress.trim()) {
      alert("Vui lòng chọn thành phố và nhập địa chỉ cụ thể.");
      return;
    }

    setUpdatingAddress(true);
    try {
      const fullAddress = `${userAddress}, ${selectedCity}`;
      const response = await axios.put(
        `${API_ROOT}/user/update-address/${userId}`, // Giả sử endpoint này tồn tại, điều chỉnh nếu cần
        { address: fullAddress, isFirstLogin: false }, // Update cả isFirstLogin
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Update Redux nếu cần (giả sử có action updateUser)
        // dispatch(updateUser({ ...user, address: fullAddress, isFirstLogin: false }));
        setShowAddressModal(false);
        alert("Địa chỉ đã được cập nhật thành công!");
        // Fetch lại user để sync state
        await getUser();
      }
    } catch (error) {
      console.error("Error updating address:", error);
      alert("Có lỗi xảy ra khi cập nhật địa chỉ. Vui lòng thử lại.");
    } finally {
      setUpdatingAddress(false);
    }
  };

  // ✅ Hàm refresh toàn bộ
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getAllStore(), fetchNotifications(), getUser()]);
    setRefreshing(false);
  };

  // Initial fetch
  useEffect(() => {
    getAllStore();
    if (userId && token) {
      getUser(); // ✅ Gọi getUser để fetch dữ liệu user mới nhất
    }
  }, [userId, token]);

  // Fetch notifications when user is ready
  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // ✅ Kiểm tra isFirstLogin và hiển thị modal (sau khi fetch user)
  useEffect(() => {
    if (isFirstLogin) {
      setShowAddressModal(true);
    }
  }, [isFirstLogin]);

  // Filter and sort stores
  useEffect(() => {
    let filtered = [...stores];

    // Search filter
    if (filterSearch.trim()) {
      filtered = filtered
        .map((store) => {
          const matchingServices =
            store.services?.filter((s) =>
              s.service_name.toLowerCase().includes(filterSearch.toLowerCase())
            ) || [];
          return matchingServices.length > 0
            ? { ...store, services: matchingServices }
            : null;
        })
        .filter(Boolean);
    }

    // Location filter
    if (filterLocation !== "All") {
      filtered = filtered.filter((store) =>
        store.address?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    // Price sort
    filtered.forEach((store) => {
      store.services?.sort((a, b) =>
        filterPrice === "lowToHigh"
          ? a.service_price - b.service_price
          : b.service_price - a.service_price
      );
    });

    setFilteredStores(filtered);
  }, [filterSearch, filterPrice, filterLocation, stores]);

  // Navigate to service detail
  const openServiceDetail = (serviceId) => {
    navigation.navigate("ProductDetail", { serviceId });
  };

  // Render item thành phố
  const renderCityItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.modalItem,
        selectedCity === item && styles.selectedModalItem,
      ]}
      onPress={() => setSelectedCity(item)}
    >
      <Text
        style={[
          styles.modalItemText,
          selectedCity === item && styles.selectedModalItemText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          // ✅ Thêm RefreshControl
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]} // Màu spinner
            tintColor={COLORS.PRIMARY} // iOS tint
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <CutMate width={160} height={80} style={{ marginTop: -32 }} />
          </View>

          {/* Search and Icons */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={COLORS.GRAY}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm dịch vụ..."
                placeholderTextColor={COLORS.GRAY}
                value={filterSearch}
                onChangeText={setFilterSearch}
              />
              {filterSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => setFilterSearch("")}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.GRAY} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.iconContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("RequestOrder")}
              >
                <Ionicons name="add-circle" size={28} color={COLORS.PRIMARY} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  navigation.navigate(
                    role === 1 ? "Notification" : "SupplierNotification"
                  )
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color={COLORS.TEXT}
                />
                {pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Price Filters */}
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Sắp xếp theo giá:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterPrice === "lowToHigh" && styles.selectedFilter,
              ]}
              onPress={() => setFilterPrice("lowToHigh")}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={filterPrice === "lowToHigh" ? COLORS.WHITE : COLORS.GRAY}
              />
              <Text
                style={[
                  styles.filterText,
                  filterPrice === "lowToHigh" && styles.selectedFilterText,
                ]}
              >
                Tăng dần
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterPrice === "highToLow" && styles.selectedFilter,
              ]}
              onPress={() => setFilterPrice("highToLow")}
            >
              <Ionicons
                name="arrow-down"
                size={16}
                color={filterPrice === "highToLow" ? COLORS.WHITE : COLORS.GRAY}
              />
              <Text
                style={[
                  styles.filterText,
                  filterPrice === "highToLow" && styles.selectedFilterText,
                ]}
              >
                Giảm dần
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dịch vụ nổi bật</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredStores.reduce(
                (count, store) => count + (store.services?.length || 0),
                0
              )}{" "}
              dịch vụ
            </Text>
          </View>

          {filteredStores.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={COLORS.GRAY} />
              <Text style={styles.emptyText}>Không tìm thấy dịch vụ nào</Text>
              <Text style={styles.emptySubtext}>
                Thử tìm kiếm với từ khóa khác
              </Text>
            </View>
          ) : (
            <View style={styles.productRow}>
              {filteredStores.map((store) =>
                store.services?.map((service) => (
                  <TouchableOpacity
                    style={styles.productContainer}
                    key={service._id}
                    onPress={() => openServiceDetail(service._id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{
                          uri:
                            store.image?.[0] ||
                            "https://via.placeholder.com/200",
                        }}
                        style={styles.productImage}
                      />
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>
                          {service.service_price?.toLocaleString("vi-VN")} VND
                        </Text>
                      </View>
                    </View>
                    <View style={styles.productDetails}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {service.service_name}
                      </Text>
                      <View style={styles.storeInfo}>
                        <Ionicons
                          name="storefront-outline"
                          size={14}
                          color={COLORS.GRAY}
                        />
                        <Text style={styles.storeName} numberOfLines={1}>
                          {store.nameShop}
                        </Text>
                      </View>
                      <View style={styles.locationInfo}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={COLORS.GRAY}
                        />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {store.address}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* ... Các section blog, tips giữ nguyên ... */}
      </ScrollView>

      {/* ✅ Modal chọn địa chỉ kiểu bottom sheet */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedCity ? (
              <Text style={styles.modalTitle}>
                Nhập địa chỉ tại {selectedCity}
              </Text>
            ) : (
              <Text style={styles.modalTitle}>Chọn thành phố</Text>
            )}
            {!selectedCity ? (
              <FlatList
                data={cities}
                keyExtractor={(item) => item}
                renderItem={renderCityItem}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <ScrollView
                style={styles.addressScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalSubtitle}>
                  Nhập địa chỉ chi tiết (số nhà, đường, phường...)
                </Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Ví dụ: 123 Đường ABC, Quận 1"
                  placeholderTextColor={COLORS.GRAY}
                  value={userAddress}
                  onChangeText={setUserAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </ScrollView>
            )}
            <View style={styles.modalBottom}>
              {selectedCity ? (
                <View style={styles.addressButtons}>
                  <TouchableOpacity
                    style={styles.changeCityButton}
                    onPress={() => {
                      setSelectedCity("");
                      setUserAddress("");
                    }}
                  >
                    <Text style={styles.changeCityText}>
                      Thay đổi thành phố
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (!userAddress.trim() || updatingAddress) &&
                        styles.confirmButtonDisabled,
                    ]}
                    onPress={updateUserAddress}
                    disabled={!userAddress.trim() || updatingAddress}
                  >
                    {updatingAddress ? (
                      <ActivityIndicator color={COLORS.WHITE} />
                    ) : (
                      <Text style={styles.confirmButtonText}>Xác nhận</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAddressModal(false)}
                >
                  <Text style={styles.modalCloseText}>Đóng</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Blogs và styles giữ nguyên, thêm styles cho modal
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollView: { padding: SPACING.MEDIUM, paddingBottom: SPACING.XLARGE },
  header: { marginBottom: SPACING.LARGE },
  logoContainer: { alignItems: "center" },
  searchSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.SMALL,
    marginTop: "40px",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: SPACING.MEDIUM,
    height: 48,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: SPACING.SMALL },
  searchInput: {
    flex: 1,
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    paddingVertical: 0,
  },
  clearButton: { padding: SPACING.TINY },
  iconContainer: { flexDirection: "row", gap: SPACING.SMALL },
  iconButton: {
    position: "relative",
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.WHITE, fontSize: 10, fontWeight: "bold" },
  filters: { marginBottom: SPACING.LARGE },
  filterLabel: {
    fontSize: FONTS.REGULAR,
    fontWeight: "600",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
  },
  filterButtons: { flexDirection: "row", gap: SPACING.SMALL },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: SPACING.TINY,
  },
  selectedFilter: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterText: { fontSize: FONTS.SMALL, color: COLORS.GRAY, fontWeight: "500" },
  selectedFilterText: { color: COLORS.WHITE, fontWeight: "bold" },
  categorySection: { marginTop: SPACING.MEDIUM, marginBottom: SPACING.LARGE },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.MEDIUM,
  },
  sectionTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  sectionSubtitle: { fontSize: FONTS.SMALL, color: COLORS.GRAY },
  productRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: SPACING.SMALL,
  },
  productContainer: {
    width: "48%",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: { position: "relative", width: "100%", height: 140 },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  priceBadge: {
    position: "absolute",
    top: SPACING.SMALL,
    right: SPACING.SMALL,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  priceBadgeText: {
    color: COLORS.WHITE,
    fontSize: FONTS.TINY,
    fontWeight: "bold",
  },
  productDetails: { padding: SPACING.SMALL },
  productTitle: {
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.TINY,
    minHeight: 40,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.TINY,
    gap: 4,
  },
  storeName: { fontSize: FONTS.SMALL, color: COLORS.TEXT, flex: 1 },
  locationInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: FONTS.SMALL, color: COLORS.GRAY, flex: 1 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.XLARGE * 2,
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
  },

  // ✅ Styles cho Modal kiểu bottom sheet
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: "70%",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedModalItem: {
    backgroundColor: "#FAFAFA",
  },
  modalItemText: {
    fontSize: 16,
    color: "#000000",
  },
  selectedModalItemText: {
    color: "#e91e63",
    fontWeight: "500",
  },
  addressScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  addressInput: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000000",
    textAlignVertical: "top",
    minHeight: 100,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modalBottom: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 16,
  },
  addressButtons: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  changeCityButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
  },
  changeCityText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#e91e63",
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#e91e63",
    fontWeight: "500",
  },
});

export default HomeScreen;
