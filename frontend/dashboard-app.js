const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Check if staff
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'staff') {
        alert('Truy cập bị từ chối!');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('staffName').innerText = user.name;
    loadDashboardData();
    switchSection('overview');
});

function switchSection(sectionId) {
    console.log('Switching to section:', sectionId);
    const sections = document.querySelectorAll('.section');
    const targetSection = document.getElementById(sectionId);
    
    if (targetSection) {
        sections.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        targetSection.classList.add('active');
        targetSection.style.display = 'block';

        // Update sidebar links
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('onclick')?.includes(sectionId)) {
                li.classList.add('active');
            }
        });
    } else {
        console.warn(`Section ${sectionId} not found, defaulting to overview`);
        if (sectionId !== 'overview') switchSection('overview');
    }
}

async function loadDashboardData() {
    // Run separate try-catches so one failure doesn't block others
    fetchStats().catch(e => console.error(e));
    fetchOrders().catch(e => console.error(e));
    fetchProducts().catch(e => console.error(e));
    fetchSupport().catch(e => console.error(e));
    
    // Give charts a moment for data to be ready and library to be stable
    setTimeout(initCharts, 500);
}

let statusChart, trendChart;

async function initCharts() {
    console.log('Initializing charts...');
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded!');
        return;
    }

    try {
        const ordersRes = await fetch(`${API_URL}/orders`);
        if (!ordersRes.ok) throw new Error('Failed to fetch orders for charts');
        const orders = await ordersRes.json();

        // Calculate status counts
        const statusCounts = orders.reduce((acc, o) => {
            const s = o.status || 'Pending';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        const canvasStatus = document.getElementById('orderStatusChart');
        if (canvasStatus) {
            const ctxStatus = canvasStatus.getContext('2d');
            if (statusChart) statusChart.destroy();
            statusChart = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(statusCounts),
                    datasets: [{
                        data: Object.values(statusCounts),
                        backgroundColor: ['#fbbf24', '#10b981', '#3b82f6', '#ef4444'],
                        borderWidth: 0,
                        cutout: '75%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: 'Outfit', size: 12, weight: 'bold' } } }
                    }
                }
            });
            console.log('Status chart initialized');
        }

        const canvasTrend = document.getElementById('revenueTrendChart');
        if (canvasTrend) {
            const ctxTrend = canvasTrend.getContext('2d');
            if (trendChart) trendChart.destroy();
            trendChart = new Chart(ctxTrend, {
                type: 'bar',
                data: {
                    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                    datasets: [{
                        label: 'Doanh thu (Tr. VNĐ)',
                        data: [12, 19, 15, 25, 22, 30, 28],
                        backgroundColor: '#2563eb',
                        borderRadius: 8,
                        barThickness: 20
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { display: false } },
                        x: { grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
            console.log('Trend chart initialized');
        }
    } catch (error) {
        console.error('Error in initCharts:', error);
    }
}

async function fetchStats() {
    try {
        const res = await fetch(`${API_URL}/stats`);
        const data = await res.json();
        document.getElementById('statTotalOrders').innerText = data.totalOrders;
        document.getElementById('statRevenue').innerText = data.totalRevenue;
        document.getElementById('statPending').innerText = data.pendingOrders;
        document.getElementById('statProducts').innerText = data.totalProducts;
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

async function fetchOrders() {
    try {
        const res = await fetch(`${API_URL}/orders`);
        const orders = await res.json();
        
        // Overview list (last 5 cards)
        let recentContainer = document.getElementById('recentOrdersList');
        // Fallback for cached HTML without the new div
        if (!recentContainer) {
            const oldTable = document.getElementById('recentOrdersTable')?.closest('table');
            if (oldTable) {
                const parent = oldTable.parentElement;
                recentContainer = document.createElement('div');
                recentContainer.id = 'recentOrdersList';
                recentContainer.className = 'recent-list';
                parent.replaceChild(recentContainer, oldTable);
            }
        }

        if (recentContainer) {
            recentContainer.innerHTML = orders.slice(-5).reverse().map(o => {
                const statusClass = (o.status || 'Pending').toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                let statusIcon = 'fa-clock';
                if (statusClass.includes('hoan-tat') || statusClass === 'confirmed' || statusClass === 'shipped') statusIcon = 'fa-check-circle';
                if (statusClass.includes('huy')) statusIcon = 'fa-times-circle';

                return `
                    <div class="order-item-card">
                        <div class="order-main">
                            <div class="order-avatar">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <div class="order-info">
                                <span class="order-id">#${o.id.substring(0, 10)}</span>
                                <span class="order-customer">${o.customerName}</span>
                            </div>
                        </div>
                        <div class="order-meta">
                            <span class="order-total">${o.total}</span>
                            <span class="status-badge status-${statusClass}">
                                <i class="fas ${statusIcon}"></i>
                                ${o.status}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Full orders table
        const fullTable = document.getElementById('fullOrdersTable');
        fullTable.innerHTML = orders.map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${o.customerName}<br><small>${o.email}</small></td>
                <td>${o.items.join(', ')}</td>
                <td style="font-weight: 600; color: var(--accent);">${o.total}</td>
                <td>${o.date}</td>
                <td><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" style="padding: 0.6rem 1rem; border-radius: 10px;" onclick="updateOrderStatus('${o.id}', 'Confirmed')">Xác nhận</button>
                    <button class="btn btn-sm" style="background:#f1f5f9; color: #475569; padding: 0.6rem 1rem; border-radius: 10px; border:none;" onclick="updateOrderStatus('${o.id}', 'Shipped')">Giao hàng</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();
        const table = document.getElementById('fullProductsTable');
        if (table) {
            table.innerHTML = products.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td><img src="${p.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.price}</td>
                    <td><span class="badge ${p.stock < 10 ? 'badge-danger' : 'badge-success'}">${p.stock || 0}</span></td>
                    <td>${p.category || 'Điện thoại'}</td>
                    <td>
                        <button class="btn btn-sm" style="background: rgba(66, 133, 244, 0.1); color: #4285f4; border:none;" onclick='editProduct(${JSON.stringify(p)})'><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm" style="background: rgba(234, 67, 53, 0.1); color: #ea4335; border:none;" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }

        // Inventory table focus
        const invTable = document.getElementById('inventoryTable');
        if (invTable) {
            let lowCount = 0;
            invTable.innerHTML = products.map(p => {
                const isLow = p.stock < 10;
                if (isLow) lowCount++;
                const statusStr = isLow ? '<span style="color:#ef4444; font-weight:700;">Sắp hết hàng</span>' : '<span style="color:#10b981;">Bình thường</span>';
                
                return `
                    <tr>
                        <td style="font-weight:700; color:var(--accent);">#P00${p.id}</td>
                        <td><strong>${p.name}</strong></td>
                        <td><span class="badge ${isLow ? 'badge-danger' : 'badge-success'}">${p.stock || 0}</span></td>
                        <td>${statusStr}</td>
                        <td>
                            <div style="display:flex; gap:8px;">
                                <button class="btn btn-sm" style="background:#f1f5f9; border:none; padding:5px 10px;" onclick="quickUpdateStock(${p.id}, 10)">+10</button>
                                <button class="btn btn-sm" style="background:#f1f5f9; border:none; padding:5px 10px;" onclick="quickUpdateStock(${p.id}, -1)">-1</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            const lowCountEl = document.getElementById('lowStockCount');
            if (lowCountEl) {
                lowCountEl.innerText = `${lowCount} sản phẩm sắp hết`;
                lowCountEl.className = lowCount > 0 ? 'badge-danger' : 'badge-success';
            }
        }
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

async function quickUpdateStock(id, change) {
    try {
        const prodRes = await fetch(`${API_URL}/products/${id}`);
        const product = await prodRes.json();
        const newStock = Math.max(0, (product.stock || 0) + change);
        
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock: newStock })
        });
        
        if (res.ok) {
            fetchProducts();
            fetchStats();
        }
    } catch (e) {
        console.error('Fast stock update failed', e);
    }
}

async function fetchSupport() {
    try {
        const res = await fetch(`${API_URL}/support_tickets`);
        if (!res.ok) throw new Error('Support API failed');
        const tickets = await res.json();
        const container = document.getElementById('ticketList');
        if (!container) return;
        container.innerHTML = tickets.map(t => `
            <div class="stat-card" style="margin-bottom: 1rem; cursor: pointer;">
                <div class="stat-icon" style="background: #eee; color: #333;"><i class="fas fa-user"></i></div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h4 style="margin:0; font-weight: 700;">${t.customerName} - <small style="color:var(--accent);">${t.subject}</small></h4>
                        <span class="status-badge status-pending" style="font-size: 0.7rem;">${t.status}</span>
                    </div>
                    <p style="margin: 0.8rem 0 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">${t.message}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching support:', error);
    }
}

async function updateOrderStatus(id, status) {
    try {
        const res = await fetch(`${API_URL}/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            alert('Cập nhật trạng thái thành công!');
            loadDashboardData();
        }
    } catch (error) {
        alert('Lỗi cập nhật!');
    }
}

function openProductModal() {
    document.getElementById('productModal').style.display = 'block';
    document.getElementById('modalTitle').innerText = 'Thêm Sản phẩm mới';
    document.getElementById('productForm').reset();
    document.getElementById('pId').value = '';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function editProduct(p) {
    document.getElementById('productModal').style.display = 'block';
    document.getElementById('modalTitle').innerText = 'Chỉnh sửa Sản phẩm';
    document.getElementById('pId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pStock').value = p.stock || 0;
    document.getElementById('pImage').value = p.image;
    document.getElementById('pDesc').value = p.desc;
}

document.getElementById('productForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('pId').value;
    const productData = {
        name: document.getElementById('pName').value,
        price: document.getElementById('pPrice').value,
        stock: parseInt(document.getElementById('pStock').value),
        image: document.getElementById('pImage').value,
        desc: document.getElementById('pDesc').value,
        category: 'Điện thoại'
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (res.ok) {
            alert('Lưu sản phẩm thành công!');
            closeProductModal();
            fetchProducts();
            fetchStats();
        }
    } catch (error) {
        alert('Lỗi lưu sản phẩm!');
    }
};

async function deleteProduct(id) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        try {
            await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
            fetchProducts();
            fetchStats();
        } catch (error) {
            alert('Lỗi xóa sản phẩm!');
        }
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
