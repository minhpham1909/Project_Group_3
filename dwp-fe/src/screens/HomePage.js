import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import CutMate from "../../assets/CutMate.svg";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  // Redux state
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
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
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [step, setStep] = useState(1);

  const [userData, setUserData] = useState(null);

  // Cities list with emojis
  const cities = [
    { name: "Hà Nội", icon: "🏛️" },
    { name: "TP. Hồ Chí Minh", icon: "🌆" },
    { name: "Đà Nẵng", icon: "🌊" },
    { name: "Hải Phòng", icon: "⚓" },
    { name: "Cần Thơ", icon: "🌾" },
    { name: "Nha Trang", icon: "🏖️" },
    { name: "Đà Lạt", icon: "🌸" },
  ];

  const districts = {
    "Hà Nội": [
      "Ba Đình",
      "Cầu Giấy",
      "Hoàn Kiếm",
      "Đống Đa",
      "Hai Bà Trưng",
      "Thanh Xuân",
    ],
    "TP. Hồ Chí Minh": [
      "Quận 1",
      "Quận 3",
      "Bình Thạnh",
      "Thủ Đức",
      "Phú Nhuận",
      "Tân Bình",
    ],
    "Đà Nẵng": [
      "Hải Châu",
      "Sơn Trà",
      "Ngũ Hành Sơn",
      "Thanh Khê",
      "Liên Chiểu",
    ],
    "Hải Phòng": ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An"],
    "Cần Thơ": ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn"],
    "Nha Trang": ["Vĩnh Hải", "Vĩnh Hòa", "Phước Hải", "Phước Long"],
    "Đà Lạt": ["Phường 1", "Phường 2", "Phường 3", "Phường 4"],
  };

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

  // Get user data
  const getUser = async () => {
    try {
      const response = await axios.get(`${API_ROOT}/user/${userId}`);
      console.log("user: ", response.data);

      if (response.status === 200 && response.data) {
        setIsFirstLogin(response.data.isFirstLogin);
        setUserData(response.data);
        console.log("Updated user data:", response.data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user || !role) return;

    try {
      let response;

      if (role === 1) {
        response = await axios.get(
          `${API_ROOT}/service-orders/getNotification/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (role === 2) {
        response = await axios.get(`${API_ROOT}/service-orders`, {
          params: { userId, role },
          headers: { Authorization: `Bearer ${token}` },
        });
      }

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

  // Update user address
  const updateUserAddress = async () => {
    if (!selectedCity || !selectedDistrict) {
      alert("Vui lòng chọn đầy đủ thành phố và quận/huyện.");
      return;
    }

    setUpdatingAddress(true);
    try {
      const fullAddress = `${selectedDistrict}, ${selectedCity}`;
      let address;
      const payload = {
        profile: {
          name: userData?.profile?.name,
          phone: userData?.profile?.phone,
          gender: userData?.profile?.gender,
          address: fullAddress,
        },
        ...(fullAddress ? { isFirstLogin: false } : {}),
      };

      const response = await axios.put(`${API_ROOT}/user/${userId}`, payload);

      if (response.status === 200) {
        setShowAddressModal(false);
        setStep(1);
        setSelectedCity("");
        setSelectedDistrict("");
        alert("Địa chỉ đã được cập nhật thành công!");
        await getUser();
      }
    } catch (error) {
      console.error("Error updating address:", error);
      alert("Có lỗi xảy ra khi cập nhật địa chỉ. Vui lòng thử lại.");
    } finally {
      setUpdatingAddress(false);
    }
  };

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getAllStore(), fetchNotifications(), getUser()]);
    setRefreshing(false);
  };

  // Initial fetch
  useEffect(() => {
    getAllStore();
    if (userId && token) {
      getUser();
    }
  }, [userId, token]);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (isFirstLogin) {
      setShowAddressModal(true);
    }
  }, [isFirstLogin]);

  // Filter and sort stores
  useEffect(() => {
    let filtered = [...stores];

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

    if (filterLocation !== "All") {
      filtered = filtered.filter((store) =>
        store.address?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    filtered.forEach((store) => {
      store.services?.sort((a, b) =>
        filterPrice === "lowToHigh"
          ? a.service_price - b.service_price
          : b.service_price - a.service_price
      );
    });

    setFilteredStores(filtered);
  }, [filterSearch, filterPrice, filterLocation, stores]);

  const openServiceDetail = (serviceId) => {
    navigation.navigate("ProductDetail", { serviceId });
  };

  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    setStep(2);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedDistrict("");
  };

  const handleConfirm = () => {
    updateUserAddress();
  };

  const handleCloseModal = () => {
    if (isFirstLogin) {
      Alert.alert("Xác nhận", "Bạn có chắc muốn bỏ qua bước chọn địa điểm?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ qua",
          onPress: () => {
            setShowAddressModal(false);
            setStep(1);
            setSelectedCity("");
            setSelectedDistrict("");
          },
        },
      ]);
    } else {
      setShowAddressModal(false);
      setStep(1);
      setSelectedCity("");
      setSelectedDistrict("");
    }
  };

  // Render city item
  const renderCityItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.cityCard,
        selectedCity === item.name && styles.cityCardSelected,
      ]}
      onPress={() => handleCitySelect(item.name)}
      activeOpacity={0.7}
    >
      <View style={styles.cityCardContent}>
        <Text style={styles.cityIcon}>{item.icon}</Text>
        <Text
          style={[
            styles.cityName,
            selectedCity === item.name && styles.cityNameSelected,
          ]}
        >
          {item.name}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={selectedCity === item.name ? COLORS.PRIMARY : "#999"}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <CutMate width={160} height={80} style={{ marginTop: -32 }} />
          </View>

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
            <>
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

              {/* New Advice Text */}
              {/* Smart Advice Card */}
              <TouchableOpacity
                style={styles.adviceCard}
                onPress={() => navigation.navigate("ChatBot")}
              >
                <Ionicons
                  name="bulb-outline"
                  size={24}
                  color={COLORS.PRIMARY}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.adviceCardText}>
                  Băn khoăn không biết chọn gì?{" "}
                  <Text style={styles.adviceCardHighlight}>CutMate Brain</Text>{" "}
                  sẽ gợi ý cho bạn!
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Improved Modal */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.skipButton}
              >
                <Text style={styles.skipButtonText}>Bỏ qua</Text>
              </TouchableOpacity>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalIconWrapper}>
                  <Ionicons name="location" size={24} color="#fff" />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>Chọn địa điểm của bạn</Text>
                  <Text style={styles.modalSubtitle}>
                    {step === 1 ? "Chọn thành phố" : "Chọn quận/huyện"}
                  </Text>
                </View>
                {!isFirstLogin && (
                  <TouchableOpacity
                    onPress={handleCloseModal}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress */}
              <View style={styles.progressContainer}>
                <View style={styles.stepIndicator}>
                  <View
                    style={[styles.stepCircle, step >= 1 && styles.stepActive]}
                  >
                    {step > 1 ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.stepNumber,
                          step >= 1 && styles.stepNumberActive,
                        ]}
                      >
                        1
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      step >= 1 && styles.stepLabelActive,
                    ]}
                  >
                    Thành phố
                  </Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: step === 1 ? "0%" : "100%" },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.stepIndicator}>
                  <View
                    style={[styles.stepCircle, step >= 2 && styles.stepActive]}
                  >
                    <Text
                      style={[
                        styles.stepNumber,
                        step >= 2 && styles.stepNumberActive,
                      ]}
                    >
                      2
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      step >= 2 && styles.stepLabelActive,
                    ]}
                  >
                    Khu vực
                  </Text>
                </View>
              </View>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              {step === 1 ? (
                <FlatList
                  data={cities}
                  keyExtractor={(item) => item.name}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  renderItem={renderCityItem}
                />
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.districtScrollContent}
                >
                  <View style={styles.districtContainer}>
                    <View style={styles.selectedCityBadge}>
                      <Ionicons
                        name="location"
                        size={16}
                        color={COLORS.PRIMARY}
                      />
                      <Text style={styles.selectedCityText}>
                        Đã chọn: {selectedCity}
                      </Text>
                    </View>

                    <View style={styles.districtGrid}>
                      {(districts[selectedCity] || []).map((district) => (
                        <TouchableOpacity
                          key={district}
                          style={[
                            styles.districtCard,
                            selectedDistrict === district &&
                              styles.districtCardSelected,
                          ]}
                          onPress={() => handleDistrictSelect(district)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.districtText,
                              selectedDistrict === district &&
                                styles.districtTextSelected,
                            ]}
                          >
                            {district}
                          </Text>
                          {selectedDistrict === district && (
                            <View style={styles.checkIcon}>
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color="#fff"
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              {step === 2 ? (
                <View style={styles.footerButtons}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                  >
                    <Ionicons name="chevron-back" size={20} color="#666" />
                    <Text style={styles.backButtonText}>Quay lại</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (!selectedDistrict || updatingAddress) &&
                        styles.confirmButtonDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={!selectedDistrict || updatingAddress}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>
                      {updatingAddress ? "Đang lưu..." : "Xác nhận"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                !isFirstLogin && (
                  <TouchableOpacity
                    style={styles.closeFooterButton}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.closeFooterButtonText}>Đóng</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollView: { padding: 4, paddingBottom: 4 },
  header: { marginBottom: SPACING.LARGE },
  logoContainer: { alignItems: "center" },
  searchSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: SPACING.SMALL,
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
  categorySection: { marginBottom: 4 },
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

  // Modal Styles - React Native
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    height: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  modalHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepIndicator: {
    alignItems: "center",
    gap: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  stepActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  stepLabelActive: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
  progressBarContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: -24,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },

  // Modal Content
  modalContent: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  cityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cityCardSelected: {
    backgroundColor: "#FFF5F7",
    borderColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.2,
  },
  cityCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cityIcon: {
    fontSize: 28,
  },
  cityName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cityNameSelected: {
    color: COLORS.PRIMARY,
    fontWeight: "bold",
  },

  // District
  districtScrollContent: {
    paddingBottom: 24,
  },
  districtContainer: {
    padding: 16,
  },
  selectedCityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE0E8",
  },
  selectedCityText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  districtGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  districtCard: {
    width: (width - 56) / 2,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    position: "relative",
  },
  districtCardSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  districtText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  districtTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  checkIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },

  // Modal Footer
  modalFooter: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 16,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: "#CCC",
    shadowOpacity: 0,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeFooterButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  closeFooterButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.PRIMARY,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end", // <-- Đẩy nút "Qua" sang cuối
    paddingVertical: 4,
  },
  skipButtonText: {
    color: "#1877F2",
    textDecorationLine: "underline",
    fontWeight: "600",
    fontSize: 14,
  },
  adviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF", // nhẹ nhàng, hiện đại
    padding: SPACING.MEDIUM,
    borderRadius: 16,
    // marginTop: SPACING.MEDIUM,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  adviceCardText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    flex: 1,
    flexWrap: "wrap",
  },
  adviceCardHighlight: {
    fontWeight: "bold",
    color: COLORS.PRIMARY,
  },
});

export default HomeScreen;
