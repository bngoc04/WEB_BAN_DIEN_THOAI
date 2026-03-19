const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        alert('Yêu cầu quyền Quản trị viên!');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('adminName').innerText = user.name;
    loadAdminData();
});

function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

async function loadAdminData() {
    await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchVouchers()
    ]);
}

async function fetchStats() {
    const res = await fetch(`${API_URL}/stats`);
    const data = await res.json();
    document.getElementById('statTotalOrders').innerText = data.totalOrders;
    document.getElementById('statRevenue').innerText = data.totalRevenue;
    document.getElementById('statTotalUsers').innerText = data.totalUsers;
    document.getElementById('statProducts').innerText = data.totalProducts;
}

async function fetchUsers() {
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();
    
    // Split customers and staff
    const customers = users.filter(u => u.role === 'customer');
    const staff = users.filter(u => u.role === 'staff');

    document.getElementById('usersTable').innerHTML = customers.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td><span class="badge-role role-customer">Khách hàng</span></td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    document.getElementById('staffTable').innerHTML = staff.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="deleteUser(${u.id})"><i class="fas fa-user-minus"></i></button>
            </td>
        </tr>
    `).join('');
}

async function fetchVouchers() {
    const res = await fetch(`${API_URL}/vouchers`);
    const vouchers = await res.json();
    document.getElementById('vouchersTable').innerHTML = vouchers.map(v => `
        <tr>
            <td>${v.id}</td>
            <td><strong>${v.code}</strong></td>
            <td>${v.discount * 100}%</td>
            <td>${v.desc}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="deleteVoucher(${v.id})"><i class="fas fa-times"></i></button>
            </td>
        </tr>
    `).join('');
}

// User Management
async function deleteUser(id) {
    if(confirm('Xóa người dùng này khỏi hệ thống?')) {
        await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
        fetchUsers();
    }
}

// Staff Management
function openStaffModal() {
    document.getElementById('staffModal').style.display = 'block';
}

document.getElementById('staffForm').onsubmit = async (e) => {
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
        alert('Tạo tài khoản nhân viên thành công!');
        document.getElementById('staffModal').style.display = 'none';
        fetchUsers();
    }
}

// Voucher Management
async function deleteVoucher(id) {
    if(confirm('Xóa voucher này?')) {
        await fetch(`${API_URL}/vouchers/${id}`, { method: 'DELETE' });
        fetchVouchers();
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
