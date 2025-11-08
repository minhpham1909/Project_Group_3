import { View, Text } from "react-native";

const Home = () => {
  return (
    <View>
      <Text>{process.env.EXPO_PUBLIC_API}</Text>
    </View>
  );
};

export default Home;
