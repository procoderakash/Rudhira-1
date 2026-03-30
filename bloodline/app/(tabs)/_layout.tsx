import { Tabs, useRouter } from 'expo-router';
import React from 'react';

import { config } from '@/config';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Text, TouchableOpacity } from 'react-native';

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const queryClient = useQueryClient();
	const router = useRouter();

	const handleLogout = async () => {
		try {
			const token = await AsyncStorage.getItem('userToken');

			await axios.post(
				`https://sea-turtle-app-635az.ondigitalocean.app/api/auth/logout`,
				{},
				token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
			);
		} catch (error) {
			console.log('Logout request failed', error);
		} finally {
			await AsyncStorage.removeItem('userToken');
			await queryClient.invalidateQueries({ queryKey: ['auth'] });
			router.replace('/(auth)/login');
		}
	};

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
				headerShown: true,
				tabBarButton: HapticTab,
				headerRightContainerStyle: {
					paddingRight: 14,
				},
			}}
		>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Home',
					headerRight: () => (
						<TouchableOpacity onPress={handleLogout}>
							<Text
								style={{
									color: '#d93025',
									fontSize: 15,
									fontWeight: '700',
								}}
							>
								Logout
							</Text>
						</TouchableOpacity>
					),
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name='house.fill'
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='explore'
				options={{
					title: 'Blood Exchange',
					headerRight: () => (
						<TouchableOpacity onPress={handleLogout}>
							<Text
								style={{
									color: '#d93025',
									fontSize: 15,
									fontWeight: '700',
								}}
							>
								Logout
							</Text>
						</TouchableOpacity>
					),
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name='paperplane.fill'
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
