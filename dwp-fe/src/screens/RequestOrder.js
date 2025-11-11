import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

export default function RequestOrder({ navigation }) {
  const [selectedValue, setSelectedValue] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const userName = useSelector((state) => state.auth.user?.name);
  const userId = useSelector((state) => state.auth.user?.id);

  // Hàm lấy danh sách cửa hàng
  const getAllStore = async () => {
    try {
      setStoresLoading(true);
      const response = await axios.get(`${API_ROOT}/store/stores`);
      console.log("Stores data:", response.data); // Log để kiểm tra dữ liệu
      setStores(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedStore(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching store data:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách cửa hàng. Vui lòng thử lại.");
    } finally {
      setStoresLoading(false);
    }
  };

  const getServicesForStore = (storeId) => {
    const store = stores.find((s) => s._id === storeId); // Tìm cửa hàng theo ID
    if (store) {
      console.log("Services for store:", store.services); // Log để kiểm tra dịch vụ
      setServices(store.services || []); // Cập nhật dịch vụ của cửa hàng đã chọn
    }
  };

  useEffect(() => {
    getAllStore();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      getServicesForStore(selectedStore);
      setSelectedService(""); // Reset service when store changes
    }
  }, [selectedStore, stores]);

  // Hàm xử lý thay đổi thời gian
  const onTimeChange = (event, date) => {
    if (event.type === "set" || Platform.OS === "android") {
      // Android không có event.type rõ ràng
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      setSelectedTime(timeString);
    }
    if (Platform.OS === "ios") {
      setShowTimePicker(false); // Auto đóng modal trên iOS sau khi chọn
    }
  };

  // Hàm xử lý khi người dùng chọn ngày
  const onDayPress = (day) => {
    setSelectedDate(day.dateString); // Lưu ngày đã chọn
    setShowCalendar(false);
    setShowTimePicker(true); // Hiển thị bộ chọn thời gian
  };

  // Hàm xử lý khi người dùng chọn thời gian
  const showTimePickerHandler = () => {
    if (Platform.OS === "android") {
      DateTimePicker.open({
        value: selectedTime
          ? new Date(`2000-01-01T${selectedTime}`)
          : new Date(),
        mode: "time",
        is24Hour: true,
        onChange: onTimeChange,
      });
    } else {
      setShowTimePicker(true); // iOS thì dùng modal
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const createOrder = async () => {
    if (!selectedStore) {
      Alert.alert("Thông báo", "Vui lòng chọn cửa hàng");
      return;
    }

    if (!selectedService) {
      Alert.alert("Thông báo", "Vui lòng chọn dịch vụ");
      return;
    }

    if (!selectedDate) {
      Alert.alert("Thông báo", "Vui lòng chọn ngày đặt lịch");
      return;
    }

    if (!selectedTime) {
      Alert.alert("Thông báo", "Vui lòng chọn thời gian");
      return;
    }

    const selectedServiceDetails = services.find(
      (service) => service._id === selectedService
    );

    if (!selectedServiceDetails) {
      Alert.alert("Lỗi", "Không tìm thấy dịch vụ đã chọn");
      return;
    }

    const orderData = {
      storeId: selectedStore,
      services: [
        {
          serviceId: selectedService,
          service_name: selectedServiceDetails.service_name,
          service_price: selectedServiceDetails.service_price,
          slot_service: selectedServiceDetails.slot_service,
        },
      ],
      orderDate: `${selectedDate} ${selectedTime}:00`,
    };

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_ROOT}/service-orders/create-order/${userId}`,
        orderData
      );
      console.log("Order created successfully:", response.data);
      Alert.alert("Thành công", "Đặt lịch thành công!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("HomeScreen"),
        },
      ]);
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng!"
      );
    } finally {
      setLoading(false);
    }
  };

  if (storesLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải danh sách cửa hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch dịch vụ</Text>
        <View style={styles.headerRight}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.WHITE} />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressStep}>
            <View
              style={[
                styles.progressCircle,
                selectedStore && styles.progressCircleActive,
              ]}
            >
              <Text style={styles.progressCircleText}>1</Text>
            </View>
            <Text style={styles.progressLabel}>Cửa hàng</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View
              style={[
                styles.progressCircle,
                selectedService && styles.progressCircleActive,
              ]}
            >
              <Text style={styles.progressCircleText}>2</Text>
            </View>
            <Text style={styles.progressLabel}>Dịch vụ</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View
              style={[
                styles.progressCircle,
                selectedDate && styles.progressCircleActive,
              ]}
            >
              <Text style={styles.progressCircleText}>3</Text>
            </View>
            <Text style={styles.progressLabel}>Ngày giờ</Text>
          </View>
        </View>

        {/* Store Selection Card */}
        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => setShowStoreModal(true)}
        >
          <View style={styles.cardContent}>
            <Ionicons
              name="storefront-outline"
              size={28}
              color={COLORS.PRIMARY}
            />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Chọn cửa hàng</Text>
              <Text style={styles.cardSubtitle}>
                {selectedStore
                  ? stores.find((s) => s._id === selectedStore)?.nameShop ||
                    "Chưa chọn"
                  : "Chọn cửa hàng gần bạn"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.GRAY} />
          </View>
        </TouchableOpacity>

        {/* Service Selection Card */}
        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => setShowServiceModal(true)}
          disabled={!selectedStore}
        >
          <View style={styles.cardContent}>
            <Ionicons
              name="sparkles-outline"
              size={28}
              color={selectedStore ? COLORS.PRIMARY : COLORS.GRAY}
            />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Chọn dịch vụ</Text>
              <Text style={styles.cardSubtitle}>
                {selectedService
                  ? services.find((s) => s._id === selectedService)
                      ?.service_name || "Chưa chọn"
                  : selectedStore
                  ? "Chọn dịch vụ phù hợp"
                  : "Chọn cửa hàng trước"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.GRAY} />
          </View>
        </TouchableOpacity>

        {/* Date Time Selection Card */}
        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => setShowCalendar(true)}
          disabled={!selectedService}
        >
          <View style={styles.cardContent}>
            <Ionicons
              name="calendar-outline"
              size={28}
              color={selectedService ? COLORS.PRIMARY : COLORS.GRAY}
            />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Chọn ngày & giờ</Text>
              <Text style={styles.cardSubtitle}>
                {selectedDate && selectedTime
                  ? `${new Date(selectedDate).toLocaleDateString(
                      "vi-VN"
                    )} - ${selectedTime}`
                  : selectedService
                  ? "Chọn thời gian tiện lợi"
                  : "Chọn dịch vụ trước"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.GRAY} />
          </View>
        </TouchableOpacity>

        {/* Summary Card */}
        {selectedStore && selectedService && selectedDate && selectedTime && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Tóm tắt đặt lịch</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Cửa hàng:</Text>
              <Text style={styles.summaryValue}>
                {stores.find((s) => s._id === selectedStore)?.nameShop}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Dịch vụ:</Text>
              <Text style={styles.summaryValue}>
                {services.find((s) => s._id === selectedService)?.service_name}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Thời gian:</Text>
              <Text style={styles.summaryValue}>
                {new Date(selectedDate).toLocaleDateString("vi-VN")} -{" "}
                {selectedTime}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!selectedStore ||
              !selectedService ||
              !selectedDate ||
              !selectedTime) &&
              styles.actionButtonDisabled,
          ]}
          onPress={createOrder}
          disabled={
            loading ||
            !selectedStore ||
            !selectedService ||
            !selectedDate ||
            !selectedTime
          }
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.WHITE} />
              <Text style={styles.actionButtonText}>Xác nhận đặt lịch</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Store Modal with Picker */}
      <Modal
        visible={showStoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn cửa hàng</Text>
              <TouchableOpacity onPress={() => setShowStoreModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Danh sách cửa hàng</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedStore}
                  onValueChange={(itemValue) => {
                    setSelectedStore(itemValue);
                  }}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Chọn cửa hàng" value="" />
                  {stores.map((store) => (
                    <Picker.Item
                      key={store._id}
                      label={store.nameShop || "Cửa hàng"}
                      value={store._id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowStoreModal(false)}
            >
              <Text style={styles.modalButtonText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Service Modal with Picker */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn dịch vụ</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerLabel}>Danh sách dịch vụ</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedService}
                  onValueChange={(itemValue) => {
                    setSelectedService(itemValue);
                  }}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  enabled={services.length > 0}
                >
                  <Picker.Item label="Chọn dịch vụ" value="" />
                  {services.map((service) => (
                    <Picker.Item
                      key={service._id}
                      label={service.service_name || "Dịch vụ"}
                      value={service._id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowServiceModal(false)}
            >
              <Text style={styles.modalButtonText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngày</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={24} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={onDayPress}
              markedDates={{
                [selectedDate]: {
                  selected: true,
                  selectedColor: COLORS.PRIMARY,
                  selectedTextColor: COLORS.WHITE,
                },
              }}
              minDate={getMinDate()}
              theme={{
                backgroundColor: COLORS.WHITE,
                calendarBackground: COLORS.WHITE,
                textSectionTitleColor: COLORS.TEXT,
                selectedDayBackgroundColor: COLORS.PRIMARY,
                selectedDayTextColor: COLORS.WHITE,
                todayTextColor: COLORS.PRIMARY,
                dayTextColor: COLORS.TEXT,
                textDisabledColor: COLORS.GRAY,
                arrowColor: COLORS.PRIMARY,
                monthTextColor: COLORS.TEXT,
                textDayFontWeight: "500",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "600",
              }}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.modalButtonText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker */}
      <Modal
        visible={showTimePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn giờ</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.GRAY} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={
                  selectedTime
                    ? new Date(`2000-01-01T${selectedTime}`)
                    : new Date()
                }
                mode="time"
                is24Hour={true}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                textColor={COLORS.BLACK} // Thêm prop này để set màu text giờ/phút thành đen trên iOS spinner
                accentColor={COLORS.PRIMARY} // Giữ accent cho selected item (có thể dùng PRIMARY để highlight)
                onChange={(event, date) => onTimeChange(event, date)}
                style={{ width: "100%" }}
              />
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.modalButtonText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.MEDIUM,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.MEDIUM,
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
  progressBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.LARGE,
    paddingHorizontal: SPACING.SMALL,
  },
  progressStep: {
    alignItems: "center",
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.GRAY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.TINY,
  },
  progressCircleActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  progressCircleText: {
    color: COLORS.WHITE,
    fontWeight: "bold",
    fontSize: FONTS.SMALL,
  },
  progressLabel: {
    fontSize: FONTS.SMALL,
    color: COLORS.TEXT,
    textAlign: "center",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.GRAY,
    marginHorizontal: SPACING.SMALL,
  },
  selectionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
    marginLeft: SPACING.MEDIUM,
  },
  cardTitle: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.TINY,
  },
  cardSubtitle: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
  },
  summaryCard: {
    backgroundColor: `${COLORS.PRIMARY}05`,
    borderRadius: 16,
    padding: SPACING.MEDIUM,
    marginBottom: SPACING.MEDIUM,
    borderWidth: 1,
    borderColor: `${COLORS.PRIMARY}20`,
  },
  summaryTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.PRIMARY,
    marginBottom: SPACING.MEDIUM,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.SMALL,
  },
  summaryLabel: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
  },
  summaryValue: {
    fontSize: FONTS.REGULAR,
    fontWeight: "500",
    color: COLORS.PRIMARY,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.LARGE,
    borderRadius: 12,
    gap: SPACING.SMALL,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    margin: SPACING.MEDIUM,
    width: "90%",
    maxHeight: "70%",
  },
  calendarModal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    margin: SPACING.MEDIUM,
    width: "90%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.MEDIUM,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  pickerWrapper: {
    padding: SPACING.MEDIUM,
  },
  pickerLabel: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
  },
  pickerContainer: {
    height: 200,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    color: COLORS.TEXT,
  },
  pickerItem: {
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    backgroundColor: COLORS.WHITE,
  },
  modalButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    borderRadius: 12,
    margin: SPACING.MEDIUM,
    alignItems: "center",
  },
  modalButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
  },
  modal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    margin: SPACING.MEDIUM,
    width: "90%",
    paddingBottom: SPACING.MEDIUM,
    overflow: "hidden",
  },
  timePickerModal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    marginHorizontal: SPACING.MEDIUM,
    width: "90%",
    paddingBottom: SPACING.MEDIUM,
    maxHeight: 300, // đủ cao cho DateTimePicker
    overflow: "hidden",
    justifyContent: "center",
  },
});
