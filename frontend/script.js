// Sử dụng var để tránh lỗi "Identifier has already been declared" khi load nhiều script
if (typeof API_URL === 'undefined') {
    var API_URL = "http://localhost:3000/api";
}
if (typeof products === 'undefined') {
    var products = [];
}

// --- UNIVERSAL FUNCTIONS ---

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartCountElement = document.querySelector(".cart-count");
    if (cartCountElement) {
        cartCountElement.textContent = totalQty;
    }
}

function updateHeader() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        const actionItems = document.querySelector('.nav-actions');
        if (!actionItems) return;

        // Tìm nút đăng nhập bằng text hoặc href
        const links = actionItems.querySelectorAll('.action-item');
        let authLink = null;
        
        links.forEach(link => {
            const text = link.innerText.toLowerCase();
            const href = link.getAttribute('href') || "";
            if (text.includes('đăng nhập') || href.includes('auth.html') || href.includes('profile.html') || href.includes('admin.html') || href.includes('dashboard.html')) {
                authLink = link;
            }
        });

        if (authLink) {
            let iconClass = "fa-user-circle";
            let label = user.name;
            let targetHref = "profile.html";

            if (user.role === 'admin') {
                iconClass = "fa-user-shield";
                label = "Admin";
                targetHref = "admin.html";
            } else if (user.role === 'staff') {
                iconClass = "fa-user-tie";
                label = "Nhân viên";
                targetHref = "dashboard.html";
            }

            // Giữ cấu trúc dọc của header (icon trên, text dưới)
            authLink.innerHTML = `
                <i class="fas ${iconClass}"></i>
                <div style="font-size: 0.85rem; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${label}</div>
            `;
            authLink.href = targetHref;
            authLink.title = user.name; // Tooltip hiện tên đầy đủ
        }
    } catch (e) {
        console.error("Lỗi cập nhật header:", e);
    }
}

window.selectLocation = function(loc) {
    console.log("Selecting location:", loc);
    localStorage.setItem('userLocation', loc);
    updateLocation();
};

window.updateLocation = function() {
    const loc = localStorage.getItem('userLocation') || 'Hồ Chí Minh';
    console.log("Updating UI for location:", loc);
    const locElements = document.querySelectorAll('.current-location');
    locElements.forEach(el => el.textContent = loc);

    // Cập nhật trạng thái active trong dropdown
    const locItems = document.querySelectorAll('.loc-item');
    locItems.forEach(item => {
        if (item.textContent.trim() === loc) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
};


// Chạy ngay lập tức khi load file
updateHeader();
updateCartBadge();
updateLocation();


// --- PAGE SPECIFIC FUNCTIONS ---

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error("Không thể tải dữ liệu sản phẩm");
        products = await response.json();
        renderProducts();
        initSearch(); // Khởi tạo tìm kiếm sau khi có dữ liệu
    } catch (error) {
        console.error("Lỗi:", error);
        const productGrid = document.getElementById("productGrid");
        if (productGrid) {
            productGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;"></i>
                    <p style="color: #ef4444; font-weight: 600;">Xin lỗi, không thể kết nối tới server!</p>
                </div>`;
        }
    }
}

function renderProducts(productsToRender = products) {
    const productGrid = document.getElementById("productGrid");
    if (!productGrid) return;
    
    const isPhonesPage = window.location.pathname.includes("phones.html");
    
    // Nếu rỗng sau khi filter search
    if (productsToRender.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
                <i class="fas fa-search" style="font-size: 3.5rem; color: #cbd5e1; margin-bottom: 1.5rem;"></i>
                <h3 style="font-size: 1.5rem; color: #64748b; margin-bottom: 0.5rem;">Không tìm thấy kết quả</h3>
                <p style="color: #94a3b8;">Thử tìm kiếm với từ khóa khác xem sao bạn nhé!</p>
            </div>`;
        return;
    }

    productGrid.innerHTML = "";
    
    let displayProducts = productsToRender;
    if (isPhonesPage) {
        displayProducts = displayProducts.filter(p => p.category === "Điện thoại");
    }

    displayProducts.forEach((product, index) => {
        const card = document.createElement("div");
        card.classList.add("product-card", "scroll-fade-up", `delay-${(index % 4) + 1}`);

        if (isPhonesPage) {
            const isNew = index % 3 === 0;
            card.innerHTML = `
                ${isNew ? '<div class="badge-new-item">Mẫu mới</div>' : '<div class="badge-installment">Trả chậm 0%</div>'}
                <div class="product-image" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer; background: url('${product.image}') center/contain no-repeat; height: 200px; margin-bottom: 1rem; width: 100%; position: relative;">
                    ${index % 2 === 0 ? '<i class="fas fa-wand-magic-sparkles" style="position: absolute; top: 0; right: 0; color: #60a5fa; font-size: 1.2rem;"></i>' : ''}
                </div>
                <div class="product-info" style="text-align: left; align-items: flex-start;">
                    <h3 class="product-title" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer; font-size: 0.9rem; margin-bottom: 0.4rem; height: 38px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${product.name}</h3>
                    <div class="item-specs">
                        <span class="spec-tag">${index % 2 === 0 ? 'OLED' : 'LTPO'}</span>
                        <span class="spec-tag">${index % 3 === 0 ? '120Hz' : '144Hz'}</span>
                    </div>
                    <div class="product-price" style="margin: 0.6rem 0; font-size: 1rem; color: #e11d48; font-weight: 700;">${product.price}</div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})" style="width: 100%; border-radius: 6px; padding: 0.5rem; font-size: 0.85rem;">Thêm vào giỏ</button>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="product-image" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer; background: url('${product.image}') center/cover no-repeat; height: 250px; border-radius: 12px; margin-bottom: 1.5rem; width: 100%;">
                </div>
                <div class="product-info">
                    <h3 class="product-title" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer;">${product.name}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem;">${product.desc || ''}</p>
                    <div class="product-price">${product.price}</div>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Thêm vào giỏ</button>
                </div>
            `;
        }
        productGrid.appendChild(card);
    });
    initAnimations();
}

function initSearch() {
    const searchInput = document.querySelector(".search-container input");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        if (keyword === "") {
            renderProducts(products);
            return;
        }

        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(keyword) || 
            (p.desc && p.desc.toLowerCase().includes(keyword)) ||
            (p.category && p.category.toLowerCase().includes(keyword))
        );
        
        renderProducts(filtered);
    });

    // Thêm hiệu ứng focus cho khung tìm kiếm
    searchInput.addEventListener("focus", () => {
        document.querySelector(".search-container").style.boxShadow = "0 0 0 4px rgba(37, 99, 235, 0.1)";
        document.querySelector(".search-container").style.borderColor = "var(--accent)";
    });

    searchInput.addEventListener("blur", () => {
        document.querySelector(".search-container").style.boxShadow = "none";
        document.querySelector(".search-container").style.borderColor = "rgba(0,0,0,0.05)";
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex !== -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            qty: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    
    const cartCountElement = document.querySelector(".cart-count");
    if (cartCountElement) {
        cartCountElement.style.transform = "scale(1.3)";
        setTimeout(() => cartCountElement.style.transform = "scale(1)", 200);
    }
    alert(`Đã thêm ${product.name} vào giỏ hàng!`);
}

// --- ANIMATIONS ---

let animationObserver;

function initAnimations() {
    if (!animationObserver) {
        animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    animationObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });
    }

    const hiddenElements = document.querySelectorAll('.scroll-fade-up:not(.show)');
    hiddenElements.forEach((el) => {
        animationObserver.observe(el);
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('show');
            animationObserver.unobserve(el);
        }
    });
}

// --- REUSABLE CATEGORY LOADER ---

async function fetchCategoryProducts(categoryName, gridId) {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error(`Không thể tải dữ liệu ${categoryName}`);
        const allProducts = await response.json();
        const filteredProducts = allProducts.filter(p => p.category === categoryName);
        
        const grid = document.getElementById(gridId);
        if (!grid) return;
        grid.innerHTML = "";

        if (filteredProducts.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Hiện chưa có sản phẩm ${categoryName} nào.</p>`;
            return;
        }

        filteredProducts.forEach((product, index) => {
            const card = document.createElement("div");
            card.classList.add("product-card", "scroll-fade-up", "show", `delay-${(index % 4) + 1}`);
            
            // Use standard styling for these categories
            card.innerHTML = `
                <div class="product-image" onclick="window.location.href='product-detail.html?id=${product.id}'" 
                    style="background: url('${product.image}') center/cover no-repeat; height: 250px; border-radius: 12px; margin-bottom: 1.5rem; width: 100%; cursor: pointer;">
                </div>
                <div class="product-info">
                    <h3 class="product-title" onclick="window.location.href='product-detail.html?id=${product.id}'" style="cursor: pointer;">${product.name}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem; height: 3.2em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${product.desc || ''}</p>
                    <div class="product-price">${product.price}</div>
                    <div style="display: flex; gap: 10px; margin-top: 1rem;">
                        <button class="add-to-cart-btn" onclick="addToCartFromCategory(${product.id}, '${categoryName}')" style="flex: 1;">Thêm vào giỏ</button>
                        <button class="buy-now-btn" onclick="window.location.href='checkout.html?productId=${product.id}'" style="flex: 1; background: #e11d48; color: white; border: none; padding: 0.8rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Mua ngay</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        initAnimations();
    } catch (error) {
        console.error("Lỗi:", error);
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Xin lỗi, không thể kết nối tới server!</p>`;
        }
    }
}

function addToCartFromCategory(productId, categoryName) {
    // We need the product info. We can fetch it or pass it. 
    // Since we are in a generic function, let's fetch products again or look in current list if we store it globally.
    // For simplicity, let's just fetch the specific product from API.
    fetch(`${API_URL}/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingIndex = cart.findIndex(item => item.id === productId);

            if (existingIndex !== -1) {
                cart[existingIndex].qty += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    qty: 1
                });
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartBadge();
            alert(`Đã thêm ${product.name} vào giỏ hàng!`);
        });
}

// --- INITIALIZATION ---

document.addEventListener("DOMContentLoaded", () => {
    updateCartBadge();
    updateHeader();
    updateLocation();
    if (document.getElementById("productGrid")) {
        fetchProducts();
    }
    initAnimations();
});
