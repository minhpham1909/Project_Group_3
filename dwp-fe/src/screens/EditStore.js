import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_ROOT, COLORS } from "../utils/constant";

const EditStore = ({ route, navigation }) => {
  const { storeId } = route.params;
  const user = useSelector((state) => state.auth.user);

  const [store, setStore] = useState(null);
  const [nameShop, setNameShop] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  const [services, setServices] = useState([]);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceSlot, setNewServiceSlot] = useState("1");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ROOT}/store/store/${storeId}`);
      const storeData = response.data;
      setStore(storeData);
      setNameShop(storeData.nameShop);
      setAddress(storeData.address);
      setImages(storeData.image || []);
      setServices(storeData.services || []);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu cửa hàng:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu cửa hàng.");
    } finally {
      setLoading(false);
    }
  };

  const openAppSettings = () => {
    const url = Platform.OS === "ios" ? "app-settings:" : "settings:";
    Linking.openURL(url).catch(() => {
      Alert.alert("Lỗi", "Không thể mở cài đặt ứng dụng.");
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === "granted") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        setNewImages([...newImages, result.assets[0].uri]);
      }
    } else {
      Alert.alert(
        "Quyền bị từ chối",
        "Ứng dụng cần quyền truy cập thư viện ảnh. Vui lòng cấp quyền trong Cài đặt.",
        [{ text: "Hủy" }, { text: "Mở Cài đặt", onPress: openAppSettings }]
      );
    }
  };

  const removeImage = (index, isNew = false) => {
    if (isNew) {
      setNewImages(newImages.filter((_, i) => i !== index));
    } else {
      Alert.alert("Xóa ảnh", "Ảnh này sẽ được xóa khi cập nhật?", [
        { text: "Hủy" },
        {
          text: "Xóa",
          onPress: () => {
            const removedUrl = images[index];
            setRemovedImages([...removedImages, removedUrl]);
            setImages(images.filter((_, i) => i !== index));
          },
        },
      ]);
    }
  };

  // ✅ Helper: Validate service name (trim, min 3, max 100)
  const validateServiceName = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      return "Tên dịch vụ phải có ít nhất 3 ký tự.";
    }
    if (trimmed.length > 100) {
      return "Tên dịch vụ không được vượt quá 100 ký tự.";
    }
    return null;
  };

  // ✅ Helper: Validate service price (number >= 0)
  const validateServicePrice = (priceStr) => {
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) {
      return "Giá dịch vụ phải là số >= 0.";
    }
    return null;
  };

  // Add service
  const addNewService = () => {
    // ✅ Validate service name
    const nameError = validateServiceName(newServiceName);
    if (nameError) {
      Alert.alert("Lỗi", nameError);
      return;
    }

    // ✅ Validate service price
    const priceError = validateServicePrice(newServicePrice);
    if (priceError) {
      Alert.alert("Lỗi", priceError);
      return;
    }

    const newService = {
      service_name: newServiceName.trim(),
      service_price: parseFloat(newServicePrice),
      slot_service: parseFloat(newServiceSlot),
    };
    setServices([...services, newService]);
    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceSlot("");
    setShowNewServiceForm(false);
    Alert.alert("Thành công", "Đã thêm dịch vụ mới!");
  };

  const deleteService = (index) => {
    Alert.alert("Xóa dịch vụ", "Bạn có chắc chắn muốn xóa dịch vụ này?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        onPress: () => {
          setServices(services.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const updateService = (index, field, value) => {
    const newServices = [...services];
    if (field === "name") {
      // ✅ Validate on update
      const nameError = validateServiceName(value);
      if (nameError) {
        Alert.alert("Lỗi", nameError);
        return;
      }
      newServices[index].service_name = value.trim();
    }
    if (field === "price") {
      const priceError = validateServicePrice(value);
      if (priceError) {
        Alert.alert("Lỗi", priceError);
        return;
      }
      newServices[index].service_price = parseFloat(value) || 0;
    }
    if (field === "slot")
      newServices[index].slot_service = parseFloat(value) || 0;
    setServices(newServices);
  };

  // ✅ Helper: Validate store name (trim, min 3, max 100)
  const validateStoreName = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      return "Tên cửa hàng phải có ít nhất 3 ký tự.";
    }
    if (trimmed.length > 100) {
      return "Tên cửa hàng không được vượt quá 100 ký tự.";
    }
    return null;
  };

  // ✅ Helper: Validate address (trim, min 3, max 100)
  const validateAddress = (addr) => {
    const trimmed = addr.trim();
    if (trimmed.length < 3) {
      return "Địa chỉ phải có ít nhất 3 ký tự.";
    }
    if (trimmed.length > 100) {
      return "Địa chỉ không được vượt quá 100 ký tự.";
    }
    return null;
  };

  // ✅ Helper: Validate all services
  const validateAllServices = () => {
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const nameError = validateServiceName(service.service_name);
      if (nameError) return `Dịch vụ ${i + 1}: ${nameError}`;
      const priceError = validateServicePrice(
        service.service_price?.toString()
      );
      if (priceError) return `Dịch vụ ${i + 1}: ${priceError}`;
    }
    if (services.length === 0) {
      return "Phải có ít nhất 1 dịch vụ.";
    }
    return null;
  };

  const updateStore = async () => {
    // ✅ Validate store name
    const nameError = validateStoreName(nameShop);
    if (nameError) {
      Alert.alert("Lỗi", nameError);
      return;
    }

    // ✅ Validate address
    const addrError = validateAddress(address);
    if (addrError) {
      Alert.alert("Lỗi", addrError);
      return;
    }

    // ✅ Validate all services
    const servicesError = validateAllServices();
    if (servicesError) {
      Alert.alert("Lỗi", servicesError);
      return;
    }

    // ✅ Validate images (at least 1 after removals)
    const remainingImages =
      images.length - removedImages.length + newImages.length;
    if (remainingImages === 0) {
      Alert.alert("Lỗi", "Vui lòng có ít nhất 1 ảnh.");
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("nameShop", nameShop.trim());
      formData.append("address", address.trim());
      formData.append("services", JSON.stringify(services));

      if (removedImages.length > 0) {
        formData.append("removeImages", JSON.stringify(removedImages));
      }

      for (let i = 0; i < newImages.length; i++) {
        let uri = newImages[i];
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append("images", {
          uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
          type,
          name: filename,
        });
      }

      const response = await axios.put(
        `${API_ROOT}/store/stores/${storeId}`,
        formData
      );
      if (response.data) {
        Alert.alert("Thành công", "Cập nhật cửa hàng thành công!");
        navigation.goBack({ refresh: true });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật cửa hàng:", error);
      Alert.alert("Lỗi", `Không thể cập nhật cửa hàng: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy cửa hàng</Text>
      </SafeAreaView>
    );
  }

  const renderServiceCard = (item, index) => (
    <View style={styles.serviceCard} key={`service-${index}`}>
      <View style={styles.serviceRow}>
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Tên dịch vụ</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.service_name || ""}
            onChangeText={(value) => updateService(index, "name", value)}
            placeholder="Nhập tên dịch vụ"
          />
        </View>
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Giá (VND)</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.service_price ? item.service_price.toString() : ""}
            onChangeText={(value) => updateService(index, "price", value)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        {/* <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Số slot</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.slot_service ? item.slot_service.toString() : ""}
            onChangeText={(value) => updateService(index, "slot", value)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View> */}
      </View>
      <TouchableOpacity
        style={styles.deleteServiceButton}
        onPress={() => deleteService(index)}
      >
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const allImages = [...images, ...newImages];
  const renderImageItem = (item, index) => {
    const isNew = index >= images.length;
    const realIndex = isNew ? index - images.length : index;
    return (
      <View style={styles.imageWrapper} key={`img-${index}`}>
        <Image source={{ uri: item }} style={styles.image} />
        <TouchableOpacity
          style={styles.removeImageOverlay}
          onPress={() => removeImage(realIndex, isNew)}
        >
          <Ionicons name="close-circle" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa cửa hàng</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Thông tin cơ bản */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên cửa hàng</Text>
            <TextInput
              style={styles.textInput}
              value={nameShop}
              onChangeText={setNameShop}
              placeholder="Nhập tên cửa hàng"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Nhập địa chỉ"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Hình ảnh */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Hình ảnh</Text>
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="add-circle-outline" size={24} color="#4A90E2" />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.imageGrid}>{allImages.map(renderImageItem)}</View>
        </View>

        {/* Dịch vụ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dịch vụ</Text>
            <TouchableOpacity
              style={styles.addServiceButton}
              onPress={() => setShowNewServiceForm(true)}
            >
              <Ionicons name="add" size={20} color="#4A90E2" />
              <Text style={styles.addServiceText}>Thêm dịch vụ mới</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesList}>
            {services.map(renderServiceCard)}
          </View>

          {/* Form thêm dịch vụ mới */}
          {showNewServiceForm && (
            <View style={styles.newServiceForm}>
              <Text style={styles.formTitle}>Thêm dịch vụ mới</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên dịch vụ</Text>
                <TextInput
                  style={styles.textInput}
                  value={newServiceName}
                  onChangeText={setNewServiceName}
                  placeholder="Nhập tên dịch vụ"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giá (VND)</Text>
                <TextInput
                  style={styles.textInput}
                  value={newServicePrice}
                  onChangeText={setNewServicePrice}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              {/* <View style={styles.inputGroup}>
                <Text style={styles.label}>Số slot</Text>
                <TextInput
                  style={styles.textInput}
                  value={newServiceSlot}
                  onChangeText={setNewServiceSlot}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View> */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addNewService}
              >
                <Text style={styles.addButtonText}>Xác nhận thêm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Button cập nhật */}
        <TouchableOpacity
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={updateStore}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.updateButtonText}>Cập nhật cửa hàng</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  headerSpacer: { width: 32 },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", color: "#2C3E50" },
  label: { fontSize: 14, fontWeight: "500", color: "#34495E", marginBottom: 4 },
  inputGroup: { marginBottom: 16 },
  textInput: {
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#2C3E50",
    backgroundColor: "#FFFFFF",
  },
  multilineInput: { height: 80, textAlignVertical: "top" },
  addImageButton: { flexDirection: "row", alignItems: "center" },
  addImageText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 12,
    width: 100,
    height: 100,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  removeImageOverlay: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
  },
  serviceCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: "relative",
  },
  serviceRow: { flexDirection: "row", justifyContent: "space-between" },
  serviceField: { flex: 1, marginRight: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7F8C8D",
    marginBottom: 4,
  },
  serviceInput: {
    borderWidth: 1,
    borderColor: "#BDC3C7",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: "#2C3E50",
    backgroundColor: "#FFFFFF",
  },
  deleteServiceButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E74C3C",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  servicesList: { marginBottom: 12 },
  addServiceButton: { flexDirection: "row", alignItems: "center" },
  addServiceText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: "500",
  },
  newServiceForm: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A90E2",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  updateButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  updateButtonDisabled: { backgroundColor: COLORS.PRIMARY },
  updateButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#7F8C8D" },
  errorText: {
    flex: 1,
    textAlign: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#E74C3C",
  },
});

export default EditStore;
