// Enhanced Orders Display with Card Layout

// Override the displayOrders method to use card layout
AdminPanel.prototype.displayOrders = function(orders) {
    const tbody = document.getElementById('ordersTableBody');
    const tableContainer = tbody.closest('.table-container');
    
    if (orders.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No orders found</h3><p>Orders will appear here once customers start placing them.</p></div>';
        return;
    }

    // Replace table with card layout
    const ordersContainer = document.createElement('div');
    ordersContainer.className = 'orders-container';
    
    const ordersHTML = orders.map(order => {
        // Handle different date formats
        let orderDate = 'N/A';
        if (order.created_at) {
            orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } else if (order.createdAt) {
            if (order.createdAt.toDate) {
                orderDate = new Date(order.createdAt.toDate()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } else {
                orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        }
        
        // Get customer name from shipping address or customer details
        let customerName = 'N/A';
        if (order.shipping_addr) {
            customerName = `${order.shipping_addr.firstName || ''} ${order.shipping_addr.lastName || ''}`.trim();
        } else if (order.customerName) {
            customerName = order.customerName;
        }
        
        const totalAmount = order.total_amount || order.total || 0;
        const itemsCount = order.items ? order.items.length : 0;
        const status = order.status || 'pending';
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">#${order.id.toString().slice(-8)}</div>
                    <div class="order-status status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</div>
                </div>
                
                <div class="order-body">
                    <div class="order-info-item">
                        <div class="order-info-label">Customer</div>
                        <div class="order-info-value order-customer">${customerName}</div>
                    </div>
                    
                    <div class="order-info-item">
                        <div class="order-info-label">Items</div>
                        <div class="order-info-value">${itemsCount} items</div>
                    </div>
                    
                    <div class="order-info-item">
                        <div class="order-info-label">Total</div>
                        <div class="order-info-value order-total">₹${totalAmount.toLocaleString()}</div>
                    </div>
                </div>
                
                <div class="order-footer">
                    <div class="order-date">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${orderDate}</span>
                    </div>
                    
                    <div class="order-actions">
                        <button class="btn-primary btn-small" onclick="adminPanel.viewOrder('${order.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-success btn-small" onclick="adminPanel.updateOrderStatus('${order.id}', 'confirmed')" title="Confirm Order">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-warning btn-small" onclick="adminPanel.updateOrderStatus('${order.id}', 'shipped')" title="Mark as Shipped">
                            <i class="fas fa-shipping-fast"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    ordersContainer.innerHTML = ordersHTML;
    tableContainer.parentNode.replaceChild(ordersContainer, tableContainer);
};

// Enhanced order details modal
AdminPanel.prototype.viewOrder = function(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
        this.showMessage('Order not found', 'error');
        return;
    }
    
    // Create enhanced order details modal
    const modal = document.createElement('div');
    modal.id = 'orderDetailsModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'N/A';
    
    const customerName = order.shipping_addr ? `${order.shipping_addr.firstName || ''} ${order.shipping_addr.lastName || ''}`.trim() : 'N/A';
    const totalAmount = order.total_amount || order.total || 0;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h3><i class="fas fa-receipt"></i> Order Details - #${order.id}</h3>
                <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
            </div>
            
            <div style="padding: 30px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                    <div class="order-info-card">
                        <h4 style="margin-bottom: 20px; color: #667eea;"><i class="fas fa-info-circle"></i> Order Information</h4>
                        <div class="info-row">
                            <span class="info-label">Order ID:</span>
                            <span class="info-value">#${order.id}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Date:</span>
                            <span class="info-value">${orderDate}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="status-badge status-${order.status}">${order.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Total:</span>
                            <span class="info-value" style="font-weight: 700; color: #667eea;">₹${totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="order-info-card">
                        <h4 style="margin-bottom: 20px; color: #11998e;"><i class="fas fa-user"></i> Customer Information</h4>
                        <div class="info-row">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${customerName}</span>
                        </div>
                        ${order.shipping_addr ? `
                            <div class="info-row">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${order.shipping_addr.email || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Mobile:</span>
                                <span class="info-value">${order.shipping_addr.mobile || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address:</span>
                                <span class="info-value">
                                    ${order.shipping_addr.addressLine1 || ''}<br>
                                    ${order.shipping_addr.addressLine2 ? order.shipping_addr.addressLine2 + '<br>' : ''}
                                    ${order.shipping_addr.city || ''}, ${order.shipping_addr.state || ''} - ${order.shipping_addr.pincode || ''}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="order-items-section">
                    <h4 style="margin-bottom: 20px; color: #f093fb;"><i class="fas fa-shopping-cart"></i> Items Ordered</h4>
                    <div class="order-items-grid">
                        ${order.items ? order.items.map(item => `
                            <div class="order-item-card">
                                <img src="${item.image || 'https://via.placeholder.com/80x100'}" alt="${item.name}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 8px;">
                                <div class="item-details">
                                    <h5 style="margin: 0 0 8px 0; color: #333;">${item.name}</h5>
                                    <p style="margin: 0; color: #666; font-size: 0.9rem;">Price: ₹${item.price.toLocaleString()} × ${item.quantity}</p>
                                    <p style="margin: 8px 0 0 0; font-weight: 700; color: #667eea;">Subtotal: ₹${(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            </div>
                        `).join('') : '<p>No items found</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles for the modal content
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .order-info-card {
            background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #666;
            font-size: 0.9rem;
        }
        
        .info-value {
            font-weight: 500;
            color: #333;
            text-align: right;
        }
        
        .order-items-section {
            background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(240, 147, 251, 0.1);
        }
        
        .order-items-grid {
            display: grid;
            gap: 20px;
        }
        
        .order-item-card {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        
        .order-item-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .item-details {
            flex: 1;
        }
    `;
    
    document.head.appendChild(modalStyles);
};

// Add additional styles for order footer
const orderFooterStyles = document.createElement('style');
orderFooterStyles.textContent = `
    .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 20px;
        border-top: 2px solid rgba(102, 126, 234, 0.1);
    }
    
    .order-date {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .order-date i {
        color: #667eea;
    }
    
    @media (max-width: 768px) {
        .order-footer {
            flex-direction: column;
            gap: 15px;
            text-align: center;
        }
    }
`;

document.head.appendChild(orderFooterStyles);