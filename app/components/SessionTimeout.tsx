
'use client';

import { useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';

export default function SessionTimeout() {
    const { data: session } = useSession();
    const TIMEOUT_IN_MS = 3 * 60 * 1000; // 3 minutes

    const logout = useCallback(() => {
        signOut({ callbackUrl: '/login' });
    }, []);

    useEffect(() => {
        if (!session) return;

        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(logout, TIMEOUT_IN_MS);
        };

        // Events to monitor for activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // Initialize timer
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [session, logout]);

    return null; // This component doesn't render anything
}
