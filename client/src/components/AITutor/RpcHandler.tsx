import { useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import toast from 'react-hot-toast';

export function RpcHandler() {
    const room = useRoomContext();

    useEffect(() => {
        if (!room) return;

        const handleShowNotification = async (data: unknown): Promise<string> => {
            try {
                const rpcData = data as { payload?: string };
                if (!rpcData || rpcData.payload === undefined) {
                    return 'Error: Invalid RPC data format';
                }

                const payload = typeof rpcData.payload === 'string'
                    ? JSON.parse(rpcData.payload)
                    : rpcData.payload;
                const notificationType = payload?.type;

                if (typeof notificationType !== 'string' || notificationType.trim() === '') {
                    return 'Error: Invalid or missing notification type';
                }

                // Handle different notification types
                if (notificationType === 'session_summary_sent') {
                    const emailAddress = payload?.email_address;
                    if (typeof emailAddress === 'string' && emailAddress.trim() !== '') {
                        toast.success(`Session summary sent to ${emailAddress}!`, {
                            duration: 5000,
                            icon: '📧',
                        });
                    }
                    return 'Notification shown';
                }

                return 'Unknown notification type';
            } catch (err) {
                console.error('RPC Handler error:', err);
                return 'Error: ' + (err instanceof Error ? err.message : String(err));
            }
        };

        room.localParticipant.registerRpcMethod('client.showNotification', handleShowNotification);

        return () => {
            room.localParticipant.unregisterRpcMethod('client.showNotification');
        };
    }, [room]);

    return null;
}
