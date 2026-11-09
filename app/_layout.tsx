import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

import { LoadingState } from '@/components/screen-state';
import { useAuthBootstrap } from '@/features/auth';
import { NAV_THEME } from '@/lib/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const authStatus = useAuthBootstrap();
  const signedIn = authStatus === 'signedIn';

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {authStatus === 'initializing' ? (
        <LoadingState />
      ) : (
        <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="workout/[id]" options={{ title: '운동' }} />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)/sign-in" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      )}
      <PortalHost />
    </ThemeProvider>
  );
}
