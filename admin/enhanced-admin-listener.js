// Enhanced Admin Panel Listener for Real-time Stock Updates

class AdminStockListener {
    constructor() {
        this.isAdminPage = window.location.pathname.includes('admin');
        this.refreshTimeout = null;
        this.init();
    }
    
    init() {
        if (!this.isAdminPage) return;
        
        console.log('🎯 Initializing Enhanced Admin Stock Listener...');
        
        // Method 1: Listen for custom events
        this.setupCustomEventListeners();
        
        // Method 2: Listen for localStorage changes
        this.setupLocalStorageListener();
        
        // Method 3: Listen for BroadcastChannel messages
        this.setupBroadcastChannelListener();
        
        // Method 4: Poll for admin notifications
        this.setupNotificationPolling();
        
        // Method 5: Enhanced Supabase real-time subscriptions
        this.setupEnhancedRealtimeSubscriptions();
        
        console.log('✅ Enhanced Admin Stock Listener initialized');
    }
    
    setupCustomEventListeners() {
        window.addEventListener('stockUpdated', (event) => {
            console.log('📢 Admin: Stock update event received:', event.detail);
            this.triggerAdminRefresh('Custom Event');
        });
    }
    
    setupLocalStorageListener() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'adminStockTrigger') {
                console.log('📢 Admin: Stock trigger via localStorage');
                this.triggerAdminRefresh('localStorage');
            }
        });
        
        // Also check localStorage periodically
        setInterval(() => {
            const trigger = localStorage.getItem('adminStockTrigger');
            if (trigger) {
                try {
                    const data = JSON.parse(trigger);
                    const now = Date.now();
                    // If trigger is less than 30 seconds old, process it
                    if (now - data.timestamp < 30000) {
                        console.log('📢 Admin: Processing localStorage trigger:', data);
                        this.triggerAdminRefresh('localStorage Poll');
                        // Clear the trigger to prevent repeated processing
                        localStorage.removeItem('adminStockTrigger');
                    }
                } catch (e) {
                    console.warn('Invalid adminStockTrigger data:', e);
                }
            }
        }, 2000);
    }
    
    setupBroadcastChannelListener() {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('admin-updates');
            channel.addEventListener('message', (event) => {
                if (event.data.type === 'STOCK_UPDATED') {
                    console.log('📢 Admin: Update via BroadcastChannel:', event.data);
                    this.triggerAdminRefresh('BroadcastChannel');
                }
            });
        }
    }
    
    setupNotificationPolling() {
        // Poll for admin notifications every 5 seconds
        setInterval(async () => {
            try {
                const { data, error } = await supabase
                    .from('admin_notifications')
                    .select('*')
                    .eq('read', false)
                    .eq('type', 'STOCK_CHANGE')
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (data && data.length > 0) {
                    console.log('📢 Admin: New notifications found:', data.length);
                    this.triggerAdminRefresh('Notification Poll');
                    
                    // Mark notifications as read
                    const notificationIds = data.map(n => n.id);
                    await supabase
                        .from('admin_notifications')
                        .update({ read: true })
                        .in('id', notificationIds);
                }
            } catch (error) {
                console.warn('Notification polling error:', error);
            }
        }, 5000);
    }
    
    setupEnhancedRealtimeSubscriptions() {
        // Subscribe to products table changes
        const productsSubscription = supabase
            .channel('admin-products-changes')
            .on('postgres_changes', {\n                event: 'UPDATE',\n                schema: 'public',\n                table: 'products',\n                filter: 'stock=lt.10'\n            }, (payload) => {\n                console.log('📢 Admin: Product stock updated via realtime:', payload);\n                this.triggerAdminRefresh('Realtime Products');\n            })\n            .subscribe();\n        \n        // Subscribe to orders table for new orders\n        const ordersSubscription = supabase\n            .channel('admin-orders-changes')\n            .on('postgres_changes', {\n                event: 'INSERT',\n                schema: 'public',\n                table: 'orders'\n            }, (payload) => {\n                console.log('📢 Admin: New order via realtime:', payload);\n                this.triggerAdminRefresh('Realtime Orders');\n            })\n            .subscribe();\n        \n        // Subscribe to admin notifications\n        const notificationsSubscription = supabase\n            .channel('admin-notifications-changes')\n            .on('postgres_changes', {\n                event: 'INSERT',\n                schema: 'public',\n                table: 'admin_notifications'\n            }, (payload) => {\n                console.log('📢 Admin: New notification via realtime:', payload);\n                this.triggerAdminRefresh('Realtime Notifications');\n            })\n            .subscribe();\n    }\n    \n    triggerAdminRefresh(source) {\n        console.log(`🔄 Admin: Triggering refresh from ${source}`);\n        \n        // Debounce multiple rapid calls\n        if (this.refreshTimeout) {\n            clearTimeout(this.refreshTimeout);\n        }\n        \n        this.refreshTimeout = setTimeout(() => {\n            this.performAdminRefresh(source);\n        }, 1000);\n    }\n    \n    async performAdminRefresh(source) {\n        console.log(`🔄 Admin: Performing refresh triggered by ${source}`);\n        \n        try {\n            // Method 1: Call admin panel functions if available\n            if (typeof window.adminPanel !== 'undefined') {\n                if (window.adminPanel.loadProducts) {\n                    console.log('🔄 Calling adminPanel.loadProducts()');\n                    await window.adminPanel.loadProducts();\n                }\n                if (window.adminPanel.loadDashboardData) {\n                    console.log('🔄 Calling adminPanel.loadDashboardData()');\n                    await window.adminPanel.loadDashboardData();\n                }\n                if (window.adminPanel.refreshStockAlerts) {\n                    console.log('🔄 Calling adminPanel.refreshStockAlerts()');\n                    await window.adminPanel.refreshStockAlerts();\n                }\n            }\n            \n            // Method 2: Call global refresh functions\n            if (typeof window.loadProducts === 'function') {\n                console.log('🔄 Calling global loadProducts()');\n                await window.loadProducts();\n            }\n            \n            if (typeof window.loadDashboardData === 'function') {\n                console.log('🔄 Calling global loadDashboardData()');\n                await window.loadDashboardData();\n            }\n            \n            // Method 3: Trigger DOM events for other listeners\n            window.dispatchEvent(new CustomEvent('adminRefreshComplete', {\n                detail: { source, timestamp: new Date().toISOString() }\n            }));\n            \n            console.log(`✅ Admin refresh completed (triggered by ${source})`);\n            \n        } catch (error) {\n            console.error(`❌ Admin refresh failed (${source}):`, error);\n        }\n    }\n}\n\n// Initialize the listener when DOM is ready\nif (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', () => {\n        window.adminStockListener = new AdminStockListener();\n    });\n} else {\n    window.adminStockListener = new AdminStockListener();\n}\n\nconsole.log('✅ Enhanced Admin Listener script loaded');