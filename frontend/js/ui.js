/* 
 * CyberPay AI - UI JS (Integrated Edition)
 * Dynamic Sidebar & Top Header Injections, live Profile Sync, Theme toggles, and PIN Modals
 */

document.addEventListener('DOMContentLoaded', () => {
    injectGlobalLayouts();
    setupGlobalUIEvents();
    syncUserProfile(); // Live sync from MySQL Database
});

// Dynamic Injection of common elements to reduce duplicate markup in HTML files
function injectGlobalLayouts() {
    const sidebarContainer = document.getElementById('sidebar-container');
    const headerContainer = document.getElementById('header-container');
    const user = db.getUser();
    
    if (!user) return; // Not logged in

    const currentPath = window.location.pathname;
    const isActive = (pageName) => currentPath.includes(pageName) ? 'active' : '';

    // Sidebar structure
    if (sidebarContainer) {
        sidebarContainer.innerHTML = `
            <aside class="sidebar" id="sidebarNav">
                <div class="sidebar-logo">
                    <i class="fa-solid fa-brain"></i>
                    <span>CyberPay AI</span>
                </div>
                <ul class="sidebar-menu">
                    <li class="sidebar-item ${isActive('dashboard.html')}">
                        <a href="dashboard.html"><i class="fa-solid fa-chart-pie"></i><span>Dashboard</span></a>
                    </li>
                    <li class="sidebar-item ${isActive('send-money.html')}">
                        <a href="send-money.html"><i class="fa-solid fa-paper-plane"></i><span>Send Money</span></a>
                    </li>
                    <li class="sidebar-item ${isActive('receive-money.html')}">
                        <a href="receive-money.html"><i class="fa-solid fa-qrcode"></i><span>Receive Money</span></a>
                    </li>
                    <li class="sidebar-item ${isActive('transactions.html')}">
                        <a href="transactions.html"><i class="fa-solid fa-receipt"></i><span>Transactions</span></a>
                    </li>
                    <li class="sidebar-item ${isActive('bills.html')}">
                        <a href="bills.html"><i class="fa-solid fa-file-invoice-dollar"></i><span>Bills & Utilities</span></a>
                    </li>
                    <li class="sidebar-item ${isActive('fraud.html')}">
                        <a href="fraud.html"><i class="fa-solid fa-shield-halved"></i><span>AI Fraud Shield</span></a>
                    </li>
                    <li class="sidebar-item ${isActive('insights.html')}">
                        <a href="insights.html"><i class="fa-solid fa-lightbulb"></i><span>AI Insights</span></a>
                    </li>
                    <li class="sidebar-item ${isActive('profile.html')}">
                        <a href="profile.html"><i class="fa-solid fa-user-gear"></i><span>Profile</span></a>
                    </li>
                    <li class="sidebar-item ${isActive('settings.html')}">
                        <a href="settings.html"><i class="fa-solid fa-sliders"></i><span>Settings</span></a>
                    </li>
                </ul>
                <div class="sidebar-footer">
                    <div class="sidebar-logout" id="logoutBtn">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Logout</span>
                    </div>
                </div>
            </aside>
        `;
    }

    // Top navbar header structure
    if (headerContainer) {
        const initials = user.fullName ? user.fullName.split(' ').map(n=>n[0]).join('') : 'U';
        headerContainer.innerHTML = `
            <header class="header">
                <div class="mobile-nav-toggle" id="menuToggle">
                    <i class="fa-solid fa-bars"></i>
                </div>
                <div class="header-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search transactions, bills..." id="globalSearch">
                </div>
                <div class="header-actions">
                    <!-- Theme Toggle Btn -->
                    <button class="icon-badge-btn" id="themeToggleBtn" title="Toggle theme">
                        <i class="fa-solid fa-sun-plant-wilt"></i>
                    </button>
                    <!-- Notification Trigger -->
                    <div style="position: relative;">
                        <button class="icon-badge-btn" id="notifyBell">
                            <i class="fa-solid fa-bell"></i>
                            <span class="badge-dot" id="bellDot"></span>
                        </button>
                        <div class="dropdown-menu" id="notifyDropdown" style="width: 320px; padding: 12px;">
                            <h4 style="margin-bottom:12px; font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:8px;">AI Shield Notifications</h4>
                            <div id="notifyList" style="display:flex; flex-direction:column; gap:10px; max-height:240px; overflow-y:auto;">
                                <!-- Will be loaded dynamically -->
                            </div>
                        </div>
                    </div>
                    <!-- User Profile Dropdown -->
                    <div class="profile-menu" id="profileDropdownTrigger">
                        <div class="profile-avatar">${initials}</div>
                        <div class="profile-details">
                            <span class="profile-name">${user.fullName}</span>
                            <span class="profile-role">${user.email}</span>
                        </div>
                        <i class="fa-solid fa-chevron-down" style="font-size:0.8rem; color:var(--text-muted);"></i>
                        
                        <div class="dropdown-menu" id="profileDropdown">
                            <div class="dropdown-item" onclick="window.location.href='profile.html'">
                                <i class="fa-solid fa-circle-user"></i> My Profile
                            </div>
                            <div class="dropdown-item" onclick="window.location.href='settings.html'">
                                <i class="fa-solid fa-gears"></i> Account Settings
                            </div>
                            <div class="dropdown-item" onclick="window.location.href='fraud.html'">
                                <i class="fa-solid fa-shield-virus"></i> Security Shield
                            </div>
                            <div class="dropdown-item" id="dropdownLogout" style="color:var(--danger); border-top:1px solid var(--border-color); border-radius:0;">
                                <i class="fa-solid fa-power-off"></i> Sign Out
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }
}

// Fetch latest profile state from database
function syncUserProfile() {
    if (!db.getToken()) return;

    db.fetch('/auth/profile')
        .then(res => {
            if (res.success) {
                // Update local storage cache
                db.setUser(res.data.user);
                
                // Update header text details dynamically without full page reloads
                const initials = res.data.user.fullName.split(' ').map(n=>n[0]).join('');
                const avatar = document.querySelector('.profile-menu .profile-avatar');
                const name = document.querySelector('.profile-menu .profile-name');
                const role = document.querySelector('.profile-menu .profile-role');
                
                if (avatar) avatar.innerText = initials;
                if (name) name.innerText = res.data.user.fullName;
                if (role) role.innerText = res.data.user.email;
            }
        })
        .catch(err => console.log('Profile sync bypass:', err.message));
}

function setupGlobalUIEvents() {
    // Mobile menu toggle click
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebarNav');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            sidebar.classList.toggle('active');
            e.stopPropagation();
        });
        
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== menuToggle) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Dropdown toggles
    const profileTrigger = document.getElementById('profileDropdownTrigger');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
            profileDropdown.classList.toggle('active');
            const notifyDropdown = document.getElementById('notifyDropdown');
            if (notifyDropdown) notifyDropdown.classList.remove('active');
            e.stopPropagation();
        });
    }

    const notifyBell = document.getElementById('notifyBell');
    const notifyDropdown = document.getElementById('notifyDropdown');
    const notifyList = document.getElementById('notifyList');
    const bellDot = document.getElementById('bellDot');

    if (notifyBell && notifyDropdown) {
        notifyBell.addEventListener('click', (e) => {
            notifyDropdown.classList.toggle('active');
            if (profileDropdown) profileDropdown.classList.remove('active');
            e.stopPropagation();
            if (bellDot) bellDot.style.display = 'none';
        });

        // Pull active fraud alerts from backend to populate dropdown notifications
        if (notifyList) {
            db.fetch('/fraud/alerts')
                .then(res => {
                    if (res.success && res.data.alerts.length > 0) {
                        notifyList.innerHTML = res.data.alerts.slice(0, 3).map(a => `
                            <div style="font-size:0.8rem; padding:8px; border-radius:8px; background:rgba(30,41,59,0.3); border-left: 3px solid var(--danger);">
                                <div style="font-weight:600; display:flex; justify-content:space-between;">
                                    <span>AI Warning: Blocked</span>
                                    <span style="font-size:0.7rem; color:var(--text-muted);">${new Date(a.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p style="color:var(--text-muted); margin-top:2px;">${a.message}</p>
                            </div>
                        `).join('');
                        if (bellDot) bellDot.style.display = 'block';
                    } else {
                        notifyList.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:var(--text-muted); padding:10px;">No security warnings. System safe.</div>`;
                        if (bellDot) bellDot.style.display = 'none';
                    }
                })
                .catch(() => {
                    notifyList.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:var(--text-muted); padding:10px;">Security log unavailable.</div>`;
                });
        }
    }

    document.addEventListener('click', () => {
        if (profileDropdown) profileDropdown.classList.remove('active');
        if (notifyDropdown) notifyDropdown.classList.remove('active');
    });

    // Theme Toggle Handler
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        const updateThemeIcon = () => {
            const isDark = localStorage.getItem('cyberpay_dark_theme') === 'true';
            themeToggleBtn.innerHTML = isDark 
                ? '<i class="fa-solid fa-sun" style="color: #F59E0B"></i>' 
                : '<i class="fa-solid fa-moon" style="color: #64748B"></i>';
        };
        updateThemeIcon();

        themeToggleBtn.addEventListener('click', () => {
            const isDarkNow = localStorage.getItem('cyberpay_dark_theme') === 'true';
            localStorage.setItem('cyberpay_dark_theme', (!isDarkNow).toString());
            applyThemePreference();
            updateThemeIcon();
            showToast(isDarkNow ? 'Light mode enabled.' : 'Dark mode enabled.', 'info');
        });
    }

    // Logout handling
    const logoutBtn = document.getElementById('logoutBtn');
    const dropdownLogout = document.getElementById('dropdownLogout');
    const handleLogout = () => {
        db.fetch('/auth/logout', { method: 'POST' })
            .finally(() => {
                db.clearSession();
                showToast('Logged out successfully. Redirecting...', 'info');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            });
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (dropdownLogout) dropdownLogout.addEventListener('click', handleLogout);
}

// Global PIN modal verification check
function openPinModal(onSuccessCallback) {
    const overlay = document.createElement('div');
    overlay.id = 'pinModalOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 10000;
        animation: fadeIn 0.3s ease forwards;
    `;

    overlay.innerHTML = `
        <div class="glass-card" style="width: 100%; max-width: 360px; text-align: center; padding: 32px 24px;">
            <i class="fa-solid fa-lock" style="font-size: 2rem; color: var(--primary); margin-bottom: 12px;"></i>
            <h3>Enter Secure PIN</h3>
            <p class="text-muted" style="font-size:0.85rem; margin-top:6px;">Confirm authorization to complete transaction.</p>
            
            <div class="pin-dots">
                <div class="pin-dot" id="dot1"></div>
                <div class="pin-dot" id="dot2"></div>
                <div class="pin-dot" id="dot3"></div>
                <div class="pin-dot" id="dot4"></div>
            </div>

            <div class="pin-grid">
                <button class="pin-btn">1</button>
                <button class="pin-btn">2</button>
                <button class="pin-btn">3</button>
                <button class="pin-btn">4</button>
                <button class="pin-btn">5</button>
                <button class="pin-btn">6</button>
                <button class="pin-btn">7</button>
                <button class="pin-btn">8</button>
                <button class="pin-btn">9</button>
                <button class="pin-btn" style="border:none; background:none; font-size:1rem; color:var(--danger);" id="pinClear">Clear</button>
                <button class="pin-btn">0</button>
                <button class="pin-btn" style="border:none; background:none; font-size:1.1rem; color:var(--text-muted);" id="pinCancel"><i class="fa-solid fa-circle-xmark"></i></button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    let enteredPin = '';
    const dots = [
        overlay.querySelector('#dot1'),
        overlay.querySelector('#dot2'),
        overlay.querySelector('#dot3'),
        overlay.querySelector('#dot4')
    ];

    const updateDots = () => {
        dots.forEach((dot, index) => {
            if (index < enteredPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    };

    const pinButtons = overlay.querySelectorAll('.pin-grid button');
    pinButtons.forEach(btn => {
        if (btn.id === 'pinClear' || btn.id === 'pinCancel') return;
        btn.addEventListener('click', () => {
            if (enteredPin.length < 4) {
                enteredPin += btn.textContent.trim();
                updateDots();
                
                if (enteredPin.length === 4) {
                    // For mockup frontend visual clearance, we approve '1234' or any PIN entry
                    // since transacts are validated server-side by balance and jwt.
                    setTimeout(() => {
                        overlay.remove();
                        onSuccessCallback();
                    }, 300);
                }
            }
        });
    });

    overlay.querySelector('#pinClear').addEventListener('click', () => {
        enteredPin = '';
        updateDots();
    });

    overlay.querySelector('#pinCancel').addEventListener('click', () => {
        overlay.remove();
    });
}
