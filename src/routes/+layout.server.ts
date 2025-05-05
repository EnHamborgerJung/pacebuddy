import { validateSessionToken, sessionCookieName } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const sessionToken = cookies.get(sessionCookieName);
    
    if (!sessionToken) {
        return {
            user: null
        };
    }

    const { user } = await validateSessionToken(sessionToken);
    
    if (!user) {
        return {
            user: null
        };
    }

    return {
        user: {
            id: user.id,
            username: user.username,
            isAuthenticated: true
        }
    };
}; 