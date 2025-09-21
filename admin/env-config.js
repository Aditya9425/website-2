// Environment Configuration
// This file loads environment variables securely

class EnvConfig {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    loadConfig() {
        // Try to load from environment variables (Node.js style)
        if (typeof process !== 'undefined' && process.env) {
            this.config = {
                SUPABASE_URL: process.env.SUPABASE_URL,
                SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
            };
        } else {
            // For client-side, try to load from a secure endpoint or local config
            this.loadClientConfig();
        }
    }

    async loadClientConfig() {
        try {
            // Try to fetch from a secure endpoint first
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                this.config = config;
                return;
            }
        } catch (error) {
            console.warn('Could not load config from API endpoint');
        }

        // Fallback: Load from local secure config (you should create this file)
        try {
            const response = await fetch('./secure-config.json');
            if (response.ok) {
                const config = await response.json();
                this.config = config;
                return;
            }
        } catch (error) {
            console.warn('Could not load secure-config.json');
        }

        // Final fallback: Use placeholder values (should be replaced in production)
        console.error('⚠️ Using fallback configuration. Please set up proper environment variables.');
        this.config = {
            SUPABASE_URL: 'YOUR_SUPABASE_URL',
            SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
        };
    }

    get(key) {
        return this.config[key];
    }

    getSupabaseConfig() {
        return {
            url: this.get('SUPABASE_URL'),
            anonKey: this.get('SUPABASE_ANON_KEY')
        };
    }

    isConfigured() {
        const url = this.get('SUPABASE_URL');
        const key = this.get('SUPABASE_ANON_KEY');
        return url && key && url !== 'YOUR_SUPABASE_URL' && key !== 'YOUR_SUPABASE_ANON_KEY';
    }
}

// Create global instance
window.envConfig = new EnvConfig();