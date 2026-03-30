import { config } from '@/config';
import { authQuery } from '@/query/auth.query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

const handleForgotPassword = (): void => {
	console.log('handleForgotPassword called');
};

export default function LoginScreen(): React.JSX.Element {
	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const queryClient = useQueryClient();
	const { data: authUser } = useQuery(authQuery);
	const router = useRouter();
	const handleLogin = async (
		username: string,
		password: string,
	): Promise<void> => {
		try {
			const data = await axios.post(`https://sea-turtle-app-635az.ondigitalocean.app/api/auth/login`, {
				email: username,
				password: password,
			});

			console.log(data);


			if (data.status === 200) {
				await AsyncStorage.setItem('userToken', data.data.token);
				console.log('success');
				router.navigate('/(tabs)');
				queryClient.invalidateQueries({ queryKey: ['auth'] });
			}
		} catch (err: any) {
			console.log('error', err?.message);
		}
	};

	useEffect(() => {
		if (authUser) router.navigate('/(tabs)');
	}, [authUser, router]);

	return (
		<SafeAreaView style={styles.safe}>
			<StatusBar barStyle='light-content' />
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.kav}
			>
				{/* ── Header ── */}
				<View style={styles.header}>
					<View style={styles.logoBox}>
						<Text style={styles.logoLetter}>A</Text>
					</View>
					<Text style={styles.title}>Welcome Back</Text>
					<Text style={styles.subtitle}>Sign in to continue</Text>
				</View>

				{/* ── Form Card ── */}
				<View style={styles.card}>
					{/* Username */}
					<View style={styles.fieldGroup}>
						<Text style={styles.label}>Username</Text>
						<View style={styles.inputWrapper}>
							<Text style={styles.inputIcon}>👤</Text>
							<TextInput
								style={styles.input}
								placeholder='Enter your username'
								placeholderTextColor='#9CA3AF'
								value={username}
								onChangeText={(text: string) => setUsername(text)}
								autoCapitalize='none'
								autoCorrect={false}
								returnKeyType='next'
							/>
						</View>
					</View>

					{/* Password */}
					<View style={styles.fieldGroup}>
						<Text style={styles.label}>Password</Text>
						<View style={styles.inputWrapper}>
							<Text style={styles.inputIcon}>🔒</Text>
							<TextInput
								style={[styles.input, { flex: 1 }]}
								placeholder='Enter your password'
								placeholderTextColor='#9CA3AF'
								value={password}
								onChangeText={(text: string) => setPassword(text)}
								secureTextEntry={!showPassword}
								returnKeyType='done'
								onSubmitEditing={() => handleLogin(username, password)}
							/>
							<TouchableOpacity
								onPress={() => setShowPassword((prev: boolean) => !prev)}
								style={styles.eyeBtn}
							>
								<Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Forgot password */}
					<TouchableOpacity
						style={styles.forgotRow}
						onPress={handleForgotPassword}
					>
						<Text style={styles.forgotText}>Forgot password?</Text>
					</TouchableOpacity>

					{/* Login button */}
					<TouchableOpacity
						style={styles.loginBtn}
						activeOpacity={0.85}
						onPress={() => handleLogin(username, password)}
					>
						<Text style={styles.loginBtnText}>Sign In</Text>
					</TouchableOpacity>

					{/* Register Link */}
					<View style={styles.registerRow}>
						<Text style={styles.registerText}>Don't have an account? </Text>
						<TouchableOpacity onPress={() => router.push('/(auth)/register')}>
							<Text style={styles.registerLink}>Sign Up</Text>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const DARK_BG = '#0F172A';
const CARD_BG = '#1E293B';
const ACCENT = '#6366F1';
const BORDER = '#334155';
const TEXT = '#F1F5F9';
const MUTED = '#94A3B8';

const styles = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: DARK_BG,
	},
	kav: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 24,
	},

	// Header
	header: {
		alignItems: 'center',
		marginBottom: 32,
	},
	logoBox: {
		width: 64,
		height: 64,
		borderRadius: 20,
		backgroundColor: ACCENT,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		shadowColor: ACCENT,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.45,
		shadowRadius: 16,
		elevation: 10,
	},
	logoLetter: {
		fontSize: 28,
		fontWeight: '800',
		color: '#fff',
	},
	title: {
		fontSize: 26,
		fontWeight: '700',
		color: TEXT,
		letterSpacing: 0.4,
	},
	subtitle: {
		fontSize: 14,
		color: MUTED,
		marginTop: 4,
	},

	// Card
	card: {
		backgroundColor: CARD_BG,
		borderRadius: 24,
		padding: 24,
		borderWidth: 1,
		borderColor: BORDER,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.3,
		shadowRadius: 24,
		elevation: 12,
	},

	// Fields
	fieldGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 12,
		fontWeight: '600',
		color: MUTED,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
		marginBottom: 8,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: DARK_BG,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: BORDER,
		paddingHorizontal: 14,
		height: 52,
	},
	inputIcon: {
		fontSize: 16,
		marginRight: 10,
	},
	input: {
		flex: 1,
		color: TEXT,
		fontSize: 15,
	},
	eyeBtn: {
		paddingLeft: 8,
	},
	eyeIcon: {
		fontSize: 16,
	},

	// Forgot
	forgotRow: {
		alignItems: 'flex-end',
		marginBottom: 24,
		marginTop: 4,
	},
	forgotText: {
		fontSize: 13,
		color: ACCENT,
		fontWeight: '500',
	},

	// Button
	loginBtn: {
		backgroundColor: ACCENT,
		borderRadius: 14,
		height: 52,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: ACCENT,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.4,
		shadowRadius: 12,
		elevation: 8,
	},
	loginBtnText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 0.5,
	},

	// Register Link
	registerRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 24,
	},
	registerText: {
		color: MUTED,
		fontSize: 14,
	},
	registerLink: {
		color: ACCENT,
		fontSize: 14,
		fontWeight: '600',
	},
});
