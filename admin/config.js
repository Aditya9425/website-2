// Mock Firebase services for testing
const mockAuth = {
    signInWithEmailAndPassword: async (email, password) => {
        if (email === 'admin@admin.com' && password === 'admin123') {
            const user = { email: email, uid: 'test-user-123' };
            localStorage.setItem('mockUser', JSON.stringify(user));
            if (window.mockAuthStateCallback) {
                window.mockAuthStateCallback(user);
            }
            return { user };
        } else {
            throw new Error('Invalid credentials');
        }
    },
    signOut: async () => {
        localStorage.removeItem('mockUser');
        if (window.mockAuthStateCallback) {
            window.mockAuthStateCallback(null);
        }
        return Promise.resolve();
    },
    onAuthStateChanged: (callback) => {
        window.mockAuthStateCallback = callback;
        const storedUser = localStorage.getItem('mockUser');
        if (storedUser) {
            callback(JSON.parse(storedUser));
        } else {
            callback(null);
        }
        return () => { window.mockAuthStateCallback = null; };
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
            limit: () => ({ get: async () => ({ docs: [] }) }),
            get: async () => ({ docs: [] })
        })
    })
};

window.firebaseServices = {
    auth: mockAuth,
    db: mockDb,
    storage: { ref: () => ({ put: async () => ({ ref: { getDownloadURL: async () => 'https://via.placeholder.com/300x300' } }) }) }
};