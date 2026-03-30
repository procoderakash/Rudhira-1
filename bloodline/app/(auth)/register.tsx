import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
	Animated,
	KeyboardAvoidingView,
	Platform,
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterScreen(): React.JSX.Element {
	const [name, setName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [phone, setPhone] = useState<string>('');
	const [bloodGroup, setBloodGroup] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [showPassword, setShowPassword] = useState<boolean>(false);

	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const snackbarAnim = useRef(new Animated.Value(0)).current;

	const queryClient = useQueryClient();
	const router = useRouter();

	const showSnackbar = (msg: string) => {
		setSnackbarMessage(msg);
		Animated.timing(snackbarAnim, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true,
		}).start();

		setTimeout(() => {
			Animated.timing(snackbarAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start();
		}, 3000);
	};

	const handleRegister = async (): Promise<void> => {
		try {
			const data = await axios.post(`https://sea-turtle-app-635az.ondigitalocean.app/api/auth/register`, {
				name,
				email,
				phone,
				bloodGroup,
				password,
			});

			console.log(data);

			if (data.status === 201 || data.status === 200) {
				if (data.data && data.data.token) {
					await AsyncStorage.setItem('userToken', data.data.token);
					console.log('success');
					router.navigate('/(tabs)');
					queryClient.invalidateQueries({ queryKey: ['auth'] });
				} else {
					// Navigate back to login
					router.navigate('/(auth)/login');
				}
			}
		} catch (err: any) {
			const errorMsg =
				err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Something went wrong';
			showSnackbar(errorMsg);
			console.log('error', err?.response?.data || err?.message);
		}
	};

	return (
		<SafeAreaView style={styles.safe}>
			<StatusBar barStyle='light-content' />
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.kav}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					{/* ── Header ── */}
					<View style={styles.header}>
						<View style={styles.logoBox}>
							<Text style={styles.logoLetter}>A</Text>
						</View>
						<Text style={styles.title}>Create Account</Text>
						<Text style={styles.subtitle}>Sign up to get started</Text>
					</View>

					{/* ── Form Card ── */}
					<View style={styles.card}>
						{/* Name */}
						<View style={styles.fieldGroup}>
							<Text style={styles.label}>Full Name</Text>
							<View style={styles.inputWrapper}>
								<Text style={styles.inputIcon}>📝</Text>
								<TextInput
									style={styles.input}
									placeholder='Enter your full name'
									placeholderTextColor='#9CA3AF'
									value={name}
									onChangeText={setName}
									autoCapitalize='words'
									autoCorrect={false}
									returnKeyType='next'
								/>
							</View>
						</View>

						{/* Email */}
						<View style={styles.fieldGroup}>
							<Text style={styles.label}>Email</Text>
							<View style={styles.inputWrapper}>
								<Text style={styles.inputIcon}>✉️</Text>
								<TextInput
									style={styles.input}
									placeholder='Enter your email'
									placeholderTextColor='#9CA3AF'
									value={email}
									onChangeText={setEmail}
									autoCapitalize='none'
									keyboardType='email-address'
									autoCorrect={false}
									returnKeyType='next'
								/>
							</View>
						</View>

						{/* Phone */}
						<View style={styles.fieldGroup}>
							<Text style={styles.label}>Phone Number</Text>
							<View style={styles.inputWrapper}>
								<Text style={styles.inputIcon}>📞</Text>
								<TextInput
									style={styles.input}
									placeholder='Enter your phone number'
									placeholderTextColor='#9CA3AF'
									value={phone}
									onChangeText={setPhone}
									keyboardType='phone-pad'
									returnKeyType='next'
								/>
							</View>
						</View>

						{/* Blood Group */}
						<View style={styles.fieldGroup}>
							<Text style={styles.label}>Blood Group</Text>
							<View style={styles.bloodGroupContainer}>
								{BLOOD_GROUPS.map((bg) => (
									<TouchableOpacity
										key={bg}
										style={[
											styles.bloodGroupChip,
											bloodGroup === bg && styles.bloodGroupChipActive,
										]}
										onPress={() => setBloodGroup(bg)}
										activeOpacity={0.7}
									>
										<Text
											style={[
												styles.bloodGroupText,
												bloodGroup === bg && styles.bloodGroupTextActive,
											]}
										>
											{bg}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						{/* Password */}
						<View style={styles.fieldGroup}>
							<Text style={styles.label}>Password</Text>
							<View style={styles.inputWrapper}>
								<Text style={styles.inputIcon}>🔒</Text>
								<TextInput
									style={[styles.input, { flex: 1 }]}
									placeholder='Create a password'
									placeholderTextColor='#9CA3AF'
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!showPassword}
									returnKeyType='done'
									onSubmitEditing={handleRegister}
								/>
								<TouchableOpacity
									onPress={() => setShowPassword((prev) => !prev)}
									style={styles.eyeBtn}
								>
									<Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* Register button */}
						<TouchableOpacity
							style={styles.registerBtn}
							activeOpacity={0.85}
							onPress={handleRegister}
						>
							<Text style={styles.registerBtnText}>Sign Up</Text>
						</TouchableOpacity>

						{/* Login Link */}
						<View style={styles.loginRow}>
							<Text style={styles.loginText}>Already have an account? </Text>
							<TouchableOpacity onPress={() => router.push('/(auth)/login')}>
								<Text style={styles.loginLink}>Sign In</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Snackbar */}
			<Animated.View
				style={[
					styles.snackbar,
					{
						transform: [
							{
								translateY: snackbarAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [100, 0],
								}),
							},
						],
						opacity: snackbarAnim,
					},
				]}
				pointerEvents='none'
			>
				<Text style={styles.snackbarText}>{snackbarMessage}</Text>
			</Animated.View>
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
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingHorizontal: 24,
		paddingVertical: 24,
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

	// Blood Group
	bloodGroupContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 4,
	},
	bloodGroupChip: {
		backgroundColor: DARK_BG,
		borderWidth: 1,
		borderColor: BORDER,
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 12,
		minWidth: 54,
		alignItems: 'center',
	},
	bloodGroupChipActive: {
		backgroundColor: ACCENT,
		borderColor: ACCENT,
	},
	bloodGroupText: {
		color: MUTED,
		fontSize: 14,
		fontWeight: '600',
	},
	bloodGroupTextActive: {
		color: '#fff',
	},

	// Button
	registerBtn: {
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
		marginTop: 16,
	},
	registerBtnText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 0.5,
	},

	// Login Link
	loginRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 24,
	},
	loginText: {
		color: MUTED,
		fontSize: 14,
	},
	loginLink: {
		color: ACCENT,
		fontSize: 14,
		fontWeight: '600',
	},

	// Snackbar
	snackbar: {
		position: 'absolute',
		bottom: Platform.OS === 'ios' ? 40 : 20,
		left: 20,
		right: 20,
		backgroundColor: '#EF4444', 
		padding: 16,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#EF4444',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 6,
	},
	snackbarText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
		textAlign: 'center',
	},
});
