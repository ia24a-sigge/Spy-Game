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

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background } };

// Navigation laut Workflow-Diagramm: ein Stack ohne Tab Bar.
// Screen 3 und 4 haben keine Zurück-Geste, damit niemand eine fremde Karte sieht
// oder die Runde aus Versehen verlässt.
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
