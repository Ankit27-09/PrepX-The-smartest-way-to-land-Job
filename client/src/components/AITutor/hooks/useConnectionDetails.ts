import { useCallback, useEffect, useState } from 'react';
import type { ConnectionDetails } from '../types';

const API_ENDPOINT = '/api/ai-tutor/connection-details';
const ONE_MINUTE_IN_MILLISECONDS = 60 * 1000;

export default function useConnectionDetails() {
    const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);

    const fetchConnectionDetails = useCallback(async () => {
        setConnectionDetails(null);

        try {
            const res = await fetch(API_ENDPOINT);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data: ConnectionDetails = await res.json();
            setConnectionDetails(data);
            return data;
        } catch (error) {
            console.error('Error fetching connection details:', error);
            throw new Error('Error fetching connection details!');
        }
    }, []);

    useEffect(() => {
        fetchConnectionDetails();
    }, [fetchConnectionDetails]);

    const isConnectionDetailsExpired = useCallback(() => {
        const token = connectionDetails?.participantToken;
        if (!token) {
            return true;
        }

        try {
            // Decode JWT payload (base64)
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload.exp) {
                return true;
            }
            const expiresAt = new Date((payload.exp * 1000) - ONE_MINUTE_IN_MILLISECONDS);
            const now = new Date();
            return now >= expiresAt;
        } catch {
            return true;
        }
    }, [connectionDetails?.participantToken]);

    const existingOrRefreshConnectionDetails = useCallback(async () => {
        if (isConnectionDetailsExpired() || !connectionDetails) {
            return fetchConnectionDetails();
        } else {
            return connectionDetails;
        }
    }, [connectionDetails, fetchConnectionDetails, isConnectionDetailsExpired]);

    return {
        connectionDetails,
        refreshConnectionDetails: fetchConnectionDetails,
        existingOrRefreshConnectionDetails,
    };
}
