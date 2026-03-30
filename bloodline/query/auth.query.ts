import { config } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const authQuery = {
	queryKey: ['auth'],
	queryFn: async () => {
		try {
			const token = await AsyncStorage.getItem('userToken');

			if (!token) {
				return null;
			}

			const response = await axios.get(`https://sea-turtle-app-635az.ondigitalocean.app/api/users/me`, {
				headers: { Authorization: `Bearer ${token}` },
				timeout: 8000,
			});

			return response.data ?? null;
		} catch (error: any) {
			// Specifically handle network errors (server unreachable)
			// This is critical in production when BASE_URL may not be reachable
			if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
				console.log('Auth check: server unreachable');
			} else {
				console.log('Auth check failed:', error?.message ?? error);
			}
			return null;
		}
	},
};

