import { config } from '@/config';
import { ErrorBoundary } from '@/components/error-boundary';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

interface BloodRequest {
	id: string;
	bloodGroup: string;
	units: string;
	hospital: string;
	note: string;
	latitude: number;
	longitude: number;
	patientName?: string;
	patientId?: string;
	status: 'pending' | 'accepted';
	acceptedById?: string;
	acceptedByName?: string;
}

interface AuthUser {
	_id: string;
	name: string;
	bloodGroup?: string;
}

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Tokens = {
	primary: '#1a73e8',
	error: '#d93025',
	success: '#1e8e3e',
	warn: '#b06000',
	background: '#F8F9FA',
	surface: '#FFFFFF',
	border: '#DADCE0',
	textPrimary: '#202124',
	textMuted: '#5F6368',
	radius3xl: 24,
	radiusXl: 12,
};

export default function GoogleBloodApp() {
	const mapRef = useRef<MapView>(null);
	const [markers, setMarkers] = useState<BloodRequest[]>([]);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [currentRegion, setCurrentRegion] = useState<Region | undefined>(
		undefined,
	);
	const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
	const [submittingAction, setSubmittingAction] = useState(false);
	const [isBloodGroupPickerOpen, setIsBloodGroupPickerOpen] = useState(false);
	const [form, setForm] = useState({
		bloodGroup: '',
		units: '',
		hospital: '',
		note: '',
	});

	const getToken = useCallback(async (): Promise<string> => {
		const token = await AsyncStorage.getItem('userToken');

		if (!token) {
			throw new Error('Missing auth token');
		}

		return token;
	}, []);

	const getHeaders = useCallback(async () => {
		const token = await getToken();
		return { Authorization: `Bearer ${token}` };
	}, [getToken]);

	const mapRequestToMarker = (item: any): BloodRequest => ({
		id: item._id,
		bloodGroup: item.bloodGroup,
		units: String(item.units),
		hospital: item.hospital,
		note: item.note ?? '',
		latitude: item.location.coordinates[1],
		longitude: item.location.coordinates[0],
		patientName: item.patientName ?? item.patient?.name,
		patientId:
			typeof item.patient === 'string' ? item.patient : item.patient?._id,
		status: item.status,
		acceptedById:
			typeof item.acceptedBy === 'string'
				? item.acceptedBy
				: item.acceptedBy?._id,
		acceptedByName: item.acceptedBy?.name,
	});

	const fetchMapRequests = useCallback(async () => {
		const headers = await getHeaders();
		const response = await axios.get(`https://sea-turtle-app-635az.ondigitalocean.app/api/requests/nearby`, {
			headers,
		});

		setMarkers(response.data.map(mapRequestToMarker));
	}, [getHeaders]);

	const refreshMapRequests = useCallback(async () => {
		try {
			await fetchMapRequests();
		} catch (error) {
			console.log('Failed to refresh requests', error);
		}
	}, [fetchMapRequests]);

	const updateSelectedRequest = (request: any) => {
		const mappedRequest = mapRequestToMarker(request);
		setSelectedRequest(mappedRequest);
		setMarkers((prev) => {
			const existingIndex = prev.findIndex((item) => item.id === mappedRequest.id);

			if (existingIndex === -1) {
				return [...prev, mappedRequest];
			}

			const nextMarkers = [...prev];
			nextMarkers[existingIndex] = mappedRequest;
			return nextMarkers;
		});
	};

	const removeRequestFromMap = (requestId: string) => {
		setMarkers((prev) => prev.filter((item) => item.id !== requestId));
		setSelectedRequest(null);
	};

	useEffect(() => {
		(async () => {
			try {
				const headers = await getHeaders();
				const [{ data: authUser }, locationPermission] = await Promise.all([
					axios.get(`https://sea-turtle-app-635az.ondigitalocean.app/api/users/me`, { headers }),
					Location.requestForegroundPermissionsAsync(),
				]);

				setCurrentUser(authUser);

				if (locationPermission.status !== 'granted') {
					Alert.alert('Permission denied', 'Location is required.');
					await refreshMapRequests();
					return;
				}

				const loc = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.High,
				});

				const userRegion = {
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
					latitudeDelta: 0.01,
					longitudeDelta: 0.01,
				};

				setCurrentRegion(userRegion);

				try {
					await axios.patch(
						`https://sea-turtle-app-635az.ondigitalocean.app/api/users/location`,
						{
							latitude: loc.coords.latitude,
							longitude: loc.coords.longitude,
						},
						{ headers },
					);
				} catch (error) {
					console.log('Failed to sync user location', error);
				}

				await refreshMapRequests();
				mapRef.current?.animateToRegion(userRegion, 1500);
			} catch (error) {
				console.log('Failed to initialize map', error);
				Alert.alert('Error', 'Unable to load blood requests right now.');
			} finally {
				setLoading(false);
			}
		})();
	}, [getHeaders, refreshMapRequests]);

	const handleConfirmRequest = async () => {
		if (!form.bloodGroup || !form.hospital) {
			Alert.alert(
				'Missing Info',
				'Please fill in the Blood Group and Hospital.',
			);
			return;
		}

		try {
			const headers = await getHeaders();
			const loc = await Location.getCurrentPositionAsync({});
			const response = await axios.post(
				`https://sea-turtle-app-635az.ondigitalocean.app/api/requests`,
				{
					bloodGroup: form.bloodGroup,
					units: Number(form.units) || 1,
					hospital: form.hospital,
					note: form.note,
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
				},
				{ headers },
			);

			setMarkers((prev) => [...prev, mapRequestToMarker(response.data)]);
			setIsFormOpen(false);
			setIsBloodGroupPickerOpen(false);
			setForm({ bloodGroup: '', units: '', hospital: '', note: '' });
			Alert.alert('Success', 'Blood request posted successfully.');
		} catch (error) {
			console.log('Failed to post request', error);
			Alert.alert('Error', 'Unable to post your blood request right now.');
		}
	};

	const handleRequestAction = async (
		requestId: string,
		action: 'accept' | 'cancel' | 'complete',
	) => {
		try {
			setSubmittingAction(true);
			const headers = await getHeaders();
			const response = await axios.post(
				`https://sea-turtle-app-635az.ondigitalocean.app/api/requests/${requestId}/${action}`,
				{},
				{ headers },
			);

			if (action === 'complete') {
				removeRequestFromMap(requestId);
				Alert.alert('Approved', 'Blood received confirmed. Tracker removed.');
				return;
			}

			updateSelectedRequest(response.data);
			Alert.alert(
				'Updated',
				action === 'accept'
					? 'You accepted this blood request.'
					: 'The accepted donor was cancelled and the tracker is active again.',
			);
		} catch (error) {
			console.log(`Failed to ${action} request`, error);
			Alert.alert('Error', 'Unable to update this request right now.');
		} finally {
			setSubmittingAction(false);
		}
	};

	const getMarkerColor = (request: BloodRequest) => {
		if (request.status === 'accepted') {
			return request.acceptedById === currentUser?._id
				? Tokens.success
				: Tokens.primary;
		}

		return Tokens.error;
	};

	const isOwnRequest = selectedRequest?.patientId === currentUser?._id;
	const isAcceptedByCurrentUser =
		selectedRequest?.acceptedById === currentUser?._id;

	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator
					size='large'
					color={Tokens.primary}
				/>
				<Text style={styles.loadingText}>Initializing Google Maps...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ErrorBoundary>
			<MapView
				ref={mapRef}
				style={styles.map}
				showsUserLocation={true}
				initialRegion={currentRegion}
				onPress={() => setSelectedRequest(null)}
			>
				{markers.map((item) => (
					<Marker
						key={item.id}
						coordinate={{ latitude: item.latitude, longitude: item.longitude }}
						onPress={(e) => {
							e.stopPropagation();
							setSelectedRequest(item);
						}}
					>
						<View
							style={[
								styles.markerChip,
								{ backgroundColor: getMarkerColor(item) },
							]}
						>
							<Text style={styles.markerChipText}>{item.bloodGroup}</Text>
						</View>
					</Marker>
				))}
			</MapView>
			</ErrorBoundary>

			<Modal
				visible={!!selectedRequest}
				transparent
				animationType='fade'
			>
				<Pressable
					style={styles.dialogOverlay}
					onPress={() => setSelectedRequest(null)}
				>
					<View style={styles.dialogCard}>
						<Text style={styles.dialogTitle}>Blood Request</Text>

						<Text style={styles.label}>Requester</Text>
						<Text style={styles.dialogValue}>
							{selectedRequest?.patientName ?? 'Unknown requester'}
						</Text>

						<View style={styles.row}>
							<View style={{ flex: 1 }}>
								<Text style={styles.label}>Group</Text>
								<Text style={styles.dialogValue}>
									{selectedRequest?.bloodGroup}
								</Text>
							</View>
							<View style={{ flex: 1 }}>
								<Text style={styles.label}>Units</Text>
								<Text style={styles.dialogValue}>{selectedRequest?.units}</Text>
							</View>
						</View>

						<Text style={styles.label}>Hospital</Text>
						<Text style={styles.dialogValue}>{selectedRequest?.hospital}</Text>

						{selectedRequest?.note ? (
							<>
								<Text style={styles.label}>Note</Text>
								<Text style={styles.dialogValue}>{selectedRequest.note}</Text>
							</>
						) : null}

						{selectedRequest?.acceptedByName ? (
							<>
								<Text style={styles.label}>Accepted By</Text>
								<Text style={styles.dialogValue}>
									{selectedRequest.acceptedByName}
								</Text>
							</>
						) : null}

						{selectedRequest?.status === 'pending' && !isOwnRequest ? (
							<TouchableOpacity
								style={styles.primaryActionBtn}
								disabled={submittingAction}
								onPress={() =>
									handleRequestAction(selectedRequest.id, 'accept')
								}
							>
								<Text style={styles.primaryActionBtnText}>Donate Blood</Text>
							</TouchableOpacity>
						) : null}

						{selectedRequest?.status === 'pending' && isOwnRequest ? (
							<View style={styles.infoBadge}>
								<Text style={styles.infoBadgeText}>Waiting for donor</Text>
							</View>
						) : null}

						{selectedRequest?.status === 'accepted' && isOwnRequest ? (
							<View style={styles.actionStack}>
								<TouchableOpacity
									style={styles.primaryActionBtn}
									disabled={submittingAction}
									onPress={() =>
										handleRequestAction(selectedRequest.id, 'complete')
									}
								>
									<Text style={styles.primaryActionBtnText}>
										Approve Blood Received
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.secondaryActionBtn}
									disabled={submittingAction}
									onPress={() =>
										handleRequestAction(selectedRequest.id, 'cancel')
									}
								>
									<Text style={styles.secondaryActionBtnText}>
										Cancel Accepted Donor
									</Text>
								</TouchableOpacity>
							</View>
						) : null}

						{selectedRequest?.status === 'accepted' &&
						!isOwnRequest &&
						isAcceptedByCurrentUser ? (
							<View style={styles.infoBadgeAccepted}>
								<Text style={styles.infoBadgeAcceptedText}>
									Waiting for patient approval
								</Text>
							</View>
						) : null}

						{selectedRequest?.status === 'accepted' &&
						!isOwnRequest &&
						!isAcceptedByCurrentUser ? (
							<View style={styles.infoBadge}>
								<Text style={styles.infoBadgeText}>
									Already accepted by another donor
								</Text>
							</View>
						) : null}
					</View>
				</Pressable>
			</Modal>

			<View style={styles.footerContainer}>
				<Pressable
					onPress={() => setIsFormOpen(true)}
					style={({ pressed }) => [
						styles.primaryButton,
						pressed && { transform: [{ scale: 0.96 }] },
					]}
				>
					<Text style={styles.buttonText}>Request Blood Now</Text>
				</Pressable>
			</View>

			<Modal
				visible={isFormOpen}
				animationType='slide'
				transparent
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.modalOverlay}
				>
					<View style={styles.sheetContent}>
						<View style={styles.dragHandle} />
						<Text style={styles.heading}>New Request</Text>

						<ScrollView>
							<Text style={styles.label}>Blood Group</Text>
							<TouchableOpacity
								style={styles.selectInput}
								onPress={() =>
									setIsBloodGroupPickerOpen((previous) => !previous)
								}
							>
								<Text
									style={
										form.bloodGroup
											? styles.selectValue
											: styles.selectPlaceholder
									}
								>
									{form.bloodGroup || 'Select blood group'}
								</Text>
								<Text style={styles.selectChevron}>
									{isBloodGroupPickerOpen ? '▲' : '▼'}
								</Text>
							</TouchableOpacity>
							{isBloodGroupPickerOpen ? (
								<View style={styles.optionList}>
									{BLOOD_GROUP_OPTIONS.map((option) => (
										<TouchableOpacity
											key={option}
											style={styles.optionItem}
											onPress={() => {
												setForm({ ...form, bloodGroup: option });
												setIsBloodGroupPickerOpen(false);
											}}
										>
											<Text style={styles.optionText}>{option}</Text>
										</TouchableOpacity>
									))}
								</View>
							) : null}

							<View style={styles.row}>
								<View style={{ flex: 1 }}>
									<Text style={styles.label}>Units</Text>
									<TextInput
										style={styles.input}
										keyboardType='numeric'
										value={form.units}
										placeholder='1'
										onChangeText={(t) => setForm({ ...form, units: t })}
									/>
								</View>
								<View style={{ flex: 2 }}>
									<Text style={styles.label}>Hospital</Text>
									<TextInput
										style={styles.input}
										value={form.hospital}
										onChangeText={(t) => setForm({ ...form, hospital: t })}
									/>
								</View>
							</View>

							<Text style={styles.label}>Note</Text>
							<TextInput
								style={[styles.input, { height: 80 }]}
								multiline
								placeholder='Patient details or urgency...'
								value={form.note}
								onChangeText={(t) => setForm({ ...form, note: t })}
							/>

							<TouchableOpacity
								style={styles.submitBtn}
								onPress={handleConfirmRequest}
							>
								<Text style={styles.submitBtnText}>Post Request</Text>
							</TouchableOpacity>

							<Pressable
								onPress={() => {
									setIsFormOpen(false);
									setIsBloodGroupPickerOpen(false);
								}}
								style={{ padding: 16 }}
							>
								<Text
									style={{
										color: Tokens.textMuted,
										textAlign: 'center',
										fontWeight: '600',
									}}
								>
									Cancel
								</Text>
							</Pressable>
						</ScrollView>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	map: { flex: 1 },
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: Tokens.background,
	},
	loadingText: { marginTop: 12, color: Tokens.textMuted, fontWeight: '500' },
	markerChip: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: 'white',
		elevation: 4,
	},
	markerChipText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
	dialogOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	dialogCard: {
		width: '85%',
		backgroundColor: Tokens.surface,
		borderRadius: Tokens.radius3xl,
		padding: 24,
		elevation: 8,
	},
	dialogTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: Tokens.textPrimary,
		marginBottom: 16,
	},
	dialogValue: {
		fontSize: 16,
		color: Tokens.textPrimary,
		marginBottom: 12,
		fontWeight: '500',
	},
	footerContainer: {
		position: 'absolute',
		bottom: 40,
		width: '100%',
		paddingHorizontal: 24,
	},
	primaryButton: {
		backgroundColor: Tokens.primary,
		padding: 18,
		borderRadius: Tokens.radiusXl,
		alignItems: 'center',
		elevation: 6,
	},
	buttonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'flex-end',
	},
	sheetContent: {
		backgroundColor: Tokens.surface,
		borderTopLeftRadius: Tokens.radius3xl,
		borderTopRightRadius: Tokens.radius3xl,
		padding: 24,
		maxHeight: '85%',
	},
	dragHandle: {
		width: 40,
		height: 4,
		backgroundColor: '#E8EAED',
		borderRadius: 2,
		alignSelf: 'center',
		marginBottom: 20,
	},
	heading: {
		fontSize: 22,
		fontWeight: '700',
		color: Tokens.textPrimary,
		marginBottom: 10,
	},
	label: {
		fontSize: 12,
		fontWeight: '700',
		color: Tokens.textMuted,
		marginTop: 14,
		marginBottom: 4,
		textTransform: 'uppercase',
	},
	input: {
		borderWidth: 1,
		borderColor: Tokens.border,
		borderRadius: Tokens.radiusXl,
		padding: 14,
		fontSize: 16,
		backgroundColor: '#FAFAFA',
	},
	selectInput: {
		borderWidth: 1,
		borderColor: Tokens.border,
		borderRadius: Tokens.radiusXl,
		padding: 14,
		backgroundColor: '#FAFAFA',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	selectPlaceholder: {
		fontSize: 16,
		color: '#9CA3AF',
	},
	selectValue: {
		fontSize: 16,
		color: Tokens.textPrimary,
	},
	selectChevron: {
		fontSize: 12,
		color: Tokens.textMuted,
	},
	optionList: {
		borderWidth: 1,
		borderColor: Tokens.border,
		borderRadius: Tokens.radiusXl,
		backgroundColor: Tokens.surface,
		marginTop: 8,
		overflow: 'hidden',
	},
	optionItem: {
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F1F3F4',
	},
	optionText: {
		fontSize: 16,
		color: Tokens.textPrimary,
	},
	row: { flexDirection: 'row', gap: 12 },
	submitBtn: {
		backgroundColor: Tokens.primary,
		padding: 16,
		borderRadius: 100,
		alignItems: 'center',
		marginTop: 24,
	},
	submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
	actionStack: { gap: 10, marginTop: 10 },
	primaryActionBtn: {
		backgroundColor: Tokens.primary,
		padding: 14,
		borderRadius: 100,
		alignItems: 'center',
		marginTop: 10,
	},
	primaryActionBtnText: { color: '#FFF', fontWeight: '700' },
	secondaryActionBtn: {
		backgroundColor: '#fce8e6',
		padding: 14,
		borderRadius: 100,
		alignItems: 'center',
	},
	secondaryActionBtnText: { color: Tokens.error, fontWeight: '700' },
	infoBadge: {
		backgroundColor: '#f1f3f4',
		padding: 14,
		borderRadius: 16,
		marginTop: 10,
	},
	infoBadgeText: {
		color: Tokens.textMuted,
		fontWeight: '600',
		textAlign: 'center',
	},
	infoBadgeAccepted: {
		backgroundColor: '#e6f4ea',
		padding: 14,
		borderRadius: 16,
		marginTop: 10,
	},
	infoBadgeAcceptedText: {
		color: Tokens.success,
		fontWeight: '700',
		textAlign: 'center',
	},
});
