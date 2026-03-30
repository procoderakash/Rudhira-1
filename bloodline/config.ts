import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolve the dev machine's LAN IP from Expo's hostUri
// This is needed because `localhost` on a physical device refers to the device itself.
const getDevServerHost = (): string => {
	// Try to extract the host from Expo's manifest
	const hostUri =
		Constants.expoConfig?.hostUri ??
		(Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
		'';

	if (hostUri) {
		// hostUri is  "192.168.x.x:8081" — take just the IP
		return hostUri.split(':')[0];
	}

	// Fallback for emulators / simulators
	return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

const API_PORT = 5000;

export const config = {
	BASE_URL: `http://localhost:${API_PORT}`, // Replace with your production URL when deploying
};

