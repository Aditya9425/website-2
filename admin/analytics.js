// Analytics functionality for admin panel

// Analytics Methods
AdminPanel.prototype.loadAnalytics = async function() {
    try {
        console.log('📊 Loading analytics data...');
        
        const timeRangeSelect = document.getElementById('analyticsTimeRange');
        if (timeRangeSelect && !timeRangeSelect.hasListener) {
            timeRangeSelect.addEventListener('change', () => {
                this.loadAnalytics();
            });
            timeRangeSelect.hasListener = true;
        }
        
        const timeRange = timeRangeSelect ? parseInt(timeRangeSelect.value) : 30;
        
        await Promise.all([
            this.loadSalesAnalytics(timeRange),
            this.loadCustomerAnalytics(timeRange),
            this.loadProductAnalytics(timeRange),
            this.loadMarketingAnalytics(timeRange)
        ]);
        
        console.log('✅ Analytics data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
    }
};

AdminPanel.prototype.loadSalesAnalytics = async function(timeRange) {
    try {
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString());
        
        this.createRevenueChart(orders || []);
        this.createOrdersChart(orders || []);
        this.populateDetailedOrdersTable(orders || []);
    } catch (error) {
        console.error('Error loading sales analytics:', error);
    }
};

AdminPanel.prototype.loadCustomerAnalytics = async function(timeRange) {
    try {
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString());
        
        const customerData = this.processCustomerData(orders || []);
        this.createCustomerTypeChart(customerData);
        this.createTopCustomersChart(customerData);
        this.populateCustomerDetailsTable(customerData);
    } catch (error) {
        console.error('Error loading customer analytics:', error);
    }
};

AdminPanel.prototype.loadProductAnalytics = async function(timeRange) {
    try {
        const [productsResponse, ordersResponse] = await Promise.all([
            supabase.from('products').select('*'),
            supabase.from('orders').select('*').gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString())
        ]);
        
        const products = productsResponse.data || [];
        const orders = ordersResponse.data || [];
        const productSalesData = this.processProductSalesData(products, orders);
        
        this.createTopProductsChart(productSalesData);
        this.createColorPreferenceChart(orders);
        this.populateProductPerformanceTable(productSalesData);
    } catch (error) {
        console.error('Error loading product analytics:', error);
    }
};

AdminPanel.prototype.loadMarketingAnalytics = async function(timeRange) {
    try {
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString());
        
        this.createPromoCodeChart(orders || []);
        this.createTrafficSourceChart();
        this.populateCampaignPerformanceTable();
    } catch (error) {
        console.error('Error loading marketing analytics:', error);
    }
};

// Chart creation methods
AdminPanel.prototype.createRevenueChart = function(orders) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const dailyRevenue = {};
    orders.forEach(order => {
        const date = new Date(order.created_at).toDateString();
        dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.total_amount || 0);
    });
    
    const labels = Object.keys(dailyRevenue).slice(-7);
    const data = labels.map(date => dailyRevenue[date] || 0);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(date => new Date(date).toLocaleDateString()),
            datasets: [{
                label: 'Revenue (₹)',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
};

AdminPanel.prototype.createOrdersChart = function(orders) {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    const dailyOrders = {};
    orders.forEach(order => {
        const date = new Date(order.created_at).toDateString();
        dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });
    
    const labels = Object.keys(dailyOrders).slice(-7);
    const data = labels.map(date => dailyOrders[date] || 0);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(date => new Date(date).toLocaleDateString()),
            datasets: [{
                label: 'Orders',
                data: data,
                backgroundColor: '#e74c3c',
                borderColor: '#c0392b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
};

AdminPanel.prototype.createCustomerTypeChart = function(customerData) {
    const ctx = document.getElementById('customerTypeChart');
    if (!ctx) return;
    
    const newCustomers = customerData.filter(c => c.orders === 1).length;
    const returningCustomers = customerData.filter(c => c.orders > 1).length;
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['New Customers', 'Returning Customers'],
            datasets: [{
                data: [newCustomers, returningCustomers],
                backgroundColor: ['#3498db', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

AdminPanel.prototype.createTopCustomersChart = function(customerData) {
    const ctx = document.getElementById('topCustomersChart');
    if (!ctx) return;
    
    const topCustomers = customerData.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topCustomers.map(c => c.name.substring(0, 15) + '...'),
            datasets: [{
                label: 'Total Spent (₹)',
                data: topCustomers.map(c => c.totalSpent),
                backgroundColor: '#27ae60',
                borderColor: '#229954',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { callback: function(value) { return '₹' + value.toLocaleString(); } }
                }
            }
        }
    });
};

AdminPanel.prototype.createTopProductsChart = function(productSalesData) {
    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;
    
    const topProducts = productSalesData.sort((a, b) => b.sold - a.sold).slice(0, 10);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts.map(p => p.name.substring(0, 20) + '...'),
            datasets: [{
                label: 'Units Sold',
                data: topProducts.map(p => p.sold),
                backgroundColor: '#f39c12',
                borderColor: '#e67e22',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
};

AdminPanel.prototype.createColorPreferenceChart = function(orders) {
    const ctx = document.getElementById('colorPreferenceChart');
    if (!ctx) return;
    
    const colorCounts = {};
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                if (item.color) {
                    colorCounts[item.color] = (colorCounts[item.color] || 0) + item.quantity;
                }
            });
        }
    });
    
    const colors = Object.keys(colorCounts);
    const counts = Object.values(colorCounts);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: colors,
            datasets: [{
                data: counts,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

AdminPanel.prototype.createPromoCodeChart = function(orders) {
    const ctx = document.getElementById('promoCodeChart');
    if (!ctx) return;
    
    const promoCounts = {};
    orders.forEach(order => {
        if (order.promo_code) {
            promoCounts[order.promo_code] = (promoCounts[order.promo_code] || 0) + 1;
        }
    });
    
    if (Object.keys(promoCounts).length === 0) {
        promoCounts['WELCOME10'] = 5;
        promoCounts['FIRST20'] = 3;
        promoCounts['FREEDEL'] = 8;
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(promoCounts),
            datasets: [{
                label: 'Usage Count',
                data: Object.values(promoCounts),
                backgroundColor: '#9b59b6',
                borderColor: '#8e44ad',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
};

AdminPanel.prototype.createTrafficSourceChart = function() {
    const ctx = document.getElementById('trafficSourceChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Direct', 'Social Media', 'Google Ads', 'Referral'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: ['#3498db', '#e74c3c', '#f39c12', '#27ae60'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
};

// Data processing methods
AdminPanel.prototype.processCustomerData = function(orders) {
    const customers = {};
    orders.forEach(order => {
        const customerKey = order.shipping_addr?.email || 'unknown';
        const customerName = `${order.shipping_addr?.firstName || ''} ${order.shipping_addr?.lastName || ''}`.trim() || 'Unknown';
        
        if (!customers[customerKey]) {
            customers[customerKey] = {
                name: customerName,
                email: customerKey,
                phone: order.shipping_addr?.mobile || 'N/A',
                orders: 0,
                totalSpent: 0,
                lastOrder: null
            };
        }
        
        customers[customerKey].orders++;
        customers[customerKey].totalSpent += order.total_amount || 0;
        customers[customerKey].lastOrder = order.created_at;
    });
    
    return Object.values(customers);
};

AdminPanel.prototype.processProductSalesData = function(products, orders) {
    const productSales = {};
    
    products.forEach(product => {
        productSales[product.id] = {
            id: product.id,
            name: product.name,
            category: product.category,
            sold: 0,
            revenue: 0,
            stock: product.stock || 0
        };
    });
    
    orders.forEach(order => {
        if (order.items) {
            order.items.forEach(item => {
                if (productSales[item.id]) {
                    productSales[item.id].sold += item.quantity;
                    productSales[item.id].revenue += item.price * item.quantity;
                }
            });
        }
    });
    
    return Object.values(productSales);
};

// Table population methods
AdminPanel.prototype.populateDetailedOrdersTable = function(orders) {
    const tbody = document.getElementById('detailedOrdersTable');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.slice(0, 20).map(order => {
        const customerName = `${order.shipping_addr?.firstName || ''} ${order.shipping_addr?.lastName || ''}`.trim() || 'N/A';
        const itemsCount = order.items ? order.items.length : 0;
        const totalQuantity = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        
        return `
            <tr>
                <td>#${order.id.toString().slice(-8)}</td>
                <td>${customerName}</td>
                <td>${itemsCount} items</td>
                <td>${totalQuantity}</td>
                <td>₹${(order.total_amount || 0).toLocaleString()}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
        `;
    }).join('');
};

AdminPanel.prototype.populateCustomerDetailsTable = function(customerData) {
    const tbody = document.getElementById('customerDetailsTable');
    if (!tbody) return;
    
    if (customerData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No customers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = customerData.slice(0, 20).map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.orders}</td>
            <td>₹${customer.totalSpent.toLocaleString()}</td>
            <td>${customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'N/A'}</td>
        </tr>
    `).join('');
};

AdminPanel.prototype.populateProductPerformanceTable = function(productSalesData) {
    const tbody = document.getElementById('productPerformanceTable');
    if (!tbody) return;
    
    if (productSalesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No products found</td></tr>';
        return;
    }
    
    tbody.innerHTML = productSalesData.map(product => {
        const status = product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock';
        const statusClass = product.stock > 10 ? 'status-delivered' : product.stock > 0 ? 'status-pending' : 'status-cancelled';
        
        return `
            <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.sold}</td>
                <td>₹${product.revenue.toLocaleString()}</td>
                <td>${product.stock}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
};

AdminPanel.prototype.populateCampaignPerformanceTable = function() {
    const tbody = document.getElementById('campaignPerformanceTable');
    if (!tbody) return;
    
    const campaigns = [
        { name: 'Summer Sale', type: 'Email', clicks: 1250, conversions: 85, revenue: 42500, roi: 340 },
        { name: 'Facebook Ads', type: 'Social', clicks: 2100, conversions: 156, revenue: 78000, roi: 260 },
        { name: 'Google Ads', type: 'Search', clicks: 1800, conversions: 124, revenue: 62000, roi: 220 },
        { name: 'Instagram Stories', type: 'Social', clicks: 950, conversions: 67, revenue: 33500, roi: 180 }
    ];
    
    tbody.innerHTML = campaigns.map(campaign => `
        <tr>
            <td>${campaign.name}</td>
            <td>${campaign.type}</td>
            <td>${campaign.clicks.toLocaleString()}</td>
            <td>${campaign.conversions}</td>
            <td>₹${campaign.revenue.toLocaleString()}</td>
            <td>${campaign.roi}%</td>
        </tr>
    `).join('');
};