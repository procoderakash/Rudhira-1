import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/error-boundary';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authQuery } from '@/query/auth.query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const unstable_settings = {
	initialRouteName: '(tabs)',
};

function RootNavigator() {
	const { data: authUser, isLoading, isError } = useQuery(authQuery);
	const segments = useSegments();
	const router = useRouter();
	const [hasToken, setHasToken] = useState<boolean | null>(null);

	useEffect(() => {
		const checkToken = async () => {
			const token = await AsyncStorage.getItem('userToken');
			setHasToken(!!token);
		};
		checkToken();
	}, [isLoading, authUser]); // Re-check token when query loading finishes or auth user changes

	useEffect(() => {
		if (isLoading || hasToken === null) return;

		const inAuthGroup = segments[0] === '(auth)';
		const isUnauthenticated = (!authUser || isError) && !hasToken;

		if (isUnauthenticated && !inAuthGroup) {
			// Redirect to the login page if unauthenticated and no token available
			router.replace('/(auth)/login');
		} else if (!isUnauthenticated && inAuthGroup) {
			// Redirect away from the auth screens if authenticated or has a token
			router.replace('/(tabs)');
		}
	}, [authUser, isError, isLoading, segments, hasToken]);

	if (isLoading || hasToken === null) {
		return null;
	}

	return (
		<Stack>
			<Stack.Screen
				name='(tabs)'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='(auth)'
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name='modal'
				options={{
					presentation: 'modal',
					title: 'Modal',
					headerShown: false,
				}}
			/>
		</Stack>
	);
}

export default function RootLayout() {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: 1,
						staleTime: 5 * 60 * 1000,
					},
				},
			}),
	);
	const colorScheme = useColorScheme();

	return (
		<ErrorBoundary>
			<ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
				<QueryClientProvider client={queryClient}>
					<RootNavigator />
				</QueryClientProvider>
				<StatusBar style='auto' />
			</ThemeProvider>
		</ErrorBoundary>
	);
}

