import { config } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	RefreshControl,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

interface BloodRequest {
	id: string;
	bloodGroup: string;
	units: number;
	location: string;
	date: string;
	hospital: string;
	status: 'pending' | 'accepted' | 'completed';
	acceptedByName?: string;
	acceptedByPhone?: string;
}

interface BloodDonation {
	id: string;
	bloodGroup: string;
	units: number;
	location: string;
	date: string;
	patientName: string;
	hospital: string;
	status: 'accepted' | 'completed';
}

const Tokens = {
	primary: '#1a73e8',
	background: '#FFFFFF',
	border: '#DADCE0',
	textPrimary: '#202124',
	textMuted: '#5F6368',
	error: '#d93025',
	success: '#1e8e3e',
	warn: '#b06000',
};

export default function BloodActivityPage() {
	const [activeTab, setActiveTab] = useState<'Requests' | 'Donations'>(
		'Requests',
	);
	const [requests, setRequests] = useState<BloodRequest[]>([]);
	const [donations, setDonations] = useState<BloodDonation[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const formatDate = (value: string): string =>
		new Date(value).toLocaleString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});

	const formatLocation = (coordinates?: number[]): string => {
		if (!coordinates || coordinates.length < 2) {
			return 'Location unavailable';
		}

		return `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`;
	};

	const getStatusColors = (status: string) => {
		if (status === 'accepted') {
			return { backgroundColor: '#e8f0fe', color: Tokens.primary };
		}

		if (status === 'completed') {
			return { backgroundColor: '#e6f4ea', color: Tokens.success };
		}

		return { backgroundColor: '#fce8e6', color: Tokens.error };
	};

	const getAuthHeaders = async () => {
		const token = await AsyncStorage.getItem('userToken');

		if (!token) {
			throw new Error('Missing auth token');
		}

		return { Authorization: `Bearer ${token}` };
	};

	const fetchBloodActivity = useCallback(async () => {
		try {
			const headers = await getAuthHeaders();
			const [requestResponse, donationResponse] = await Promise.all([
				axios.get(`https://sea-turtle-app-635az.ondigitalocean.app/api/requests/mine`, { headers }),
				axios.get(`https://sea-turtle-app-635az.ondigitalocean.app/api/requests/my-donations`, { headers }),
			]);

			setRequests(
				requestResponse.data.map((item: any) => ({
					id: item._id,
					bloodGroup: item.bloodGroup,
					units: item.units,
					location: formatLocation(item.location?.coordinates),
					date: formatDate(item.createdAt),
					hospital: item.hospital,
					status: item.status,
					acceptedByName: item.acceptedBy?.name,
					acceptedByPhone: item.acceptedBy?.phone,
				})),
			);

			setDonations(
				donationResponse.data.map((item: any) => ({
					id: item._id,
					bloodGroup: item.bloodGroup,
					units: item.units,
					location: formatLocation(item.location?.coordinates),
					date: formatDate(
						item.completedAt ?? item.acceptedAt ?? item.updatedAt,
					),
					patientName:
						item.patientName ?? item.patient?.name ?? 'Unknown patient',
					hospital: item.hospital,
					status: item.status,
				})),
			);
		} catch (error) {
			console.log('Failed to load blood exchange data', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		fetchBloodActivity();
	}, [fetchBloodActivity]);

	const handleRefresh = () => {
		setRefreshing(true);
		fetchBloodActivity();
	};

	const updateRequestStatus = async (
		id: string,
		action: 'complete' | 'cancel',
	) => {
		try {
			const headers = await getAuthHeaders();
			await axios.post(
				`https://sea-turtle-app-635az.ondigitalocean.app/api/requests/${id}/${action}`,
				{},
				{ headers },
			);
			await fetchBloodActivity();
			Alert.alert(
				'Updated',
				action === 'complete'
					? 'Blood receipt approved. The tracker is now removed from the map.'
					: 'Accepted donor cancelled. The tracker is now active again.',
			);
		} catch (error) {
			console.log(`Failed to ${action} request`, error);
			Alert.alert('Error', 'Unable to update this request right now.');
		}
	};

	const renderRequestItem = ({ item }: { item: BloodRequest }) => {
		const statusColors = getStatusColors(item.status);

		return (
			<View style={styles.card}>
				<View style={styles.cardHeader}>
					<View
						style={[
							styles.badge,
							{ backgroundColor: statusColors.backgroundColor },
						]}
					>
						<Text style={[styles.badgeText, { color: statusColors.color }]}>
							{item.status}
						</Text>
					</View>
					<Text style={styles.dateText}>{item.date}</Text>
				</View>
				<Text style={styles.cardTitle}>{item.bloodGroup} Required</Text>
				<Text style={styles.cardSubtitle}>
					{item.hospital} • {item.units} Units
				</Text>
				<Text style={styles.metaText}>Location: {item.location}</Text>
				{item.acceptedByName ? (
					<Text style={styles.metaText}>
						Accepted By: {item.acceptedByName}
						{item.acceptedByPhone ? ` (${item.acceptedByPhone})` : ''}
					</Text>
				) : (
					<Text style={styles.metaText}>Waiting for a donor</Text>
				)}
				{item.status === 'accepted' ? (
					<View style={styles.actionRow}>
						<TouchableOpacity
							style={[styles.secondaryButton, styles.halfButton]}
							onPress={() => updateRequestStatus(item.id, 'cancel')}
						>
							<Text style={styles.secondaryButtonText}>Cancel Donor</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.primaryButton, styles.halfButton]}
							onPress={() => updateRequestStatus(item.id, 'complete')}
						>
							<Text style={styles.primaryButtonText}>Approve Received</Text>
						</TouchableOpacity>
					</View>
				) : null}
			</View>
		);
	};

	const renderDonationItem = ({ item }: { item: BloodDonation }) => {
		const statusColors = getStatusColors(item.status);

		return (
			<View style={styles.card}>
				<View style={styles.cardHeader}>
					<View
						style={[
							styles.badge,
							{ backgroundColor: statusColors.backgroundColor },
						]}
					>
						<Text style={[styles.badgeText, { color: statusColors.color }]}>
							{item.status}
						</Text>
					</View>
					<Text style={styles.dateText}>{item.date}</Text>
				</View>
				<Text style={styles.cardTitle}>{item.bloodGroup} Donation</Text>
				<Text style={styles.cardSubtitle}>
					Patient: {item.patientName} • {item.units} Unit
				</Text>
				<Text style={styles.metaText}>Hospital: {item.hospital}</Text>
				<Text style={styles.metaText}>Location: {item.location}</Text>
			</View>
		);
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loaderContainer}>
					<ActivityIndicator
						size='large'
						color={Tokens.primary}
					/>
					<Text style={styles.emptyText}>Loading blood exchange data...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<StatusBar barStyle='dark-content' />
			<View style={styles.tabBar}>
				{(['Requests', 'Donations'] as const).map((tab) => (
					<TouchableOpacity
						key={tab}
						onPress={() => setActiveTab(tab)}
						style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
					>
						<Text
							style={[
								styles.tabLabel,
								activeTab === tab && styles.tabLabelActive,
							]}
						>
							{tab}
						</Text>
						{activeTab === tab && <View style={styles.activeIndicator} />}
					</TouchableOpacity>
				))}
			</View>

			<FlatList
				data={activeTab === 'Requests' ? requests : donations}
				renderItem={
					activeTab === 'Requests' ? renderRequestItem : renderDonationItem
				}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
					/>
				}
				ListEmptyComponent={
					<Text style={styles.emptyText}>
						{activeTab === 'Requests'
							? 'No blood requests created yet'
							: 'No donation activity yet'}
					</Text>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Tokens.background },
	loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	tabBar: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: Tokens.border,
	},
	tabItem: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 16,
		position: 'relative',
	},
	tabItemActive: { backgroundColor: '#f1f3f4' },
	tabLabel: { fontSize: 14, fontWeight: '500', color: Tokens.textMuted },
	tabLabelActive: { color: Tokens.primary, fontWeight: '600' },
	activeIndicator: {
		position: 'absolute',
		bottom: 0,
		width: '40%',
		height: 3,
		backgroundColor: Tokens.primary,
		borderTopLeftRadius: 3,
		borderTopRightRadius: 3,
	},
	listContent: { padding: 16, flexGrow: 1 },
	card: {
		backgroundColor: Tokens.background,
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: Tokens.border,
	},
	cardHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	cardTitle: { fontSize: 18, fontWeight: '700', color: Tokens.textPrimary },
	cardSubtitle: { fontSize: 14, color: Tokens.textMuted, marginTop: 4 },
	metaText: { fontSize: 13, color: Tokens.textMuted, marginTop: 10 },
	badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
	badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
	dateText: { fontSize: 12, color: Tokens.textMuted },
	actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
	halfButton: { flex: 1 },
	primaryButton: {
		backgroundColor: Tokens.primary,
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
	},
	primaryButtonText: { color: '#fff', fontWeight: '700' },
	secondaryButton: {
		backgroundColor: '#fce8e6',
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: 'center',
	},
	secondaryButtonText: { color: Tokens.error, fontWeight: '700' },
	emptyText: { textAlign: 'center', marginTop: 40, color: Tokens.textMuted },
});
