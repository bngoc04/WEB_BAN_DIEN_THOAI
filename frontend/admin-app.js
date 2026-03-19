const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        alert('Yêu cầu quyền Quản trị viên!');
        window.location.href = 'index.html';
        return;
    }

    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.innerText = user.name;
    loadAdminData();
    switchSection('overview');
});

function switchSection(sectionId) {
    console.log('Admin switching to:', sectionId);
    const sections = document.querySelectorAll('.section');
    const targetSection = document.getElementById(sectionId);
    
    if (targetSection) {
        sections.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        targetSection.classList.add('active');
        targetSection.style.display = 'block';

        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.remove('active');
            if (li.getAttribute('onclick')?.includes(sectionId)) {
                li.classList.add('active');
            }
        });
    }
}

async function loadAdminData() {
    try {
        await Promise.all([
            fetchAdminStats(),
            fetchUsers(),
            fetchVouchers(),
            fetchAdminOrders()
        ]);
        
        // Init charts after data is ready
        setTimeout(initAdminCharts, 500);
    } catch (e) {
        console.error('Core admin data load failed', e);
    }
}

async function fetchAdminStats() {
    const res = await fetch(`${API_URL}/stats`);
    const data = await res.json();
    
    document.getElementById('statTotalOrders').innerText = data.totalOrders;
    document.getElementById('statRevenue').innerText = data.totalRevenue;
    document.getElementById('statTotalUsers').innerText = data.totalUsers;
    
    // Calculate AOV (Average Order Value)
    const revNum = parseInt(data.totalRevenue.replace(/[^0-9]/g, ''));
    const aov = data.totalOrders > 0 ? (revNum / data.totalOrders) : 0;
    const aovEl = document.getElementById('statAOV');
    if (aovEl) aovEl.innerText = aov.toLocaleString('vi-VN') + ' ₫';
}

async function fetchUsers() {
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();
    
    const customers = users.filter(u => u.role === 'customer');
    const staff = users.filter(u => u.role === 'staff');

    document.getElementById('usersTable').innerHTML = customers.map(u => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random" style="width:32px; border-radius:8px;">
                    <strong>${u.name}</strong>
                </div>
            </td>
            <td>${u.email}</td>
            <td><span class="role-badge role-customer">Khách hàng</span></td>
            <td><span style="color:#10b981;"><i class="fas fa-check-circle"></i> Hoạt động</span></td>
            <td>
                <button class="btn btn-sm" style="color:#ef4444;" onclick="deleteUser(${u.id})"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
    `).join('');

    document.getElementById('staffTable').innerHTML = staff.map(u => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0ea5e9&color=fff" style="width:32px; border-radius:8px;">
                    <strong>${u.name}</strong>
                </div>
            </td>
            <td>${u.email}</td>
            <td><span class="role-badge role-staff">Nhân viên</span></td>
            <td>
                <button class="btn btn-sm" style="color:#ef4444;" onclick="deleteUser(${u.id})"><i class="fas fa-user-minus"></i></button>
            </td>
        </tr>
    `).join('');
}

async function fetchVouchers() {
    const res = await fetch(`${API_URL}/vouchers`);
    const vouchers = await res.json();
    document.getElementById('vouchersTable').innerHTML = vouchers.map(v => `
        <tr>
            <td><strong style="color:var(--accent); font-family:monospace; font-size:1.1rem;">${v.code}</strong></td>
            <td><span class="badge badge-success">${(v.discount * 100).toFixed(0)}% Giảm</span></td>
            <td>${v.description || v.desc || 'Chưa có mô tả'}</td>
            <td>
                <button class="btn btn-sm" style="color:#ef4444;" onclick="deleteVoucher(${v.id})"><i class="fas fa-times-circle"></i></button>
            </td>
        </tr>
    `).join('');
}

async function fetchAdminOrders() {
    const res = await fetch(`${API_URL}/orders`);
    const orders = await res.json();
    
    // Full table
    document.getElementById('adminFullOrdersTable').innerHTML = orders.slice().reverse().map(o => `
        <tr>
            <td><strong>#${o.id.substring(0,8)}</strong></td>
            <td>${o.customerName}</td>
            <td style="font-weight:700;">${o.total}</td>
            <td>${o.date}</td>
            <td><span class="status-badge status-${o.status.toLowerCase().replace(/\s/g, '-')}">${o.status}</span></td>
        </tr>
    `).join('');

    // Recent Activity Cards (Admin Style)
    document.getElementById('adminRecentActivities').innerHTML = orders.slice(-4).reverse().map(o => `
        <div class="order-item-card">
            <div class="order-main">
                <div class="order-avatar" style="background:rgba(0,0,0,0.05);">
                    <i class="fas fa-history"></i>
                </div>
                <div class="order-info">
                    <span class="order-id">Đơn hàng mới</span>
                    <span class="order-customer">${o.customerName} đã đặt ${o.total}</span>
                </div>
            </div>
            <div class="order-meta">
                <span class="status-badge" style="font-size:0.7rem; padding:0.4rem 0.8rem;">${o.status || 'Hoàn tất'}</span>
            </div>
        </div>
    `).join('');
}

async function initAdminCharts() {
    console.log('--- Initializing Admin High-Level Charts ---');
    try {
        const productsRes = await fetch(`${API_URL}/products`);
        const products = await productsRes.json();

        // 1. Category Distribution
        const catCounts = products.reduce((acc, p) => {
            const cat = p.category || 'Điện thoại';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        const ctxCat = document.getElementById('categoryChart')?.getContext('2d');
        if (ctxCat) {
            new Chart(ctxCat, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(catCounts),
                    datasets: [{
                        data: Object.values(catCounts),
                        backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15, font: { family: 'Outfit', weight: '600' } } }
                    }
                }
            });
        }

        // 2. Revenue Trend (Line Chart)
        const ctxRev = document.getElementById('revenueAdminChart')?.getContext('2d');
        if (ctxRev) {
            new Chart(ctxRev, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Doanh thu Thực tế',
                        data: [450, 590, 800, 810, 960, 1100],
                        borderColor: '#2563eb',
                        tension: 0.4,
                        fill: true,
                        backgroundColor: 'rgba(37, 99, 235, 0.05)'
                    }, {
                        label: 'Mục tiêu chiến lược',
                        data: [400, 500, 600, 750, 850, 1000],
                        borderColor: '#10b981',
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                        y: { beginAtZero: true, grid: { display: false } }, 
                        x: { grid: { display: false } } 
                    }
                }
            });
        }

        // 3. Top Products ranking
        const topProducts = products.slice(0, 4); 
        const topProdEl = document.getElementById('topProductsList');
        if (topProdEl) {
            topProdEl.innerHTML = topProducts.map((p, index) => `
                <div class="order-item-card">
                    <div class="order-main">
                        <div class="order-avatar" style="background:#f8fafc; color:#1e293b; border: 1px solid #eee;">
                            ${index + 1}
                        </div>
                        <div class="order-info">
                            <span class="order-customer">${p.name}</span>
                            <span class="order-id">Đã bán: ${120 - index * 15} máy</span>
                        </div>
                    </div>
                    <div class="order-meta">
                        <span class="order-total" style="font-size:0.9rem;">${p.price}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Chart init failed:', err);
    }
}

// Global actions
window.deleteUser = async (id) => {
    if(confirm('Cắt quyền truy cập của người dùng này?')) {
        await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
        fetchUsers();
    }
};

window.deleteVoucher = async (id) => {
    if(confirm('Hủy chiến dịch Voucher này?')) {
        await fetch(`${API_URL}/vouchers/${id}`, { method: 'DELETE' });
        fetchVouchers();
    }
};

window.openStaffModal = () => document.getElementById('staffModal').style.display = 'block';

const sForm = document.getElementById('staffForm');
if (sForm) {
    sForm.onsubmit = async (e) => {
        e.preventDefault();
        const staffData = {
            name: document.getElementById('sName').value,
            email: document.getElementById('sEmail').value,
            password: document.getElementById('sPassword').value,
            role: 'staff'
        };

        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staffData)
        });

        if(res.ok) {
            alert('Đã khởi tạo tài khoản nhân viên thành công!');
            document.getElementById('staffModal').style.display = 'none';
            fetchUsers();
        }
    };
}

window.logout = () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};
