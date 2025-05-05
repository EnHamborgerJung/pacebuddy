import { writable } from 'svelte/store';

export interface UserData {
    id?: string;
    email?: string;
    isAuthenticated: boolean;
    username?: string;
}

export const user = writable<UserData>({
    isAuthenticated: false
});

// Function to update user data
export const updateUser = (userData: Partial<UserData>) => {
    user.update(currentData => ({
        ...currentData,
        ...userData
    }));
};

// Function to clear user data on logout
export const clearUser = () => {
    user.set({ isAuthenticated: false });
}; 