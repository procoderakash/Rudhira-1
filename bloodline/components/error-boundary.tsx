import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	handleRestart = (): void => {
		this.setState({ hasError: false, error: null });
	};

	render(): ReactNode {
		if (this.state.hasError) {
			return (
				<View style={styles.container}>
					<Text style={styles.emoji}>⚠️</Text>
					<Text style={styles.title}>Something went wrong</Text>
					<Text style={styles.message}>
						The app ran into an unexpected error. Please try again.
					</Text>
					{__DEV__ && this.state.error ? (
						<Text style={styles.errorDetail}>
							{this.state.error.message}
						</Text>
					) : null}
					<TouchableOpacity
						style={styles.button}
						onPress={this.handleRestart}
					>
						<Text style={styles.buttonText}>Try Again</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#F8F9FA',
		padding: 32,
	},
	emoji: {
		fontSize: 48,
		marginBottom: 16,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: '#202124',
		marginBottom: 8,
		textAlign: 'center',
	},
	message: {
		fontSize: 15,
		color: '#5F6368',
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 24,
	},
	errorDetail: {
		fontSize: 12,
		color: '#d93025',
		textAlign: 'center',
		marginBottom: 24,
		fontFamily: 'monospace',
		padding: 12,
		backgroundColor: '#fce8e6',
		borderRadius: 8,
		overflow: 'hidden',
		width: '100%',
	},
	button: {
		backgroundColor: '#1a73e8',
		paddingHorizontal: 32,
		paddingVertical: 14,
		borderRadius: 12,
	},
	buttonText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 16,
	},
});
