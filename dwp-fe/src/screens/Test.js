import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import axios from "axios";
import { API_ROOT } from "../utils/constant";

export default function Test({ navigation }) {
  const [quizData, setQuizData] = useState(null); // Dữ liệu quiz nhận từ server
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(""); // Giả sử bạn cần chọn category, nếu có
  const [aiFeedback, setAiFeedback] = useState(""); // Lưu nhận xét từ AI
  const [isLoading, setIsLoading] = useState(false); // Thêm state để quản lý loading

  const userName = useSelector((state) => state.auth.user?.name);
  const userId = useSelector((state) => state.auth.user?.id);
  const dispatch = useDispatch();

  // Bắt đầu quiz và gọi API để lấy dữ liệu quiz
  const startQuiz = async () => {
    try {
      const res = await axios.post(`${API_ROOT}/quiz/createQuiz`, {
        title: title,
        description: description,
        userId: userId,
        categoryId: "605c72ef0f1b2c001f92a3e0",
      });
      const quizId = res.data.quiz._id; // Assuming the quiz object has an _id property
      setQuizData(null); // Clear any previous quiz data

      // Now fetch the quiz using its ID
      await fetchQuizById(quizId); // Fetch the quiz data by ID
      setIsQuizStarted(true);
      setScore(0);
      setFinished(false);
    } catch (error) {
      console.log("Error fetching quiz data:", error);
    }
  };

  // Function to fetch quiz by ID
  const fetchQuizById = async (quizId) => {
    try {
      const res = await axios.get(`${API_ROOT}/quiz/${quizId}`);
      setQuizData(res.data); // Set the quiz data
    } catch (error) {
      console.log("Error fetching quiz by ID:", error);
    }
  };

  // Xử lý khi người dùng trả lời một câu hỏi
  const handleAnswer = (questionIndex, answer) => {
    const updatedQuiz = { ...quizData };

    // Kiểm tra câu hỏi và gán đáp án cho câu hỏi đó
    updatedQuiz.questions[questionIndex].answers = [answer]; // Lưu chỉ một đáp án duy nhất cho câu hỏi

    // Kiểm tra nếu tất cả các câu hỏi đã được trả lời
    // setFinished(updatedQuiz.questions.every(q => q.answers && q.answers.length > 0));
    setQuizData(updatedQuiz); // Cập nhật trạng thái quiz
  };

  // Hàm nộp quiz
  const submitQuiz = async () => {
    const answers = quizData.questions.map((question) => ({
      questionId: question.questionId._id, // Lấy ID của câu hỏi
      answers: question.answers, // Chỉ gửi câu trả lời của các câu hỏi
    }));

    // Bắt đầu loading
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_ROOT}/quiz/submit/${quizData._id}`,
        { answers }
      );

      if (response.data.message === "Quiz đã được gửi thành công") {
        console.log("Quiz đã gửi thành công", response.data);
        setFinished(true); // Đánh dấu quiz đã hoàn thành
        setAiFeedback(response.data.feedback); // Lưu phản hồi từ AI
        Alert.alert("Success", "You have successfully submitted the quiz.");
      } else {
        console.log("Lỗi: ", response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi gửi quiz:", error);
    } finally {
      // Tắt loading sau khi đã nhận được phản hồi
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Đang xử lý, vui lòng đợi...</Text>
      </View>
    );
  }

  if (!isQuizStarted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Nhập chi tiết quiz</Text>
        {/* Input title */}
        <TextInput
          style={styles.inputStart}
          placeholder="Nhập tiêu đề quiz"
          value={title}
          onChangeText={setTitle}
        />
        {/* Input description */}
        <TextInput
          style={styles.inputStart}
          placeholder="Nhập mô tả quiz"
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.buttonWrapper}>
          <Button
            title="Bắt đầu quiz"
            onPress={startQuiz}
            color="white" // Chỉnh màu chữ trắng cho dễ đọc trên nền màu hồng
          />
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Quiz đã hoàn thành!</Text>
        <Text style={styles.text}>Nhận xét từ AI:</Text>

        {/* Kiểm tra nếu aiFeedback là mảng hoặc chuỗi */}
        <ScrollView style={styles.feedbackContainer}>
          {Array.isArray(aiFeedback) ? (
            aiFeedback.map((feedback, index) => (
              <View key={index} style={styles.feedbackItem}>
                <Text style={styles.aiFeedback}>{feedback}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.aiFeedback}>
              {aiFeedback ?? "Không có nhận xét từ AI"}
            </Text>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.buttonWrapper}>
          <Button
            title="Làm lại quiz"
            onPress={startQuiz}
            color="white" // Chỉnh màu chữ trắng cho dễ đọc trên nền màu hồng
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Title and Description of the quiz */}
        <Text style={styles.quizTitle}>Tên bài kiểm tra: {title}</Text>
        <Text style={styles.quizDescription}>Mô tả: {description}</Text>
      </View>

      <FlatList
        data={quizData.questions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.questionContainer}>
            <Text style={styles.text}>
              Câu {index + 1}: {item.questionId.content}
            </Text>
            {item.questionId.options.length > 0 ? (
              <FlatList
                data={item.questionId.options} // Lấy đáp án từ options
                keyExtractor={(option, optionIndex) => optionIndex.toString()}
                renderItem={({ item: option }) => (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      item.answers &&
                        item.answers.includes(option) &&
                        styles.selectedAnswer,
                    ]} // Đánh dấu đáp án đã chọn
                    onPress={() => handleAnswer(index, option)} // Gọi hàm xử lý trả lời
                  >
                    <Text style={styles.buttonText}>{option}</Text>
                  </TouchableOpacity>
                )}
                numColumns={2}
                contentContainerStyle={styles.optionsContainer}
              />
            ) : (
              <Text style={styles.text}>Không có lựa chọn nào</Text> // Nếu không có đáp án
            )}
          </View>
        )}
        contentContainerStyle={styles.questionsContainer}
      />
      <TouchableOpacity style={styles.buttonSubmit} onPress={submitQuiz}>
        <Text style={styles.buttonSubmitText}>Nộp bài</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6C7F5",
    padding: 20,
  },
  header: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "white",
    color: "white",
    padding: 30,
    marginBottom: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    marginBottom: 10,
  },
  questionsContainer: {
    width: "100%",
  },
  questionContainer: {
    marginBottom: 20,
    width: "100%",
  },
  optionsContainer: {
    marginTop: 10,
    width: "100%",
  },
  button: {
    backgroundColor: "white",
    padding: 15,
    margin: 5,
    borderRadius: 5,
    flex: 1, // Để các button có thể co dãn theo cột
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    textAlign: "center",
  },
  selectedAnswer: {
    backgroundColor: "#007bff", // Màu xanh lá cho câu trả lời đã chọn
  },
  aiFeedback: {
    fontSize: 16,
    marginTop: 20,
    color: "gray",
    fontStyle: "italic", // Bạn có thể làm cho văn bản nghiêng để dễ phân biệt
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: "100%",
  },
  header: {
    flexDirection: "column", // Stack the title, description, and search bar vertically
    backgroundColor: "white",
    marginTop: 30,
    marginBottom: 20,
    paddingTop: 20,
    paddingLeft: 30,
    alignItems: "flex-start", // Align the content to the left
    width: "100%",
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5e4b8b", // Darker color for better contrast
    marginBottom: 5,
  },
  quizDescription: {
    fontSize: 16,
    color: "#6a5d8b", // Lighter color to separate description
    marginBottom: 20, // Add space between description and search bar
  },
  searchBar: {
    height: 40,
    borderColor: "#dcdcdc",
    borderWidth: 1,
    borderRadius: 5,
    width: "80%",
    paddingLeft: 10,
    marginBottom: 10,
  },
  cartIcon: {
    marginTop: 10,
  },
  buttonSubmit: {
    backgroundColor: "#ff5733", // A more vibrant red-orange color
    borderRadius: 10, // Rounder corners for a smoother look
    paddingVertical: 15, // Increase vertical padding for a larger button
    paddingHorizontal: 20, // Add horizontal padding for better balance
    marginTop: 20,
    width: "80%", // Slightly reduce width to give some space from edges
    alignItems: "center", // Center the text horizontally
    justifyContent: "center", // Ensure text is centered vertically
    shadowColor: "#000", // Add shadow for depth
    shadowOffset: { width: 0, height: 2 }, // Shadow settings
    shadowOpacity: 0.2, // Light shadow opacity
    shadowRadius: 3, // Shadow blur radius
    elevation: 5, // Elevation for Android shadow effect
  },

  buttonSubmitText: {
    color: "white", // Text color to be white for contrast
    fontSize: 18, // Larger font size for better readability
    fontWeight: "bold", // Make the text bold
  },
  inputStart: {
    height: 45,
    borderColor: "#d1a7d9",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: "100%",
    backgroundColor: "#fff",
  },
  buttonWrapper: {
    backgroundColor: "#FF69B4", // Màu hồng đậm (HotPink)
    padding: 10,
    borderRadius: 8, // Bo góc mềm mại hơn
    width: "80%", // Chiếm 80% chiều rộng để button không quá rộng
    marginTop: 20, // Tạo khoảng cách phía trên
    alignItems: "center", // Căn giữa nội dung của button
    justifyContent: "center", // Căn giữa nội dung của button
    shadowColor: "#000", // Tạo hiệu ứng bóng đổ nhẹ
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4, // Để tạo bóng đổ cho Android
  },
});
