import { useCallback, useState } from "react";

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
}

const API_ENDPOINT = "/api/career/voice/connection-details";
const ONE_MINUTE_MS = 60 * 1000;

export function useCareerConnectionDetails() {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(async () => {
    setConnectionDetails(null);
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ConnectionDetails = await res.json();
    setConnectionDetails(data);
    return data;
  }, []);

  const isExpired = useCallback(() => {
    const token = connectionDetails?.participantToken;
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!payload.exp) return true;
      return new Date() >= new Date(payload.exp * 1000 - ONE_MINUTE_MS);
    } catch {
      return true;
    }
  }, [connectionDetails?.participantToken]);

  const getOrRefresh = useCallback(async () => {
    if (isExpired() || !connectionDetails) return fetchConnectionDetails();
    return connectionDetails;
  }, [connectionDetails, fetchConnectionDetails, isExpired]);

  return { connectionDetails, fetchConnectionDetails, getOrRefresh };
}
