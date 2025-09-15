// Temporary Test Configuration (for testing purposes only)
// In production, replace this with actual Firebase configuration

// Mock Firebase services for testing
const mockAuth = {
    signInWithEmailAndPassword: async (email, password) => {
        console.log('Mock auth: Attempting login with:', email, password);
        
        // Hardcoded test credentials
        if (email === 'adityabathla9@gmail.com' && password === 'Aditya14') {
            console.log('Mock auth: Login successful');
            const user = {
                email: email,
                uid: 'test-user-123'
            };
            
            // Store user in localStorage for persistence
            localStorage.setItem('mockUser', JSON.stringify(user));
            
            // Trigger auth state change
            if (window.mockAuthStateCallback) {
                console.log('Mock auth: Triggering auth state change with user');
                window.mockAuthStateCallback(user);
            }
            
            return { user };
        } else {
            console.log('Mock auth: Login failed - invalid credentials');
            throw new Error('Invalid credentials');
        }
    },
    signOut: async () => {
        console.log('Mock auth: Signing out');
        // Remove user from localStorage
        localStorage.removeItem('mockUser');
        
        // Trigger auth state change
        if (window.mockAuthStateCallback) {
            console.log('Mock auth: Triggering auth state change with null');
            window.mockAuthStateCallback(null);
        }
        
        return Promise.resolve();
    },
    onAuthStateChanged: (callback) => {
        console.log('Mock auth: Setting up auth state listener');
        // Store callback for later use
        window.mockAuthStateCallback = callback;
        
        // Check if user is already logged in
        const storedUser = localStorage.getItem('mockUser');
        if (storedUser) {
            console.log('Mock auth: Found stored user, triggering callback');
            callback(JSON.parse(storedUser));
        } else {
            console.log('Mock auth: No stored user, triggering callback with null');
            callback(null);
        }
        
        // Return unsubscribe function
        return () => {
            console.log('Mock auth: Unsubscribing from auth state');
            window.mockAuthStateCallback = null;
        };
    }
};

const mockDb = {
    collection: () => ({
        get: async () => ({ size: 0, docs: [] }),
        add: async () => ({ id: 'test-id' }),
        doc: () => ({
            update: async () => Promise.resolve(),
            delete: async () => Promise.resolve()
        }),
        orderBy: () => ({
            limit: () => ({
                get: async () => ({ docs: [] })
            }),
            get: async () => ({ docs: [] })
        })
    })
};

const mockStorage = {
    ref: () => ({
        put: async () => ({
            ref: {
                getDownloadURL: async () => 'https://via.placeholder.com/300x300'
            }
        })
    })
};

// Export mock services for testing
window.firebaseServices = {
    auth: mockAuth,
    db: mockDb,
    storage: mockStorage
};

console.log('Using mock Firebase services for testing. Replace with real Firebase config for production.');
