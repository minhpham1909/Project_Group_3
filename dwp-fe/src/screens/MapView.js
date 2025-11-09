import React, { useEffect, useState } from "react";
import { StyleSheet, View, Alert, Image, Modal, TouchableOpacity, Text, SectionList } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Group images into chunks of 4
const groupImages = (images) => {
  const grouped = [];
  if (Array.isArray(images)) {
    for (let i = 0; i < images.length; i += 4) {
      grouped.push(images.slice(i, i + 4)); // directly group into chunks
    }
  }
  return grouped;
};

export default function MapViewScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]); // Initialize with an empty array
  const [modalVisible, setModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false); // Modal for viewing all images

  // Request location permissions and fetch current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      await loadImages(); // Load images from AsyncStorage
    })();
  }, []);

  // Function to pick an image using the camera
  const pickImage = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const newImages = [...images, uri];
      setImages(newImages);
      await AsyncStorage.setItem("images", JSON.stringify(newImages));
    }
  };

  // Request camera and media library permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || mediaLibraryStatus !== "granted") {
      Alert.alert("The app needs permission to access your camera and photo library!");
      return false;
    }
    return true;
  };

  // Load stored images from AsyncStorage
  const loadImages = async () => {
    const storedImages = await AsyncStorage.getItem("images");
    if (storedImages) {
      setImages(JSON.parse(storedImages));
    }
  };

  // Handle marker press to show modal
  const handleMarkerPress = () => {
    setModalVisible(true);
  };

  // Group images into sections for display
  const groupedImages = groupImages(images);

  // Render each section of images
  const renderImageItem = ({ item }) => (
    <View style={styles.row}>
      {item.map((uri, index) => (
        <Image key={index} source={{ uri }} style={styles.image} />
      ))}
    </View>
  );

  // Toggle the visibility of the image modal
  const toggleImageModal = () => {
    setImageModalVisible(!imageModalVisible);
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.009,
            longitudeDelta: 0.009,
          }}
          showsUserLocation={true}
        >
          <Marker coordinate={location} title="Current Location" onPress={handleMarkerPress} />
        </MapView>
      )}

      <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
        <Ionicons name="camera" size={40} color="white" />
      </TouchableOpacity>

      {/* New button to show images from Local Storage */}
      <TouchableOpacity style={styles.showImagesButton} onPress={toggleImageModal}>
        <Ionicons name="images" size={40} color="white" />
      </TouchableOpacity>

      {/* Modal to display images from AsyncStorage */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={toggleImageModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={toggleImageModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            {groupedImages.length > 0 ? (
              <SectionList
                sections={groupedImages}
                renderItem={renderImageItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.imageList}
                contentContainerStyle={styles.imageListContent}
              />
            ) : (
              <Text style={styles.noImagesText}>No images yet. Please check-in at this location!</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal to display images when marker is pressed */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            {images.length > 0 ? (
              <SectionList
                sections={groupedImages}
                renderItem={renderImageItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.imageList}
                contentContainerStyle={styles.imageListContent}
              />
            ) : (
              <Text style={styles.noImagesText}>No images yet. Please check-in at this location!</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  cameraButton: {
    position: "absolute",
    bottom: 60,
    right: 25,
    backgroundColor: "#000",
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  showImagesButton: {
    position: "absolute",
    bottom: 130,
    right: 25,
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "95%",
    height: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 8,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  imageList: {
    flex: 1,
  },
  imageListContent: {
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 1,
  },
  image: {
    width: 80,
    height: 80,
    marginHorizontal: 0.5,
    borderRadius: 10,
  },
  noImagesText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});
