import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ROOT, COLORS, FONTS, SPACING } from "../utils/constant";

export function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  // Tải lại tin nhắn đã lưu từ AsyncStorage khi ứng dụng khởi động lại
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem("chatMessages");
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          // Đảm bảo mỗi message có timestamp
          const messagesWithTimestamp = parsedMessages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp || new Date().toISOString(),
          }));
          setMessages(messagesWithTimestamp);
        }
      } catch (error) {
        console.error("Error loading messages from AsyncStorage:", error);
      }
    };
    loadMessages();
  }, []);

  // Hàm hiển thị tin nhắn (cả của người dùng và AI)
  const displayMessage = (sender, message) => {
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender,
      timestamp: new Date().toISOString(),
    };
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage];
      AsyncStorage.setItem("chatMessages", JSON.stringify(updatedMessages));
      return updatedMessages;
    });

    // Cuộn xuống dưới sau khi có tin nhắn mới
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  // Hàm xóa tất cả tin nhắn
  const clearChat = async () => {
    try {
      await AsyncStorage.removeItem("chatMessages");
      setMessages([]);
    } catch (error) {
      console.error("Error clearing messages:", error);
    }
  };

  // Format thời gian
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Hàm gửi tin nhắn từ người dùng
  const sendMessage = async () => {
    if (input.trim().length === 0) return;

    const userMessageText = input.trim();
    const userMessage = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput(""); // Xóa trường input

    // Lưu tin nhắn người dùng vào AsyncStorage
    AsyncStorage.setItem("chatMessages", JSON.stringify(updatedMessages));

    // Bắt đầu trạng thái loading
    setIsLoading(true);

    // Cuộn xuống dưới sau khi gửi tin nhắn
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);

    // Gửi yêu cầu tới API để lấy phản hồi từ ChatBot
    try {
      const response = await fetch(`${API_ROOT}/user/chatBot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userMessageText }),
      });

      if (!response.ok) {
        throw new Error("Error fetching response from chatBot API");
      }

      const data = await response.json();
      displayMessage("AI", data.message || data.response || "Xin lỗi, tôi không thể trả lời câu hỏi này.");
    } catch (error) {
      console.error("Error sending message to chatBot:", error);
      displayMessage(
        "AI",
        "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageWrapper,
        item.sender === "user" ? styles.userMessageWrapper : styles.botMessageWrapper,
      ]}
    >
      {item.sender === "AI" && (
        <View style={styles.avatarContainer}>
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.WHITE} />
          </View>
        </View>
      )}
      <View
        style={[
          styles.messageContainer,
          item.sender === "user" ? styles.userMessage : styles.botMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.sender === "AI" && styles.botMessageText,
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            item.sender === "AI" && styles.botTimestamp,
          ]}
        >
          {formatTime(item.timestamp)}
        </Text>
      </View>
      {item.sender === "user" && (
        <View style={styles.avatarContainer}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color={COLORS.WHITE} />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="chatbubble-ellipses" size={28} color={COLORS.WHITE} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerText}>SlayMe Brain</Text>
              <Text style={styles.headerSubtext}>Trợ lý ảo thông minh</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
              <Ionicons name="trash-outline" size={20} color={COLORS.WHITE} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.chatContainer}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="chatbubbles-outline" size={64} color={COLORS.GRAY} />
                </View>
                <Text style={styles.emptyTitle}>Chào mừng đến SlayMe Brain! 👋</Text>
                <Text style={styles.emptyText}>
                  Tôi có thể giúp bạn tìm hiểu về dịch vụ, đặt lịch hẹn, và trả lời các câu hỏi của bạn.
                </Text>
                <Text style={styles.emptySubtext}>
                  Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn!
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatDisplay}
                onContentSizeChange={() => {
                  if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: true });
                  }
                }}
                showsVerticalScrollIndicator={false}
              />
            )}

            {isLoading && (
              <View style={styles.typingIndicator}>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, styles.typingDotDelay1]} />
                  <View style={[styles.typingDot, styles.typingDotDelay2]} />
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn của bạn..."
              placeholderTextColor={COLORS.GRAY}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                input.trim().length === 0 && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={input.trim().length === 0 || isLoading}
            >
              <Ionicons
                name="send"
                size={20}
                color={input.trim().length === 0 ? COLORS.GRAY : COLORS.WHITE}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  headerContainer: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MEDIUM,
    paddingHorizontal: SPACING.LARGE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.MEDIUM,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: FONTS.LARGE,
    fontWeight: "bold",
    color: COLORS.WHITE,
  },
  headerSubtext: {
    fontSize: FONTS.SMALL,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  clearButton: {
    padding: SPACING.SMALL,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  chatDisplay: {
    flexGrow: 1,
    padding: SPACING.MEDIUM,
    paddingBottom: SPACING.SMALL,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.XLARGE,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.WHITE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.LARGE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: FONTS.XLARGE,
    fontWeight: "bold",
    color: COLORS.TEXT,
    marginBottom: SPACING.SMALL,
    textAlign: "center",
  },
  emptyText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.GRAY,
    textAlign: "center",
    marginBottom: SPACING.SMALL,
    lineHeight: 22,
  },
  emptySubtext: {
    fontSize: FONTS.SMALL,
    color: COLORS.GRAY,
    textAlign: "center",
    fontStyle: "italic",
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: SPACING.MEDIUM,
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  userMessageWrapper: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  botMessageWrapper: {
    alignSelf: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    marginHorizontal: SPACING.TINY,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.SECONDARY,
    alignItems: "center",
    justifyContent: "center",
  },
  messageContainer: {
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    borderRadius: 16,
    maxWidth: "100%",
  },
  userMessage: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: COLORS.WHITE,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  messageText: {
    fontSize: FONTS.REGULAR,
    color: COLORS.WHITE,
    lineHeight: 20,
  },
  botMessageText: {
    color: COLORS.TEXT,
  },
  timestamp: {
    fontSize: FONTS.TINY,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: SPACING.TINY,
    alignSelf: "flex-end",
  },
  botTimestamp: {
    color: COLORS.GRAY,
  },
  typingIndicator: {
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: SPACING.SMALL,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    width: 60,
    justifyContent: "center",
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.GRAY,
  },
  typingDotDelay1: {
    animationDelay: "0.2s",
  },
  typingDotDelay2: {
    animationDelay: "0.4s",
  },
  inputSection: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: SPACING.MEDIUM,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 24,
    paddingHorizontal: SPACING.MEDIUM,
    paddingVertical: SPACING.SMALL,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: FONTS.REGULAR,
    color: COLORS.TEXT,
    paddingVertical: SPACING.SMALL,
    paddingHorizontal: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: SPACING.SMALL,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatBot;
