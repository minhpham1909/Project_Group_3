import React, { useState } from "react";
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

const CreateStore = ({ navigation }) => {
  const user = useSelector((state) => state.auth.user);
  const [nameShop, setNameShop] = useState("");
  const [address, setAddress] = useState("");
  const [newImages, setNewImages] = useState([]); // Array of { uri, type }
  const [services, setServices] = useState([]); // Array of {service_name, service_price, slot_service}
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceSlot, setNewServiceSlot] = useState("");
  const [updating, setUpdating] = useState(false);

  const openAppSettings = () => {
    const url = Platform.OS === "ios" ? "app-settings:" : "settings:";
    Linking.openURL(url).catch(() => {
      Alert.alert("Lỗi", "Không thể mở cài đặt ứng dụng.");
    });
  };

  const pickImage = async () => {
    if (newImages.length >= 5) {
      Alert.alert("Giới hạn", "Chỉ được thêm tối đa 5 ảnh.");
      return;
    }
    console.log("Button pressed - Starting pickImage");
    try {
      const { status, accessPrivileges } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Full permission response:", { status, accessPrivileges });

      if (status === "granted") {
        if (accessPrivileges !== "all") {
          Alert.alert(
            "Quyền hạn chế",
            "Bạn chỉ có quyền limited. Vui lòng cấp full access trong Settings > App > Photos để mở đầy đủ gallery.",
            [{ text: "OK", onPress: openAppSettings }]
          );
          return;
        }

        console.log("Full access - Launching image picker");
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [4, 3],
          quality: 0.8,
        });

        console.log("Picker result:", JSON.stringify(result, null, 2));

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const pickerUri = result.assets[0].uri;
          console.log("Selected URI:", pickerUri);
          setNewImages([
            ...newImages,
            { uri: pickerUri, type: result.assets[0].type || "image/jpeg" },
          ]);
          Alert.alert("Thành công", "Đã chọn ảnh!");
        } else {
          console.log("Picker canceled or no assets");
        }

        if (Platform.OS === "android") {
          const pending = await ImagePicker.getPendingResultAsync();
          if (pending) {
            console.log("Pending result:", pending);
          }
        }
      } else if (status === "denied") {
        Alert.alert(
          "Quyền bị từ chối",
          "Ứng dụng cần quyền truy cập thư viện ảnh. Vui lòng cấp quyền trong Cài đặt > Quyền riêng tư > Thư viện ảnh.",
          [{ text: "Hủy" }, { text: "Mở Cài đặt", onPress: openAppSettings }]
        );
      } else {
        Alert.alert(
          "Quyền truy cập cần thiết",
          "Cần quyền truy cập thư viện ảnh để chọn ảnh. Vui lòng cấp quyền."
        );
      }
    } catch (error) {
      console.error("Error in pickImage:", error);
      Alert.alert("Lỗi", `Không thể mở thư viện ảnh: ${error.message}`);
    }
  };

  const removeImage = (index) => {
    Alert.alert("Xóa ảnh", "Bạn có chắc chắn muốn xóa ảnh này?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        onPress: () => {
          const updatedImages = newImages.filter((_, i) => i !== index);
          setNewImages(updatedImages);
        },
      },
    ]);
  };

  const addNewService = () => {
    if (
      !newServiceName.trim() ||
      !newServicePrice.trim() ||
      !newServiceSlot.trim()
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập tên, giá và số slot dịch vụ.");
      return;
    }
    const newService = {
      service_name: newServiceName,
      service_price: parseFloat(newServicePrice),
      slot_service: parseFloat(newServiceSlot),
    };
    setServices([...services, newService]);
    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceSlot("");
    Alert.alert("Thành công", "Đã thêm dịch vụ mới!");
  };

  const deleteService = (index) => {
    Alert.alert("Xóa dịch vụ", "Bạn có chắc chắn muốn xóa dịch vụ này?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        onPress: () => {
          const newServices = services.filter((_, i) => i !== index);
          setServices(newServices);
        },
      },
    ]);
  };

  const updateService = (index, field, value) => {
    const newServices = [...services];
    if (field === "name") {
      newServices[index].service_name = value;
    } else if (field === "price") {
      newServices[index].service_price = parseFloat(value) || 0;
    } else if (field === "slot") {
      newServices[index].slot_service = parseFloat(value) || 0;
    }
    setServices(newServices);
  };

  const createStore = async () => {
    if (!nameShop || !address) {
      Alert.alert("Lỗi", "Vui lòng điền tên cửa hàng và địa chỉ.");
      return;
    }
    if (newImages.length === 0) {
      Alert.alert("Lỗi", "Vui lòng thêm ít nhất 1 ảnh.");
      return;
    }
    if (user?.id === undefined) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
      return;
    }

    console.log("Starting create - New images URIs:", newImages);
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("nameShop", nameShop);
      formData.append("address", address);
      formData.append("ownerId", user.id); // Assume user._id
      formData.append("services", JSON.stringify(services));

      // Append images
      newImages.forEach((imageObj, index) => {
        let rawUri = imageObj.uri;
        let mimeType = imageObj.type || "image/jpeg";

        let fixedUri = rawUri;
        if (
          !fixedUri.startsWith("file://") &&
          !fixedUri.startsWith("content://")
        ) {
          fixedUri = `file://${fixedUri}`;
        }
        if (Platform.OS === "ios" && fixedUri.startsWith("file:///var/")) {
          fixedUri = fixedUri;
        } else if (
          Platform.OS === "android" &&
          fixedUri.startsWith("/storage/")
        ) {
          fixedUri = `file://${fixedUri}`;
        }

        const fileName = rawUri.split("/").pop() || `image${index}.jpg`;

        const file = {
          uri: fixedUri,
          type: mimeType,
          name: fileName,
        };
        formData.append("images", file);
        console.log(
          `Appended file ${index}: uri=${fixedUri.substring(
            0,
            50
          )}..., type=${mimeType}, name=${fileName}`
        );
      });

      console.log("FormData keys:");
      for (let [key, value] of formData.entries()) {
        const valPreview =
          typeof value === "object"
            ? `[File: ${value.uri || value.name}]`
            : value.toString().substring(0, 50) + "...";
        console.log(`${key}: ${valPreview}`);
      }

      const response = await axios.post(`${API_ROOT}/store/stores`, formData, {
        headers: {
          // Không set Content-Type để Axios tự handle
        },
      });
      console.log("BE Response:", response.data);
      if (response.data && response.data.store) {
        Alert.alert("Thành công", "Tạo cửa hàng thành công!");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Create error full:", error.response?.data || error);
      Alert.alert(
        "Lỗi",
        `Tạo cửa hàng thất bại: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setUpdating(false);
    }
  };

  const renderServiceCard = ({ item, index }) => (
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
        <View style={styles.serviceField}>
          <Text style={styles.fieldLabel}>Số slot</Text>
          <TextInput
            style={styles.serviceInput}
            value={item.slot_service ? item.slot_service.toString() : ""}
            onChangeText={(value) => updateService(index, "slot", value)}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteServiceButton}
        onPress={() => deleteService(index)}
      >
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const allImages = newImages.map((imgObj) => imgObj.uri);
  const renderImageItem = (item, index) => (
    <View style={styles.imageWrapper} key={`img-${index}`}>
      <Image source={{ uri: item }} style={styles.image} />
      <TouchableOpacity
        style={styles.removeImageOverlay}
        onPress={() => removeImage(index)}
      >
        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo cửa hàng mới</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
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

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Hình ảnh (Tối đa 5)</Text>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImage}
              disabled={newImages.length >= 5}
            >
              <Ionicons name="add-circle-outline" size={24} color="#4A90E2" />
              <Text style={styles.addImageText}>Thêm ảnh</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.imageGrid}>{allImages.map(renderImageItem)}</View>
          {newImages.length === 0 && (
            <Text style={styles.helperText}>Vui lòng thêm ít nhất 1 ảnh.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dịch vụ</Text>
            <TouchableOpacity
              style={styles.addServiceButton}
              onPress={() => setNewServiceName("")} // Show form
            >
              <Ionicons name="add" size={20} color="#4A90E2" />
              <Text style={styles.addServiceText}>Thêm dịch vụ mới</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesList}>
            {services.map(renderServiceCard)}
          </View>
          {newServiceName || newServicePrice || newServiceSlot ? (
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
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số slot</Text>
                <TextInput
                  style={styles.textInput}
                  value={newServiceSlot}
                  onChangeText={setNewServiceSlot}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addNewService}
              >
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={createStore}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.updateButtonText}>Tạo cửa hàng</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#4A90E2",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#34495E",
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E1E8ED",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#2C3E50",
    backgroundColor: "#FFFFFF",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
  },
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
  helperText: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
    marginTop: 8,
  },
  serviceCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: "relative",
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  serviceField: {
    flex: 1,
    marginRight: 8,
  },
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
  servicesList: {
    marginBottom: 12,
  },
  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addServiceText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
  },
  newServiceForm: {
    backgroundColor: "#E8F4FD",
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
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  updateButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  updateButtonDisabled: {
    backgroundColor: "#AED6F1",
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateStore;
