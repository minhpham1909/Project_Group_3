import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(true);

  const userName = useSelector((state) => state.auth.user?.name);
  const userId = useSelector((state) => state.auth.user?.id);

  // Hàm lấy danh sách cửa hàng
  const getAllStore = async () => {
    try {
      setStoresLoading(true);
      const response = await axios.get(`${API_ROOT}/store/listStore`);
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
      setServices(store.services); // Cập nhật dịch vụ của cửa hàng đã chọn
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

  // Hàm xử lý khi người dùng chọn ngày
  const onDayPress = (day) => {
    setSelectedDate(day.dateString); // Lưu ngày đã chọn
    setShowTimePicker(true); // Hiển thị bộ chọn thời gian
  };

  // Hàm xử lý khi người dùng chọn thời gian
  const onTimeChange = (event, selectedDateTime) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event.type === "set" && selectedDateTime) {
      const hours = selectedDateTime.getHours().toString().padStart(2, "0");
      const minutes = selectedDateTime.getMinutes().toString().padStart(2, "0");
      setSelectedTime(`${hours}:${minutes}`);
    }

    if (Platform.OS === "ios" && event.type === "dismissed") {
      setShowTimePicker(false);
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
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Đang tải danh sách cửa hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch dịch vụ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Select Store */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Chọn cửa hàng</Text>
          </View>
          <View style={styles.pickerContainer}>
            <Ionicons name="storefront-outline" size={20} color={COLORS.PRIMARY} style={styles.pickerIcon} />
            <Picker
              selectedValue={selectedStore}
              onValueChange={(itemValue) => setSelectedStore(itemValue)}
              style={styles.picker}
            >
              {stores.length === 0 ? (
                <Picker.Item label="Không có cửa hàng" value="" />
              ) : (
                stores.map((store, index) => (
                  <Picker.Item key={store._id || index} label={store.nameShop || "Cửa hàng"} value={store._id} />
                ))
              )}
            </Picker>
          </View>
        </View>

        {/* Step 2: Select Service */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Chọn dịch vụ</Text>
          </View>
          <View style={styles.pickerContainer}>
            <Ionicons name="sparkles-outline" size={20} color={COLORS.PRIMARY} style={styles.pickerIcon} />
            <Picker
              selectedValue={selectedService}
              onValueChange={(itemValue) => setSelectedService(itemValue)}
              style={styles.picker}
              enabled={selectedStore && services.length > 0}
            >
              {services.length === 0 ? (
                <Picker.Item label={selectedStore ? "Không có dịch vụ" : "Chọn cửa hàng trước"} value="" />
              ) : (
                services.map((service) => (
                  <Picker.Item
                    key={service._id}
                    label={service.service_name || "Dịch vụ"}
                    value={service._id}
                  />
                ))
              )}
            </Picker>
          </View>
        </View>

        {/* Step 3: Select Date and Time */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>Chọn ngày và giờ</Text>
          </View>

          <View style={styles.calendarContainer}>
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
          </View>

          {selectedDate && !selectedTime && (
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={20} color={COLORS.WHITE} />
              <Text style={styles.timeButtonText}>Chọn thời gian</Text>
            </TouchableOpacity>
          )}

          {selectedDate && selectedTime && (
            <View style={styles.selectedDateTimeContainer}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.SUCCESS} />
              <View style={styles.selectedDateTimeText}>
                <Text style={styles.selectedDateTimeLabel}>Đã chọn:</Text>
                <Text style={styles.selectedDateTimeValue}>
                  {new Date(selectedDate).toLocaleDateString("vi-VN")} - {selectedTime}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedTime(null);
                  setShowTimePicker(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime ? new Date(`2000-01-01T${selectedTime}`) : new Date()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
            />
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={createOrder}
          disabled={loading || !selectedStore || !selectedService || !selectedDate || !selectedTime}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons name="calendar" size={24} color={COLORS.WHITE} />
              <Text style={styles.submitButtonText}>Đặt lịch</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Note */}
        <Text style={styles.note}>
          💡 Đến nơi thanh toán, hủy lịch không sao
        </Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    padding: SPACING.MEDIUM,
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
  section: {
    marginBottom: SPACING.LARGE,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.MEDIUM,
    gap: SPACING.SMALL,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: FONTS.MEDIUM,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
  sectionTitle: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: SPACING.MEDIUM,
    minHeight: 56,
  },
  pickerIcon: {
    marginRight: SPACING.SMALL,
  },
  picker: {
    flex: 1,
    color: COLORS.TEXT,
  },
  calendarContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.SMALL,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: SPACING.MEDIUM,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.LARGE,
    borderRadius: 12,
    gap: SPACING.SMALL,
  },
  timeButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
  },
  selectedDateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.MEDIUM,
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
    gap: SPACING.SMALL,
  },
  selectedDateTimeText: {
    flex: 1,
  },
  selectedDateTimeLabel: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginBottom: SPACING.TINY,
  },
  selectedDateTimeValue: {
    fontSize: FONTS.REGULAR,
    fontWeight: "bold",
    color: COLORS.TEXT,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.LARGE,
    borderRadius: 16,
    marginTop: SPACING.MEDIUM,
    gap: SPACING.SMALL,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.WHITE,
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
  },
  note: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    marginTop: SPACING.LARGE,
    textAlign: "center",
    fontStyle: "italic",
  },
  bottomSpacing: {
    height: SPACING.LARGE,
  },
});
