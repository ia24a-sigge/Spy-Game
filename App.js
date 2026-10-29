import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import StartScreen from './src/screens/StartScreen';
import SetupScreen from './src/screens/SetupScreen';
import CardScreen from './src/screens/CardScreen';
import RoundScreen from './src/screens/RoundScreen';
import VoteScreen from './src/screens/VoteScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

// Same background color as the screens, so there is no white flash between screens.
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

/**
 * Entry point of the app. Navigation follows the workflow diagram from the concept:
 * one stack without a tab bar, because the game has a fixed order of screens.
 * Screens 3 and 4 have no back swipe, so nobody sees another player's card
 * or leaves the round by accident.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName="Start" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Card" component={CardScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="Round" component={RoundScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Vote" component={VoteScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
