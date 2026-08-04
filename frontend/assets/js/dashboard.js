/* 
 * CyberPay AI - Dashboard JS (Integrated Client-Server Edition)
 * Maps page widgets, Chart.js instances, transfers, and billing requests to Live MySQL backend APIs
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initializing Dashboard Page
    if (document.getElementById('dashboard-page-indicator')) {
        initDashboardPage();
    }
    
    // 2. Initializing Fraud Shield Page
    if (document.getElementById('fraud-page-indicator')) {
        initFraudPage();
    }

    // 3. Initializing AI Insights Page
    if (document.getElementById('insights-page-indicator')) {
        initInsightsPage();
    }

    // 4. Initializing Send Money Page
    if (document.getElementById('send-page-indicator')) {
        initSendMoneyPage();
    }

    // 5. Initializing Receive Money Page
    if (document.getElementById('receive-page-indicator')) {
        initReceiveMoneyPage();
    }

    // 6. Initializing Transactions History Page
    if (document.getElementById('txns-page-indicator')) {
        initTransactionsPage();
    }

    // 7. Initializing Bills Page
    if (document.getElementById('bills-page-indicator')) {
        initBillsPage();
    }

    // 8. Initializing Profile Page
    if (document.getElementById('profile-page-indicator')) {
        initProfilePage();
    }

    // 9. Initializing Settings Page
    if (document.getElementById('settings-page-indicator')) {
        initSettingsPage();
    }
});

/* ==========================================================================
   1. Dashboard Page Integration
   ========================================================================== */
async function initDashboardPage() {
    try {
        // Fetch wallet summaries
        const summaryRes = await db.fetch('/wallet/summary');
        if (summaryRes.success) {
            const { balance, totalSent, totalReceived } = summaryRes.data;
            
            const balanceEl = document.getElementById('walletBalanceVal');
            const sentEl = document.getElementById('walletSentVal');
            const receivedEl = document.getElementById('walletReceivedVal');

            if (balanceEl) balanceEl.innerText = `₹${parseFloat(balance).toFixed(2)}`;
            if (sentEl) sentEl.innerText = `₹${parseFloat(totalSent).toFixed(2)}`;
            if (receivedEl) receivedEl.innerText = `₹${parseFloat(totalReceived).toFixed(2)}`;

            // Toggle balance visibility
            const toggleBtn = document.getElementById('toggleBalanceBtn');
            if (toggleBtn && balanceEl) {
                let visible = true;
                toggleBtn.addEventListener('click', () => {
                    visible = !visible;
                    if (visible) {
                        balanceEl.innerText = `₹${parseFloat(balance).toFixed(2)}`;
                        toggleBtn.className = 'fa-solid fa-eye-slash toggle-balance';
                    } else {
                        balanceEl.innerText = '••••••';
                        toggleBtn.className = 'fa-solid fa-eye toggle-balance';
                    }
                });
            }
        }

        // Fetch security score summary
        const reportRes = await db.fetch('/fraud/report');
        if (reportRes.success) {
            const alertsEl = document.getElementById('fraudAlertsVal');
            if (alertsEl) alertsEl.innerText = reportRes.data.overview.blockedTransfers + reportRes.data.overview.flaggedSuspiciousAudits;
        }

        // Fetch recent transactions history list
        const txnRes = await db.fetch('/transactions/history');
        if (txnRes.success) {
            const txns = txnRes.data.history;
            renderTxnTable(txns.slice(0, 5), 'recentTxnTableBody');
            renderDashboardCharts(txns);
        }

    } catch (err) {
        showToast('Error loading dashboard assets.', 'danger');
    }
}

function renderTxnTable(txnList, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    if (txnList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No transaction records found.</td></tr>`;
        return;
    }

    const currentUserId = db.getUser().id;

    tableBody.innerHTML = txnList.map(txn => {
        const date = new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        // Resolve target name representation
        let displayName = 'System Wallet';
        let isDebit = true;

        if (txn.transactionType === 'add-money') {
            displayName = 'Load Deposit';
            isDebit = false;
        } else if (txn.transactionType === 'withdraw') {
            displayName = 'Bank Withdrawal';
            isDebit = true;
        } else if (txn.transactionType === 'bill-payment') {
            displayName = txn.description || 'Utility Bill';
            isDebit = true;
        } else {
            // Transfers
            if (txn.senderId === currentUserId) {
                displayName = txn.receiver ? txn.receiver.fullName : 'External Target';
                isDebit = true;
            } else {
                displayName = txn.sender ? txn.sender.fullName : 'External Source';
                isDebit = false;
            }
        }

        const sign = isDebit ? '-' : '+';
        const amtClass = isDebit ? 'debit' : 'credit';
        
        let riskBadge = `<span class="badge badge-success">Safe</span>`;
        if (txn.fraudRisk === 'SUSPICIOUS') riskBadge = `<span class="badge badge-warning">Audit</span>`;
        if (txn.fraudRisk === 'HIGH_RISK') riskBadge = `<span class="badge badge-danger">Blocked</span>`;

        return `
            <tr style="cursor:pointer;" onclick="openTxnDetailsModal('${txn.id}')">
                <td>
                    <div class="txn-profile">
                        <div class="txn-avatar">${displayName.split(' ').map(n=>n[0]).join('')}</div>
                        <div>
                            <div class="txn-name">${displayName}</div>
                            <div class="txn-details-sub">${txn.transactionType.toUpperCase()}</div>
                        </div>
                    </div>
                </td>
                <td><span style="font-size:0.85rem;">${date}</span></td>
                <td>${riskBadge}</td>
                <td><span class="badge ${txn.status === 'Success' ? 'badge-success' : 'badge-danger'}">${txn.status}</span></td>
                <td><span class="txn-amount ${amtClass}">${sign}₹${parseFloat(txn.amount).toFixed(2)}</span></td>
            </tr>
        `;
    }).join('');
}

async function openTxnDetailsModal(txnId) {
    try {
        const res = await db.fetch(`/transactions/${txnId}`);
        if (!res.success) return;

        const txn = res.data.transaction;
        const currentUserId = db.getUser().id;
        
        let displayName = 'System Wallet';
        let isDebit = true;

        if (txn.transactionType === 'add-money') {
            displayName = 'Load Deposit';
            isDebit = false;
        } else if (txn.transactionType === 'withdraw') {
            displayName = 'Bank Withdrawal';
            isDebit = true;
        } else if (txn.transactionType === 'bill-payment') {
            displayName = txn.description || 'Utility Bill';
            isDebit = true;
        } else {
            if (txn.senderId === currentUserId) {
                displayName = txn.receiver ? txn.receiver.fullName : 'External Target';
                isDebit = true;
            } else {
                displayName = txn.sender ? txn.sender.fullName : 'External Source';
                isDebit = false;
            }
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center; z-index: 10000;
            animation: fadeIn 0.3s ease forwards;
        `;

        overlay.innerHTML = `
            <div class="glass-card" style="width: 100%; max-width: 440px; padding: 32px 24px; position:relative;">
                <i class="fa-solid fa-xmark" id="closeTxnModal" style="position:absolute; right:20px; top:20px; font-size:1.2rem; cursor:pointer; color:var(--text-muted);"></i>
                <h3 style="margin-bottom:20px;">Transaction Details</h3>
                <div style="display:flex; flex-direction:column; gap:14px; text-align:left;">
                    <div style="text-align:center; padding:16px 0; border-bottom:1px solid var(--border-color);">
                        <div style="font-size:2rem; font-weight:700; color:${isDebit ? 'var(--text-color)' : 'var(--success)'};">
                            ${isDebit ? '-' : '+'}₹${parseFloat(txn.amount).toFixed(2)}
                        </div>
                        <p class="text-muted" style="font-size:0.85rem; margin-top:4px;">Status: ${txn.status}</p>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                        <span class="text-muted">Transaction ID:</span><span style="font-weight:500;">${txn.id}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                        <span class="text-muted">Target Name:</span><span style="font-weight:500;">${displayName}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                        <span class="text-muted">Type:</span><span style="font-weight:500;">${txn.transactionType.toUpperCase()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                        <span class="text-muted">Date & Time:</span><span style="font-weight:500;">${new Date(txn.createdAt).toLocaleString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                        <span class="text-muted">AI Risk Classification:</span>
                        <span style="font-weight:500; color:${txn.fraudRisk === 'SAFE' ? 'var(--success)' : txn.fraudRisk === 'SUSPICIOUS' ? 'var(--warning)' : 'var(--danger)'};">${txn.fraudRisk}</span>
                    </div>
                    <div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border-color); font-size:0.85rem;">
                        <span class="text-muted" style="display:block; margin-bottom:4px;">AI Analysis Summary:</span>
                        <p style="background:rgba(30,41,59,0.4); padding:10px; border-radius:8px; line-height:1.4;">
                            ${txn.fraudRisk === 'SAFE' ? 'No anomalies detected. Geolocation and transaction velocity verify. Clear clearance.' : 'Audit warning: Transaction details flagged for further geographic or frequency velocity verification checks.'}
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.querySelector('#closeTxnModal').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    } catch (err) {
        showToast('Error loading transaction details.', 'danger');
    }
}

async function renderDashboardCharts(txns) {
    const doughnutCtx = document.getElementById('spendCategoriesChart');
    const lineCtx = document.getElementById('weeklyActivityChart');
    
    if (doughnutCtx) {
        try {
            const insightsRes = await db.fetch('/insights/spending');
            if (insightsRes.success) {
                const categories = insightsRes.data.categories;
                
                new Chart(doughnutCtx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(categories),
                        datasets: [{
                            data: Object.values(categories),
                            backgroundColor: ['#F59E0B', '#2563EB', '#10B981', '#EC4899', '#64748B'],
                            borderWidth: 1,
                            borderColor: 'transparent'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#94A3B8', font: { family: 'Poppins', size: 10 } }
                            }
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Error rendering spendCategoriesChart:', e.message);
        }
    }

    if (lineCtx) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7DaysLabels = [];
        const last7DaysExpenses = [0, 0, 0, 0, 0, 0, 0];
        const last7DaysIncome = [0, 0, 0, 0, 0, 0, 0];
        const dayStrings = [];
        
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            last7DaysLabels.push(days[d.getDay()]);
            
            const yr = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const dy = String(d.getDate()).padStart(2, '0');
            dayStrings.push(`${yr}-${mo}-${dy}`);
        }
        
        const currentUserId = db.getUser().id;
        txns.filter(t => t.status === 'Success').forEach(t => {
            const txnDate = new Date(t.createdAt);
            const yr = txnDate.getFullYear();
            const mo = String(txnDate.getMonth() + 1).padStart(2, '0');
            const dy = String(txnDate.getDate()).padStart(2, '0');
            const dateStr = `${yr}-${mo}-${dy}`;
            
            const dayIndex = dayStrings.indexOf(dateStr);
            if (dayIndex !== -1) {
                const amt = parseFloat(t.amount);
                let isDebit = true;
                if (t.transactionType === 'add-money') {
                    isDebit = false;
                } else if (t.transactionType === 'withdraw') {
                    isDebit = true;
                } else if (t.transactionType === 'bill-payment') {
                    isDebit = true;
                } else {
                    isDebit = (t.senderId === currentUserId);
                }
                
                if (isDebit) {
                    last7DaysExpenses[dayIndex] += amt;
                } else {
                    last7DaysIncome[dayIndex] += amt;
                }
            }
        });

        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: last7DaysLabels,
                datasets: [
                    {
                        label: 'Expenses ($)',
                        data: last7DaysExpenses,
                        borderColor: '#2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Income ($)',
                        data: last7DaysIncome,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#94A3B8' } },
                    y: { grid: { color: 'rgba(51, 65, 85, 0.2)' }, ticks: { color: '#94A3B8' } }
                },
                plugins: {
                    legend: {
                        labels: { color: '#94A3B8', font: { family: 'Poppins' } }
                    }
                }
            }
        });
    }
}

/* ==========================================================================
   2. Fraud Shield Page Integration
   ========================================================================== */
async function initFraudPage() {
    try {
        // Fetch dynamic report metrics from server MySQL database
        const reportRes = await db.fetch('/fraud/report');
        if (reportRes.success) {
            renderRiskGauge(reportRes.data.overview.overallSafetyRating);
        }

        // Configure switches triggers
        const security = db.getSecurity();
        const shieldToggle = document.getElementById('aiShieldToggle');
        const geoToggle = document.getElementById('geoLockToggle');
        const bioToggle = document.getElementById('biometricsToggle');

        if (shieldToggle) {
            shieldToggle.checked = security.aiShield;
            shieldToggle.addEventListener('change', () => {
                security.aiShield = shieldToggle.checked;
                db.updateSecurity(security);
                showToast(security.aiShield ? 'AI Security Shield Activated.' : 'AI Shield Disabled. System at Risk!', security.aiShield ? 'success' : 'warning');
            });
        }

        if (geoToggle) {
            geoToggle.checked = security.geoLock;
            geoToggle.addEventListener('change', () => {
                security.geoLock = geoToggle.checked;
                db.updateSecurity(security);
                showToast(security.geoLock ? 'Geographic Location Lock enabled.' : 'Geographic lock disabled.');
            });
        }

        if (bioToggle) {
            bioToggle.checked = security.biometrics;
            bioToggle.addEventListener('change', () => {
                security.biometrics = bioToggle.checked;
                db.updateSecurity(security);
                showToast(security.biometrics ? 'Biometric 2FA verification enabled.' : 'Biometric logins disabled.', 'warning');
            });
        }

        // Fetch logs
        const alertsRes = await db.fetch('/fraud/alerts');
        if (alertsRes.success) {
            const alerts = alertsRes.data.alerts;
            
            // Map tab buttons
            const tabBtns = document.querySelectorAll('.log-tab-btn');
            const filterAlerts = (riskType) => {
                let list = alerts;
                if (riskType !== 'All') {
                    list = alerts.filter(a => riskType === 'High-risk' ? a.riskScore >= 70 : a.riskScore < 70);
                }
                
                const tableBody = document.getElementById('fraudTxnLogsTableBody');
                if (tableBody) {
                    if (list.length === 0) {
                        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No security alerts logged.</td></tr>`;
                        return;
                    }
                    tableBody.innerHTML = list.map(a => `
                        <tr>
                            <td><div style="font-weight:600;">Audit Alert #${a.id}</div><span style="font-size:0.75rem; color:var(--text-muted);">${a.alertType}</span></td>
                            <td><span style="font-size:0.85rem;">${new Date(a.createdAt).toLocaleString()}</span></td>
                            <td><span class="badge ${a.riskScore >= 70 ? 'badge-danger' : 'badge-warning'}">${a.riskScore >= 70 ? 'High-risk' : 'Suspicious'}</span></td>
                            <td><span class="badge badge-danger">Blocked</span></td>
                            <td><span class="txn-amount debit" style="font-weight:600;">₹${parseFloat(a.transaction ? a.transaction.amount : 0.00).toFixed(2)}</span></td>
                        </tr>
                    `).join('');
                }
            };

            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    filterAlerts(btn.textContent.trim());
                });
            });

            filterAlerts('All');
        }

    } catch (err) {
        showToast('Error loading security configurations.', 'danger');
    }
}

let riskGaugeChartInstance = null;
function renderRiskGauge(score) {
    const canvas = document.getElementById('riskGaugeChart');
    if (!canvas) return;

    const riskNumEl = document.getElementById('riskScoreNum');
    const riskLabelEl = document.getElementById('riskScoreLabel');
    
    if (riskNumEl) riskNumEl.innerText = score;
    
    let color = '#10B981';
    let label = 'Excellent';
    if (score < 90 && score >= 70) { color = '#F59E0B'; label = 'Moderate'; }
    else if (score < 70) { color = '#EF4444'; label = 'High Danger'; }
    if (riskLabelEl) riskLabelEl.innerText = label;

    riskGaugeChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [color, 'rgba(51, 65, 85, 0.2)'],
                borderWidth: 0,
                circumference: 270,
                rotation: 225
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });
}

/* ==========================================================================
   3. AI Spending Insights Integration
   ========================================================================== */
async function initInsightsPage() {
    try {
        // Fetch spending category aggregations
        const categoriesRes = await db.fetch('/insights/spending');
        if (categoriesRes.success) {
            const categories = categoriesRes.data.categories;
            
            // Populate category spending Bar chart
            const insightsCtx = document.getElementById('insightsCategoryChart');
            if (insightsCtx) {
                new Chart(insightsCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(categories),
                        datasets: [{
                            label: 'Monthly Spent (₹)',
                            data: Object.values(categories),
                            backgroundColor: 'rgba(37, 99, 235, 0.75)',
                            borderColor: '#2563EB',
                            borderWidth: 1,
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { grid: { color: 'rgba(51, 65, 85, 0.1)' }, ticks: { color: '#94A3B8' } },
                            y: { grid: { color: 'rgba(51, 65, 85, 0.1)' }, ticks: { color: '#94A3B8' } }
                        }
                    }
                });
            }
        }

        // Fetch monthly summary spending details
        const summaryRes = await db.fetch('/insights/monthly');
        if (summaryRes.success) {
            const { totalSpent, monthlyBudget, remainingBudget, percentageSpent } = summaryRes.data.summary;
            
            // Adjust slider fills
            const fills = document.querySelectorAll('.budget-progress-fill');
            fills.forEach(fill => {
                const targetPercent = Math.min(percentageSpent, 100);
                setTimeout(() => {
                    fill.style.width = targetPercent + '%';
                }, 300);
            });
        }

        // Fetch advice recommendations cards
        const recsRes = await db.fetch('/insights/recommendations');
        const recommendationsPanel = document.querySelector('.recommendations-panel');
        
        if (recsRes.success && recommendationsPanel) {
            const recommendations = recsRes.data.recommendations;
            let html = `<h3 style="font-size:1.1rem; margin-bottom:4px;">AI Financial Recommendations</h3>
                        <p class="text-muted" style="font-size:0.8rem; margin-bottom:16px;">Actionable recommendations computed by spend intelligence models</p>`;
            
            html += recommendations.map(r => {
                const cardClass = r.level === 'DANGER' ? 'danger' : r.level === 'WARNING' ? 'warning' : 'success';
                const icon = r.level === 'DANGER' ? 'fa-triangle-exclamation' : r.level === 'WARNING' ? 'fa-triangle-exclamation' : 'fa-circle-check';
                
                return `
                    <div class="glass-card insight-card ${cardClass}" style="border-radius:12px; margin:0;">
                        <div class="insight-icon"><i class="fa-solid ${icon}"></i></div>
                        <div class="insight-info">
                            <h4>${r.title}</h4>
                            <p>${r.description}</p>
                        </div>
                    </div>
                `;
            }).join('');

            recommendationsPanel.innerHTML = html;
        }

    } catch (err) {
        showToast('Error compiling spending insights.', 'danger');
    }
}

/* ==========================================================================
   4. Send Money Integration
   ========================================================================== */
function initSendMoneyPage() {
    const form = document.getElementById('sendMoneyForm');
    const recipientField = document.getElementById('recipientField');
    const suggestionsDiv = document.getElementById('recipientSuggestions');
    const riskCheckPanel = document.getElementById('riskCheckStatus');

    if (recipientField && suggestionsDiv) {
        let debounceTimeout;
        recipientField.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            const query = recipientField.value.trim();
            if (query.length < 1) {
                suggestionsDiv.style.display = 'none';
                suggestionsDiv.innerHTML = '';
                return;
            }

            debounceTimeout = setTimeout(async () => {
                try {
                    const res = await db.fetch(`/users/search?query=${encodeURIComponent(query)}`);
                    if (res.success && res.data.users.length > 0) {
                        suggestionsDiv.style.display = 'block';
                        suggestionsDiv.innerHTML = res.data.users.map(u => `
                            <div class="dropdown-item" style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;" data-email="${u.email}">
                                <div style="font-weight: 600; color: var(--text-color);">${u.fullName}</div>
                                <div style="color: var(--text-muted); font-size: 0.75rem;">${u.email} • ${u.phone}</div>
                            </div>
                        `).join('');

                        suggestionsDiv.querySelectorAll('.dropdown-item').forEach(item => {
                            item.addEventListener('click', () => {
                                recipientField.value = item.getAttribute('data-email');
                                suggestionsDiv.style.display = 'none';
                                suggestionsDiv.innerHTML = '';
                            });
                        });
                    } else {
                        suggestionsDiv.style.display = 'none';
                        suggestionsDiv.innerHTML = '';
                    }
                } catch (err) {
                    console.error('Search error:', err);
                }
            }, 300);
        });

        // Close suggestions dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== recipientField && e.target !== suggestionsDiv && !suggestionsDiv.contains(e.target)) {
                suggestionsDiv.style.display = 'none';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const recipient = document.getElementById('recipientField').value.trim();
            const amount = parseFloat(document.getElementById('amountField').value);

            if (!recipient || isNaN(amount) || amount <= 0) {
                showToast('Please check transfer details.', 'warning');
                return;
            }

            // Trigger scanner loader
            if (riskCheckPanel) {
                riskCheckPanel.style.display = 'block';
                riskCheckPanel.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                        <i class="fa-solid fa-spinner fa-spin text-primary"></i>
                        <span>AI Scanning transaction parameters against safety shield...</span>
                    </div>
                `;
            }

            try {
                // Call Risk Analysis check endpoint on server
                const riskRes = await db.fetch('/fraud/check', {
                    method: 'POST',
                    body: JSON.stringify({ amount })
                });

                if (riskRes.success) {
                    const analysis = riskRes.data.analysis;
                    
                    riskCheckPanel.innerHTML = `
                        <div class="insight-card ${analysis.riskLevel === 'HIGH_RISK' ? 'danger' : 'success'}" style="margin: 0; padding:14px; border-radius:10px;">
                            <div style="font-weight:600; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid ${analysis.riskLevel === 'HIGH_RISK' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
                                <span>AI Security Shield: ${analysis.riskLevel}</span>
                            </div>
                            <p style="font-size:0.75rem; margin-top:4px; color:var(--text-muted);">${analysis.message}</p>
                        </div>
                    `;

                    if (analysis.riskLevel === 'HIGH_RISK') {
                        showToast('Transaction blocked by AI Fraud Shield.', 'danger');
                        return;
                    }

                    // Open PIN modal
                    openPinModal(async () => {
                        try {
                            // Call send money transfer API
                            const transferRes = await db.fetch('/transactions/send-money', {
                                method: 'POST',
                                body: JSON.stringify({
                                    receiverEmailOrPhone: recipient,
                                    amount,
                                    description: `Transfer to ${recipient}`
                                })
                            });

                            if (transferRes.success) {
                                showToast(`Successfully sent ₹${amount.toFixed(2)} to ${recipient}!`, 'success');
                                setTimeout(() => {
                                    window.location.href = 'dashboard.html';
                                }, 1500);
                            }
                        } catch (transferErr) {
                            showToast(transferErr.message, 'danger');
                        }
                    });
                }
            } catch (err) {
                showToast(err.message, 'danger');
                if (riskCheckPanel) riskCheckPanel.style.display = 'none';
            }
        });
    }
}

/* ==========================================================================
   5. Receive Money Integration
   ========================================================================== */
function initReceiveMoneyPage() {
    const upiIdEl = document.getElementById('receiveUpiId');
    const user = db.getUser();
    if (upiIdEl && user) upiIdEl.value = user.email; // Use email as mock UPI target identifier

    const amtInput = document.getElementById('qrAmountInput');
    const genBtn = document.getElementById('genQrBtn');
    const qrImage = document.getElementById('receiveQrImg');

    if (genBtn && qrImage && user) {
        genBtn.addEventListener('click', () => {
            const amount = parseFloat(amtInput.value);
            if (!isNaN(amount) && amount > 0) {
                qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${user.email}&am=${amount}`;
                showToast(`Dynamic QR Code generated for ₹${amount.toFixed(2)}`);
            } else {
                qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${user.email}`;
                showToast('Standard QR Code loaded.');
            }
        });
    }
}

/* ==========================================================================
   6. Transactions Ledger History Integration
   ========================================================================== */
async function initTransactionsPage() {
    try {
        const res = await db.fetch('/transactions/history');
        if (res.success) {
            const txns = res.data.history;

            const searchInput = document.getElementById('txnSearchInput');
            const typeFilter = document.getElementById('txnTypeFilter');
            const riskFilter = document.getElementById('txnRiskFilter');

            const filterTxns = () => {
                const query = searchInput ? searchInput.value.toLowerCase() : '';
                const type = typeFilter ? typeFilter.value : 'all';
                const risk = riskFilter ? riskFilter.value : 'all';

                const currentUserId = db.getUser().id;

                let list = txns.filter(t => {
                    let displayName = 'System Wallet';
                    if (t.transactionType === 'add-money') displayName = 'Load Deposit';
                    else if (t.transactionType === 'withdraw') displayName = 'Bank Withdrawal';
                    else if (t.transactionType === 'bill-payment') displayName = t.description || 'Utility';
                    else {
                        displayName = t.senderId === currentUserId 
                            ? (t.receiver ? t.receiver.fullName : 'Receiver')
                            : (t.sender ? t.sender.fullName : 'Sender');
                    }

                    const matchesQuery = displayName.toLowerCase().includes(query) || t.id.toString().includes(query) || t.transactionType.toLowerCase().includes(query);
                    
                    // Match Type
                    let matchesType = true;
                    if (type === 'debit') matchesType = (t.senderId === currentUserId || t.transactionType === 'withdraw');
                    if (type === 'credit') matchesType = (t.receiverId === currentUserId || t.transactionType === 'add-money');

                    const matchesRisk = risk === 'all' || t.fraudRisk.toLowerCase() === risk.toLowerCase();

                    return matchesQuery && matchesType && matchesRisk;
                });

                renderTxnTable(list, 'fullTxnTableBody');
            };

            if (searchInput) searchInput.addEventListener('input', filterTxns);
            if (typeFilter) typeFilter.addEventListener('change', filterTxns);
            if (riskFilter) riskFilter.addEventListener('change', filterTxns);

            filterTxns();
        }

        // Export handles
        const exportPdf = document.getElementById('exportPdfBtn');
        const exportCsv = document.getElementById('exportCsvBtn');

        if (exportCsv) {
            exportCsv.addEventListener('click', () => {
                showToast('Generating CSV statement...', 'info');
                try {
                    const currentUserId = db.getUser().id;
                    let csvContent = "data:text/csv;charset=utf-8,";
                    csvContent += "Transaction ID,Date,Type,Description,Sender,Receiver,Risk Grade,Status,Amount\n";
                    
                    txns.forEach(t => {
                        const date = new Date(t.createdAt).toLocaleString();
                        const senderName = t.senderId === currentUserId ? 'You' : (t.sender ? t.sender.fullName : 'External');
                        const receiverName = t.receiverId === currentUserId ? 'You' : (t.receiver ? t.receiver.fullName : 'External');
                        const amtSign = t.senderId === currentUserId ? '-' : '+';
                        const line = [
                            t.id,
                            `"${date}"`,
                            t.transactionType,
                            `"${t.description || ''}"`,
                            `"${senderName}"`,
                            `"${receiverName}"`,
                            t.fraudRisk,
                            t.status,
                            `${amtSign}${parseFloat(t.amount).toFixed(2)}`
                        ].join(",");
                        csvContent += line + "\n";
                    });
                    
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `cyberpay_statement_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast('CSV statement downloaded successfully!');
                } catch (e) {
                    showToast('Failed to export CSV: ' + e.message, 'danger');
                }
            });
        }

        if (exportPdf) {
            exportPdf.addEventListener('click', () => {
                showToast('Generating printable PDF statement...', 'info');
                try {
                    const currentUserId = db.getUser().id;
                    const printWindow = window.open('', '_blank');
                    let rows = txns.map(t => {
                        const date = new Date(t.createdAt).toLocaleString();
                        const senderName = t.senderId === currentUserId ? 'You' : (t.sender ? t.sender.fullName : 'External');
                        const receiverName = t.receiverId === currentUserId ? 'You' : (t.receiver ? t.receiver.fullName : 'External');
                        const amtSign = t.senderId === currentUserId ? '-' : '+';
                        return `
                            <tr>
                                <td>${t.id}</td>
                                <td>${date}</td>
                                <td>${t.transactionType.toUpperCase()}</td>
                                <td>${t.description || ''}</td>
                                <td>${senderName} to ${receiverName}</td>
                                <td>${t.fraudRisk}</td>
                                <td>${t.status}</td>
                                <td style="font-weight:bold; color:${amtSign === '-' ? '#EF4444' : '#10B981'}">${amtSign}₹${parseFloat(t.amount).toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('');

                    printWindow.document.write(`
                        <html>
                        <head>
                            <title>CyberPay AI - Transaction Statement</title>
                            <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1E293B; }
                                h2 { color: #2563EB; margin-bottom: 5px; }
                                p { color: #64748B; margin-top: 0; margin-bottom: 30px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                th, td { border: 1px solid #E2E8F0; padding: 12px; text-align: left; font-size: 0.9rem; }
                                th { background-color: #F8FAFC; color: #475569; }
                                tr:nth-child(even) { background-color: #F8FAFC; }
                            </style>
                        </head>
                        <body>
                            <h2>CyberPay AI Statement</h2>
                            <p>Generated on ${new Date().toLocaleString()}</p>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Parties</th>
                                        <th>Risk</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                            <script>
                                window.onload = function() {
                                    window.print();
                                    window.close();
                                }
                            </script>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                } catch (e) {
                    showToast('Failed to export PDF: ' + e.message, 'danger');
                }
            });
        }

    } catch (err) {
        showToast('Error loading transactions ledger.', 'danger');
    }
}

/* ==========================================================================
   7. Bills Center Integration
   ========================================================================== */
async function initBillsPage() {
    try {
        // Render dynamic pending dues banner
        const duesContainer = document.getElementById('pendingDuesContainer');
        if (duesContainer) {
            const historyRes = await db.fetch('/bills/history');
            if (historyRes.success) {
                const unpaid = historyRes.data.bills.filter(b => b.status === 'UNPAID');
                if (unpaid.length > 0) {
                    duesContainer.innerHTML = unpaid.map(b => `
                        <div style="background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); border-radius:12px; padding:16px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; animation: fadeIn 0.4s ease;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <i class="fa-solid fa-triangle-exclamation text-warning" style="font-size:1.5rem;"></i>
                                <div>
                                    <div style="font-weight:600; font-size:0.9rem;">${b.billType} Bill Dues Pending</div>
                                    <div class="text-muted" style="font-size:0.8rem;">Invoice #${b.id} amounting to ₹${parseFloat(b.amount).toFixed(2)} is due soon.</div>
                                </div>
                            </div>
                            <button class="btn btn-warning" onclick="payPendingBill(${b.id}, '${b.billType}', ${b.amount})" style="padding:8px 16px; font-size:0.85rem; color:#000; font-weight:600;">Clear Dues Now</button>
                        </div>
                    `).join('');
                } else {
                    duesContainer.innerHTML = `
                        <div style="background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.2); border-radius:12px; padding:16px; display:flex; align-items:center; gap:12px;">
                            <i class="fa-solid fa-circle-check text-success" style="font-size:1.5rem;"></i>
                            <div>
                                <div style="font-weight:600; font-size:0.9rem;">All Utility Dues Cleared</div>
                                <div class="text-muted" style="font-size:0.8rem;">You have no pending payments at this moment.</div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        const billItems = document.querySelectorAll('.bill-category-card');
        billItems.forEach(item => {
            item.addEventListener('click', async () => {
                const billName = item.getAttribute('data-bill');
                const cost = parseFloat(item.getAttribute('data-cost'));

                const confirmPay = confirm(`Pay utility invoice for ${billName} of ₹${cost.toFixed(2)}?`);
                if (confirmPay) {
                    openPinModal(async () => {
                        try {
                            const res = await db.fetch('/bills/pay', {
                                method: 'POST',
                                body: JSON.stringify({
                                    billType: billName,
                                    amount: cost
                                })
                            });

                            if (res.success) {
                                showToast(`Cleared utility invoice of ₹${cost.toFixed(2)} for ${billName}!`, 'success');
                                setTimeout(() => window.location.reload(), 1200);
                            }
                        } catch (payErr) {
                            showToast(payErr.message, 'danger');
                        }
                    });
                }
            });
        });

    } catch (err) {
        showToast('Error loading bills ledger details.', 'danger');
    }
}

/* ==========================================================================
   8. Profile Integration
   ========================================================================== */
function initProfilePage() {
    const user = db.getUser();
    if (!user) return;

    // Populate credentials
    const nameEl = document.getElementById('profileCardName');
    const emailEl = document.getElementById('profileCardEmail');
    const initialsEl = document.getElementById('profileCardInitials');
    
    if (nameEl) nameEl.innerText = user.fullName;
    if (emailEl) emailEl.innerText = user.email;
    if (initialsEl) initialsEl.innerText = user.fullName.split(' ').map(n=>n[0]).join('');

    const inputName = document.getElementById('profileInputName');
    const inputEmail = document.getElementById('profileInputEmail');
    const inputPhone = document.getElementById('profileInputPhone');
    const inputUpi = document.getElementById('profileInputUpi');

    if (inputName) inputName.value = user.fullName;
    if (inputEmail) inputEmail.value = user.email;
    if (inputPhone) inputPhone.value = user.phone;
    if (inputUpi) inputUpi.value = user.email; // Mock UPI

    // Form Update Submit
    const form = document.getElementById('profileEditForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const res = await db.fetch('/auth/profile', {
                    method: 'PUT',
                    body: JSON.stringify({
                        fullName: inputName.value.trim(),
                        email: inputEmail.value.trim(),
                        phone: inputPhone.value.trim()
                    })
                });

                if (res.success) {
                    showToast('Profile credentials saved successfully.');
                    db.setUser(res.data);
                    
                    // Re-render UI
                    if (nameEl) nameEl.innerText = res.data.fullName;
                    if (emailEl) emailEl.innerText = res.data.email;
                    if (initialsEl) initialsEl.innerText = res.data.fullName.split(' ').map(n=>n[0]).join('');
                }
            } catch (err) {
                showToast(err.message, 'danger');
            }
        });
    }

    // Set default linked visa credit cards
    const listContainer = document.getElementById('profileCardGridList');
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="fin-card visa">
                <div class="fin-card-brand">VISA</div>
                <div class="fin-card-number">•••• •••• •••• 4892</div>
                <div class="fin-card-footer">
                    <div>
                        <span style="font-size:0.6rem; display:block; opacity:0.6;">CARD HOLDER</span>
                        <span>ALEX MERCER</span>
                    </div>
                    <div>
                        <span style="font-size:0.6rem; display:block; opacity:0.6;">EXPIRES</span>
                        <span>09/28</span>
                    </div>
                </div>
            </div>
            <div class="add-card-placeholder" onclick="showToast('Bank Link simulator enabled (Success)')">
                <i class="fa-solid fa-circle-plus"></i>
                <span>Link Credit Card</span>
            </div>
        `;
    }
}

/* ==========================================================================
   9. Settings Integration
   ========================================================================== */
function initSettingsPage() {
    const pinForm = document.getElementById('changePinForm');
    if (pinForm) {
        pinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPinVal').value;
            const newPassword = document.getElementById('newPinVal').value;

            try {
                const res = await db.fetch('/auth/change-password', {
                    method: 'POST',
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                if (res.success) {
                    showToast('Security passphrase updated successfully!');
                    pinForm.reset();
                }
            } catch (err) {
                showToast(err.message, 'danger');
            }
        });
    }

    // developer reset db configurations
    const resetBtn = document.getElementById('resetMockDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            const confirmReset = confirm('Restore databases? This will clear all custom transfers ledger.');
            if (confirmReset) {
                showToast('Resetting database and restoring defaults...', 'info');
                try {
                    const res = await db.fetch('/auth/reset-db', { method: 'POST' });
                    if (res.success) {
                        showToast('Database reset successfully! Redirecting...', 'success');
                        db.clearSession();
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 1500);
                    }
                } catch (err) {
                    showToast('Failed to reset database: ' + err.message, 'danger');
                }
            }
        });
    }
}
