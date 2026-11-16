/**
 * AgriConnect — Phase 3: Frontend Authentication & User Management
 * Vanilla JavaScript implementation for registration, login, session, and role authorization.
 */

const API_BASE_URL = 'http://localhost:8080';
const HEALTH_ENDPOINT = `${API_BASE_URL}/api/health`;
const REGISTER_ENDPOINT = `${API_BASE_URL}/api/auth/register`;
const LOGIN_ENDPOINT = `${API_BASE_URL}/api/auth/login`;
const ME_ENDPOINT = `${API_BASE_URL}/api/auth/me`;
const LOGOUT_ENDPOINT = `${API_BASE_URL}/api/auth/logout`;
const CROPS_ENDPOINT = `${API_BASE_URL}/api/crops`;
const FARMER_PROFILE_ENDPOINT = `${API_BASE_URL}/api/farmer/profile`;
const FARMER_HARVESTS_ENDPOINT = `${API_BASE_URL}/api/farmer/harvests`;
const ADMIN_QUALITY_ENDPOINT = `${API_BASE_URL}/api/admin/quality`;
const BUYER_ORDERS_ENDPOINT = `${API_BASE_URL}/api/buyer/orders`;
const FARMER_ORDERS_ENDPOINT = `${API_BASE_URL}/api/farmer/orders`;
const ADMIN_ORDERS_ENDPOINT = `${API_BASE_URL}/api/admin/orders`;
const BUYER_DELIVERIES_ENDPOINT = `${API_BASE_URL}/api/buyer/deliveries`;
const FARMER_DELIVERIES_ENDPOINT = `${API_BASE_URL}/api/farmer/deliveries`;
const ADMIN_DELIVERIES_ENDPOINT = `${API_BASE_URL}/api/admin/deliveries`;

// Phase 10 Payment Endpoints
const BUYER_PAYMENTS_ENDPOINT = `${API_BASE_URL}/api/buyer/payments`;
const FARMER_PAYMENTS_ENDPOINT = `${API_BASE_URL}/api/farmer/payments`;
const ADMIN_PAYMENTS_ENDPOINT = `${API_BASE_URL}/api/admin/payments`;

// Phase 11 Price History & Analytics Endpoints
const FARMER_PRICE_HISTORY_ENDPOINT = `${API_BASE_URL}/api/farmer/price-history`;
const BUYER_PRICE_HISTORY_ENDPOINT = `${API_BASE_URL}/api/buyer/price-history`;
const ADMIN_PRICE_HISTORY_ENDPOINT = `${API_BASE_URL}/api/admin/price-history`;
const PRICE_HISTORY_ENDPOINT = `${API_BASE_URL}/api/price-history`;

const TOKEN_STORAGE_KEY = 'agriconnect_jwt_token';

// State
let currentUser = null;
let allCrops = [];
let farmerHarvests = [];
let activeHarvestFilter = 'ALL';
let adminQualityLots = [];
let activeAdminQualityFilter = 'PENDING';

// Phase 8 Order State
let currentMatchedRequirementId = null;
let farmerOrders = [];
let activeFarmerOrderFilter = 'ALL';
let buyerOrders = [];
let activeBuyerOrderFilter = 'ALL';
let adminOrders = [];
let activeAdminOrderFilter = 'ALL';
let activeOrderUnitPrice = 0;

// Phase 9 Delivery State
let farmerDeliveries = [];
let activeFarmerDeliveryFilter = 'ALL';
let buyerDeliveries = [];
let activeBuyerDeliveryFilter = 'ALL';
let adminDeliveries = [];
let activeAdminDeliveryFilter = 'ALL';

// Phase 10 Payment State
let farmerPayments = [];
let activeFarmerPaymentFilter = 'ALL';
let buyerPayments = [];
let activeBuyerPaymentFilter = 'ALL';
let adminPayments = [];
let activeAdminPaymentFilter = 'ALL';

// Phase 11 Price History & Analytics State
let farmerPriceHistory = [];
let buyerPriceHistory = [];
let adminPriceHistory = [];
let marketplacePriceSummary = null;
let selectedBuyerCropAnalytics = null;

// DOM Elements - Health Monitor (Phase 1)
const backendBadge = document.getElementById('backend-status-badge');
const backendText = document.getElementById('backend-status-text');
const dbBadge = document.getElementById('db-status-badge');
const dbText = document.getElementById('db-status-text');
const phaseText = document.getElementById('phase-text');
const lastCheckedText = document.getElementById('last-checked-text');
const statusMessage = document.getElementById('status-message');
const refreshBtn = document.getElementById('refresh-btn');

// DOM Elements - Auth Section (Phase 3)
const authFormsContainer = document.getElementById('auth-forms-container');
const userProfileContainer = document.getElementById('user-profile-container');
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authAlert = document.getElementById('auth-alert');

// Register Role Toggle Elements
const regRoleSelect = document.getElementById('reg-role');
const farmerFields = document.getElementById('farmer-fields');
const buyerFields = document.getElementById('buyer-fields');

// Profile Card Elements
const userDisplayName = document.getElementById('user-display-name');
const userDisplayEmail = document.getElementById('user-display-email');
const roleStatusBanner = document.getElementById('role-status-banner');
const roleStatusText = document.getElementById('role-status-text');
const userDetailId = document.getElementById('user-detail-id');
const userDetailPhone = document.getElementById('user-detail-phone');
const userDetailRole = document.getElementById('user-detail-role');
const userAvatar = document.getElementById('user-avatar');
const profileSpecBox = document.getElementById('profile-specialization-box');
const specBoxTitle = document.getElementById('spec-box-title');
const specBoxContent = document.getElementById('spec-box-content');
const logoutBtn = document.getElementById('logout-btn');

// Test Bench Elements
const testResultBox = document.getElementById('test-result-box');
const testEndpointBadge = document.getElementById('test-endpoint-badge');
const testStatusBadge = document.getElementById('test-status-badge');
const testResultOutput = document.getElementById('test-result-output');

// ===================================================================
// Token Management
// ===================================================================

function getAuthToken() {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

function setAuthToken(token) {
    if (token) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

// ===================================================================
// Authentication Functions (Section 20)
// ===================================================================

/**
 * Logs in user using email and password.
 */
async function loginUser(email, password) {
    clearErrors();
    hideAlert();
    setButtonLoading('login-submit-btn', 'login-spinner', 'login-btn-text', true, 'Signing In...');

    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data && data.token) {
            setAuthToken(data.token);
            await getCurrentUser();
            showAlert('Welcome back! Successfully authenticated.', 'success');
        } else if (response.status === 401) {
            showAlert(data?.message || 'Invalid email or password. Please try again.', 'error');
        } else if (response.status === 400 && data?.errors) {
            displayFieldErrors(data.errors, 'login');
            showAlert('Please correct the validation errors in the form.', 'error');
        } else {
            showAlert(data?.message || `Authentication failed (HTTP ${response.status})`, 'error');
        }
    } catch (error) {
        showAlert('Network error: Unable to communicate with authentication server.', 'error');
    } finally {
        setButtonLoading('login-submit-btn', 'login-spinner', 'login-btn-text', false, 'Sign In');
    }
}

/**
 * Registers new user (Farmer or Buyer) and automatically logs them in upon success.
 */
async function registerUser(payload) {
    clearErrors();
    hideAlert();
    setButtonLoading('register-submit-btn', 'register-spinner', 'register-btn-text', true, 'Creating Account...');

    try {
        const response = await fetch(REGISTER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (response.status === 201 && data && data.token) {
            setAuthToken(data.token);
            await getCurrentUser();
            showAlert(`Registration successful! Logged in as ${data.role}.`, 'success');
        } else if (response.status === 409) {
            showAlert(data?.message || 'Registration Conflict: Email or phone number is already registered.', 'error');
        } else if (response.status === 400) {
            if (data?.errors) {
                displayFieldErrors(data.errors, 'reg');
                showAlert('Input validation failed. Please check the highlighted fields.', 'error');
            } else {
                showAlert(data?.message || 'Bad Request: Please check your input fields.', 'error');
            }
        } else {
            showAlert(data?.message || `Registration failed (HTTP ${response.status})`, 'error');
        }
    } catch (error) {
        showAlert('Network error: Unable to communicate with registration server.', 'error');
    } finally {
        setButtonLoading('register-submit-btn', 'register-spinner', 'register-btn-text', false, 'Create Account');
    }
}

/**
 * Fetches the currently authenticated user details from /api/auth/me.
 */
async function getCurrentUser() {
    const token = getAuthToken();
    if (!token) {
        renderUnauthenticatedView();
        return;
    }

    try {
        const response = await fetch(ME_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            renderAuthenticatedView(currentUser);
        } else {
            // Token expired or invalid
            setAuthToken(null);
            currentUser = null;
            renderUnauthenticatedView();
        }
    } catch (error) {
        renderUnauthenticatedView();
    }
}

/**
 * Logs out user, invalidates token on backend, and clears local state.
 */
async function logoutUser() {
    const token = getAuthToken();
    if (token) {
        try {
            await fetch(LOGOUT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (ignored) {
            // Proceed with client logout even if network failed
        }
    }

    setAuthToken(null);
    currentUser = null;
    renderUnauthenticatedView();
    showAlert('You have been signed out successfully.', 'success');
}

/**
 * Live test bench function to verify role authorization against /api/farmer/test, /api/buyer/test, /api/admin/test
 */
async function testProtectedEndpoint(endpoint, expectedRole) {
    const token = getAuthToken();
    testResultBox.classList.remove('hidden');
    testEndpointBadge.textContent = `GET ${endpoint}`;
    testStatusBadge.className = 'test-status-code';
    testStatusBadge.textContent = 'Calling...';
    testResultOutput.textContent = 'Requesting protected endpoint with JWT token...';

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Accept': 'application/json'
            }
        });

        const status = response.status;
        const data = await response.json().catch(() => null);

        testStatusBadge.textContent = `HTTP ${status}`;

        if (status === 200) {
            testStatusBadge.className = 'test-status-code status-200';
            testResultOutput.textContent = JSON.stringify(data, null, 2);
        } else if (status === 403) {
            testStatusBadge.className = 'test-status-code status-403';
            testResultOutput.textContent = `HTTP 403 Forbidden\n\n` + JSON.stringify(data, null, 2) +
                `\n\nExplanation: Current user role does NOT have permission for this ${expectedRole}-only resource.`;
        } else if (status === 401) {
            testStatusBadge.className = 'test-status-code status-401';
            testResultOutput.textContent = `HTTP 401 Unauthorized\n\n` + JSON.stringify(data, null, 2) +
                `\n\nExplanation: Request is unauthenticated or token is expired/invalid.`;
        } else {
            testStatusBadge.className = 'test-status-code';
            testResultOutput.textContent = JSON.stringify(data, null, 2);
        }
    } catch (error) {
        testStatusBadge.textContent = 'Network Error';
        testStatusBadge.className = 'test-status-code status-403';
        testResultOutput.textContent = `Error connecting to ${endpoint}: ${error.message}`;
    }
}

// Make testProtectedEndpoint available on window for inline HTML onclick handlers
window.testProtectedEndpoint = testProtectedEndpoint;

// ===================================================================
// UI Rendering & Role Display (Section 19)
// ===================================================================

function renderAuthenticatedView(user) {
    authFormsContainer.classList.add('hidden');
    userProfileContainer.classList.remove('hidden');

    userDisplayName.textContent = user.fullName;
    userDisplayEmail.textContent = user.email;
    userDetailId.textContent = `#${user.userId}`;
    userDetailPhone.textContent = user.phone;
    userDetailRole.textContent = user.role;

    // Reset banner classes
    roleStatusBanner.className = 'role-status-banner';

    // Section 19: Role Display
    if (user.role === 'FARMER') {
        roleStatusBanner.classList.add('role-farmer');
        roleStatusText.textContent = 'Logged in as Farmer';
        userAvatar.textContent = '🧑‍🌾';

        if (user.farmerProfile) {
            profileSpecBox.classList.remove('hidden');
            specBoxTitle.textContent = '🧑‍🌾 Farmer Profile Details';
            specBoxContent.innerHTML = `
                <div><strong>Farm Location:</strong> ${user.farmerProfile.farmLocation || 'Not specified'}</div>
                <div><strong>Farm Size:</strong> ${user.farmerProfile.farmSizeAcres || '0'} Acres</div>
                <div><strong>Experience:</strong> ${user.farmerProfile.experienceYears || '0'} Years</div>
            `;
        } else {
            profileSpecBox.classList.add('hidden');
        }

    } else if (user.role === 'BUYER') {
        roleStatusBanner.classList.add('role-buyer');
        roleStatusText.textContent = 'Logged in as Buyer';
        userAvatar.textContent = '🏪';

        if (user.buyerProfile) {
            profileSpecBox.classList.remove('hidden');
            specBoxTitle.textContent = '🏪 Commercial Buyer Profile Details';
            specBoxContent.innerHTML = `
                <div><strong>Business Name:</strong> ${user.buyerProfile.businessName || 'Not specified'}</div>
                <div><strong>Business Type:</strong> ${user.buyerProfile.businessType || 'RETAILER'}</div>
                <div><strong>GSTIN:</strong> ${user.buyerProfile.gstin || 'N/A'}</div>
                <div><strong>Address:</strong> ${user.buyerProfile.businessAddress || 'Not specified'}</div>
            `;
        } else {
            profileSpecBox.classList.add('hidden');
        }

    } else if (user.role === 'ADMIN') {
        roleStatusBanner.classList.add('role-admin');
        roleStatusText.textContent = 'Logged in as Admin';
        userAvatar.textContent = '🛡️';
        profileSpecBox.classList.add('hidden');
    }

    // Phase 4: Toggle Farmer Dashboard
    const farmerDash = document.getElementById('farmer-dashboard-section');
    if (farmerDash) {
        if (user.role === 'FARMER') {
            farmerDash.classList.remove('hidden');
            initFarmerDashboard();
        } else {
            farmerDash.classList.add('hidden');
        }
    }

    // Phase 5: Toggle Admin Quality Management Dashboard
    const adminQualityDash = document.getElementById('admin-quality-section');
    if (adminQualityDash) {
        if (user.role === 'ADMIN') {
            adminQualityDash.classList.remove('hidden');
            initAdminQualityDashboard();
        } else {
            adminQualityDash.classList.add('hidden');
        }
    }

    // Phase 6: Toggle Buyer Requirements Dashboard
    const buyerDash = document.getElementById('buyer-dashboard-section');
    if (buyerDash) {
        if (user.role === 'BUYER') {
            buyerDash.classList.remove('hidden');
            initBuyerDashboard();
        } else {
            buyerDash.classList.add('hidden');
        }
    }
}

function renderUnauthenticatedView() {
    userProfileContainer.classList.add('hidden');
    authFormsContainer.classList.remove('hidden');
    testResultBox.classList.add('hidden');

    const farmerDash = document.getElementById('farmer-dashboard-section');
    if (farmerDash) {
        farmerDash.classList.add('hidden');
    }

    const adminQualityDash = document.getElementById('admin-quality-section');
    if (adminQualityDash) {
        adminQualityDash.classList.add('hidden');
    }

    const buyerDash = document.getElementById('buyer-dashboard-section');
    if (buyerDash) {
        buyerDash.classList.add('hidden');
    }

    closeEditHarvestModal();
    closeEditFarmerModal();
    closeAdminAssessModal();
    closeFarmerQualityModal();
    closeEditRequirementModal();
    closeViewRequirementModal();
    closePlaceOrderModal();
    closeOrderDetailsModal();
    closeCancelOrderModal();
    closeRejectOrderModal();
}

// ===================================================================
// Tab & Form Switching
// ===================================================================

function switchTab(target) {
    clearErrors();
    hideAlert();

    if (target === 'login') {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// Toggle Farmer vs Buyer Profile Fields
function toggleRoleFields() {
    const selectedRole = regRoleSelect.value;
    if (selectedRole === 'FARMER') {
        farmerFields.classList.remove('hidden');
        buyerFields.classList.add('hidden');
    } else if (selectedRole === 'BUYER') {
        farmerFields.classList.add('hidden');
        buyerFields.classList.remove('hidden');
    }
}

// Quick Demo Credential Helper
function fillDemoCredentials(email, password) {
    switchTab('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    showAlert(`Demo credentials loaded for ${email}. Click "Sign In" to authenticate.`, 'success');
}
window.fillDemoCredentials = fillDemoCredentials;

// Alert helpers
function showAlert(message, type) {
    authAlert.textContent = message;
    authAlert.className = `auth-alert auth-alert-${type}`;
    authAlert.classList.remove('hidden');
}

function hideAlert() {
    authAlert.classList.add('hidden');
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

function displayFieldErrors(errors, prefix) {
    for (const [field, message] of Object.entries(errors)) {
        let errorEl = null;
        if (prefix === 'login') {
            errorEl = document.getElementById(`login-${field}-error`);
        } else {
            errorEl = document.getElementById(`reg-${field.toLowerCase()}-error`);
        }
        if (errorEl) {
            errorEl.textContent = message;
        }
    }
}

function setButtonLoading(btnId, spinnerId, textId, loading, text) {
    const btn = document.getElementById(btnId);
    const spinner = document.getElementById(spinnerId);
    const textSpan = document.getElementById(textId);

    if (btn) btn.disabled = loading;
    if (spinner) spinner.classList.toggle('hidden', !loading);
    if (textSpan) textSpan.textContent = text;
}

// ===================================================================
// Phase 1 System Health & Connection Monitor (Preserved)
// ===================================================================

async function checkSystemHealth() {
    setCheckingState();

    try {
        const response = await fetch(HEALTH_ENDPOINT, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        const now = new Date().toLocaleTimeString();
        if (lastCheckedText) lastCheckedText.textContent = now;

        if (response.ok) {
            const data = await response.json();
            setConnectedState(data);
        } else {
            setDisconnectedState(`Backend returned HTTP status: ${response.status}`);
        }
    } catch (error) {
        const now = new Date().toLocaleTimeString();
        if (lastCheckedText) lastCheckedText.textContent = now;
        setDisconnectedState(
            `Unable to connect to backend at ${HEALTH_ENDPOINT}. Ensure Spring Boot is running on port 8080.`
        );
    }
}

function setCheckingState() {
    if (backendBadge) backendBadge.className = 'status-badge checking';
    if (backendText) backendText.textContent = 'Backend Status: Checking...';

    if (dbBadge) dbBadge.className = 'status-badge checking';
    if (dbText) dbText.textContent = 'Database: Checking...';

    if (statusMessage) {
        statusMessage.className = 'status-message info';
        statusMessage.textContent = 'Checking connection to backend REST API...';
    }
}

function setConnectedState(data) {
    if (backendBadge) backendBadge.className = 'status-badge connected';
    if (backendText) backendText.textContent = 'Backend Status: Connected ✓';

    if (data.database && data.database.toLowerCase().includes('connected')) {
        if (dbBadge) dbBadge.className = 'status-badge connected';
        if (dbText) dbText.textContent = `Database: ${data.database} ✓`;
    } else {
        if (dbBadge) dbBadge.className = 'status-badge disconnected';
        if (dbText) dbText.textContent = `Database: ${data.database || 'Unreachable'} ✗`;
    }

    if (data.phase && phaseText) {
        phaseText.textContent = data.phase;
    }

    if (statusMessage) {
        statusMessage.className = 'status-message info';
        statusMessage.innerHTML = `<strong>System Operational:</strong> Successfully reached ${data.application || 'AgriConnect'} backend. (Status: ${data.status})`;
    }
}

function setDisconnectedState(errorMessage) {
    if (backendBadge) backendBadge.className = 'status-badge disconnected';
    if (backendText) backendText.textContent = 'Backend Status: Disconnected ✗';

    if (dbBadge) dbBadge.className = 'status-badge disconnected';
    if (dbText) dbText.textContent = 'Database: Disconnected ✗';

    if (statusMessage) {
        statusMessage.className = 'status-message error';
        statusMessage.textContent = errorMessage;
    }
}

// ===================================================================
// Event Listeners Initialization
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Health Monitor Initial Poll
    checkSystemHealth();

    // 2. Check Authentication State
    getCurrentUser();

    // 3. Tab switching listeners
    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchTab('login'));
    if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchTab('register'));

    // 4. Role select change listener
    if (regRoleSelect) regRoleSelect.addEventListener('change', toggleRoleFields);

    // 5. Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email) {
                document.getElementById('login-email-error').textContent = 'Email is required';
                return;
            }
            if (!password) {
                document.getElementById('login-password-error').textContent = 'Password is required';
                return;
            }

            loginUser(email, password);
        });
    }

    // 6. Registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('reg-fullname').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const password = document.getElementById('reg-password').value;
            const role = regRoleSelect.value;

            let hasClientError = false;
            clearErrors();

            if (!fullName) {
                document.getElementById('reg-fullname-error').textContent = 'Full name is required';
                hasClientError = true;
            }
            if (!email) {
                document.getElementById('reg-email-error').textContent = 'Email is required';
                hasClientError = true;
            }
            if (!phone) {
                document.getElementById('reg-phone-error').textContent = 'Phone number is required';
                hasClientError = true;
            }
            if (!password || password.length < 6) {
                document.getElementById('reg-password-error').textContent = 'Password must be at least 6 characters';
                hasClientError = true;
            }

            if (hasClientError) return;

            const payload = {
                fullName,
                email,
                phone,
                password,
                role
            };

            if (role === 'FARMER') {
                const farmLocation = document.getElementById('reg-farm-location').value.trim();
                const farmSize = document.getElementById('reg-farm-size').value;
                const experience = document.getElementById('reg-farm-exp').value;

                if (farmLocation) payload.farmLocation = farmLocation;
                if (farmSize) payload.farmSizeAcres = parseFloat(farmSize);
                if (experience) payload.experienceYears = parseInt(experience, 10);
            } else if (role === 'BUYER') {
                const businessName = document.getElementById('reg-business-name').value.trim();
                const businessType = document.getElementById('reg-business-type').value;
                const businessAddress = document.getElementById('reg-business-address').value.trim();
                const gstin = document.getElementById('reg-gstin').value.trim();

                if (businessName) payload.businessName = businessName;
                if (businessType) payload.businessType = businessType;
                if (businessAddress) payload.businessAddress = businessAddress;
                if (gstin) payload.gstin = gstin;
            }

            registerUser(payload);
        });
    }

    // 7. Logout listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logoutUser();
        });
    }

    // 8. Health refresh listener
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            checkSystemHealth();
        });
    }

    // ===============================================================
    // Phase 4 Event Listeners
    // ===============================================================

    // 9. Add Harvest form submit
    const createHarvestForm = document.getElementById('create-harvest-form');
    if (createHarvestForm) {
        createHarvestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitCreateHarvest();
        });
    }

    // 10. Refresh harvests button
    const refreshHarvestsBtn = document.getElementById('refresh-harvests-btn');
    if (refreshHarvestsBtn) {
        refreshHarvestsBtn.addEventListener('click', async () => {
            await loadFarmerHarvests();
            await loadFarmerProfileData();
            showHarvestAlert('Harvest list refreshed.', 'success');
        });
    }

    // 11. Harvest filter tabs (Farmer Dashboard)
    document.querySelectorAll('.filter-tab:not(.admin-q-tab)').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab:not(.admin-q-tab)').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeHarvestFilter = tab.dataset.filter || 'ALL';
            renderHarvestsTable();
        });
    });

    // 12. Edit Harvest modal close / cancel
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const cancelEditModalBtn = document.getElementById('cancel-edit-modal-btn');
    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditHarvestModal);
    if (cancelEditModalBtn) cancelEditModalBtn.addEventListener('click', closeEditHarvestModal);

    // 13. Edit Harvest form submit
    const editHarvestForm = document.getElementById('edit-harvest-form');
    if (editHarvestForm) {
        editHarvestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitUpdateHarvest();
        });
    }

    // 14. Edit Farmer Profile modal open / close / submit
    const editProfileBtn = document.getElementById('edit-farmer-profile-btn');
    const closeProfileModalBtn = document.getElementById('close-profile-modal-btn');
    const cancelProfileModalBtn = document.getElementById('cancel-profile-modal-btn');
    const editFarmerForm = document.getElementById('edit-farmer-form');

    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditFarmerModal);
    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', closeEditFarmerModal);
    if (cancelProfileModalBtn) cancelProfileModalBtn.addEventListener('click', closeEditFarmerModal);
    if (editFarmerForm) {
        editFarmerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitUpdateFarmerProfile();
        });
    }

    // ===============================================================
    // Phase 5: Quality Management Event Listeners
    // ===============================================================

    // 15. Admin Quality Queue Filter Tabs
    document.querySelectorAll('.admin-q-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-q-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAdminQualityFilter = tab.dataset.filter || 'PENDING';
            loadAdminQualityQueue();
        });
    });

    // 16. Refresh Quality Queue button
    const refreshQualityBtn = document.getElementById('refresh-quality-btn');
    if (refreshQualityBtn) {
        refreshQualityBtn.addEventListener('click', async () => {
            await loadAdminQualityMetrics();
            await loadAdminQualityQueue();
            showAdminQualityAlert('Quality assessment queue refreshed.', 'success');
        });
    }

    // 17. Admin Assessment Modal close / cancel
    const closeAssessModalBtn = document.getElementById('close-assess-modal-btn');
    const cancelAssessModalBtn = document.getElementById('cancel-assess-modal-btn');
    if (closeAssessModalBtn) closeAssessModalBtn.addEventListener('click', closeAdminAssessModal);
    if (cancelAssessModalBtn) cancelAssessModalBtn.addEventListener('click', closeAdminAssessModal);

    // 18. Live calculation listeners on 5 quality parameters
    ['param-freshness', 'param-appearance', 'param-size', 'param-color', 'param-ripeness'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateLiveScorePreview);
            input.addEventListener('change', updateLiveScorePreview);
        }
    });

    // 19. Admin Assessment form submit
    const adminAssessForm = document.getElementById('admin-assess-form');
    if (adminAssessForm) {
        adminAssessForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitAdminAssessment();
        });
    }

    // 20. Farmer Quality modal close buttons
    const closeFarmerQModalBtn = document.getElementById('close-farmer-q-modal-btn');
    const closeFarmerQBtn = document.getElementById('close-farmer-q-btn');
    if (closeFarmerQModalBtn) closeFarmerQModalBtn.addEventListener('click', closeFarmerQualityModal);
    if (closeFarmerQBtn) closeFarmerQBtn.addEventListener('click', closeFarmerQualityModal);
});

// ===================================================================
// Phase 4: Farmer Dashboard & Harvest Management Logic
// ===================================================================

async function initFarmerDashboard() {
    const harvestDateInput = document.getElementById('harvest-date');
    if (harvestDateInput && !harvestDateInput.value) {
        harvestDateInput.value = new Date().toISOString().split('T')[0];
    }

    await loadCropCatalog();
    await loadFarmerProfileData();
    await loadFarmerHarvests();
    await loadFarmerOrders();
    await loadFarmerDeliveries();
    await loadFarmerPayments();
    await loadFarmerPriceHistory();
}

async function loadCropCatalog() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(CROPS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            allCrops = result.data || [];
            populateCropSelect(allCrops);
        }
    } catch (err) {
        console.error('Failed to load crop catalog:', err);
    }
}

function populateCropSelect(crops) {
    const select = document.getElementById('harvest-crop-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose a crop from catalog --</option>';
    crops.forEach(crop => {
        const opt = document.createElement('option');
        opt.value = crop.cropId;
        opt.textContent = `${crop.cropName} (${crop.category} • Season: ${crop.season})`;
        select.appendChild(opt);
    });
}

async function loadFarmerProfileData() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(FARMER_PROFILE_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const profile = result.data;
            if (profile) {
                const locEl = document.getElementById('stat-farm-location');
                const sizeEl = document.getElementById('stat-farm-size');
                const expEl = document.getElementById('stat-farm-exp');
                const totalEl = document.getElementById('stat-total-harvests');
                const activeEl = document.getElementById('stat-active-harvests');

                if (locEl) locEl.textContent = profile.farmLocation || 'Not set';
                if (sizeEl) sizeEl.textContent = `${profile.farmSizeAcres || '0'} Acres`;
                if (expEl) expEl.textContent = `${profile.experienceYears || '0'} Years`;
                if (totalEl) totalEl.textContent = profile.totalHarvestsCount || '0';
                if (activeEl) activeEl.textContent = profile.activeHarvestsCount || '0';

                const harvestLocInput = document.getElementById('harvest-location');
                if (harvestLocInput && !harvestLocInput.value && profile.farmLocation && profile.farmLocation !== 'Not specified') {
                    harvestLocInput.value = profile.farmLocation;
                }
            }
        }
    } catch (err) {
        console.error('Failed to load farmer profile:', err);
    }
}

async function loadFarmerHarvests() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(FARMER_HARVESTS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            farmerHarvests = result.data || [];
            updateHarvestFilterCounts(farmerHarvests);
            renderHarvestsTable();
        }
    } catch (err) {
        console.error('Failed to load farmer harvests:', err);
    }
}

function updateHarvestFilterCounts(harvests) {
    const countAll = harvests.length;
    const countAvail = harvests.filter(h => h.status === 'AVAILABLE').length;
    const countPart = harvests.filter(h => h.status === 'PARTIALLY_SOLD').length;
    const countSold = harvests.filter(h => h.status === 'SOLD_OUT').length;
    const countCanc = harvests.filter(h => h.status === 'CANCELLED').length;

    const elAll = document.getElementById('filter-count-all');
    const elAvail = document.getElementById('filter-count-avail');
    const elPart = document.getElementById('filter-count-part');
    const elSold = document.getElementById('filter-count-sold');
    const elCanc = document.getElementById('filter-count-canc');

    if (elAll) elAll.textContent = countAll;
    if (elAvail) elAvail.textContent = countAvail;
    if (elPart) elPart.textContent = countPart;
    if (elSold) elSold.textContent = countSold;
    if (elCanc) elCanc.textContent = countCanc;
}

function renderHarvestsTable() {
    const tbody = document.getElementById('harvests-tbody');
    if (!tbody) return;

    const filtered = activeHarvestFilter === 'ALL'
        ? farmerHarvests
        : farmerHarvests.filter(h => h.status === activeHarvestFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #64748b;">No harvest lots found for filter: <strong>${activeHarvestFilter}</strong>.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(h => {
        const statusClass = `status-${h.status.toLowerCase().replace('_', '-')}`;
        return `
            <tr>
                <td><span class="lot-id-badge">#H-${h.harvestId}</span></td>
                <td>
                    <div class="crop-name-cell">
                        <strong>${escapeHtml(h.cropName)}</strong>
                        <span class="crop-category-tag">${h.cropCategory}</span>
                    </div>
                </td>
                <td>
                    <span class="qty-val qty-avail">${Number(h.availableQuantity).toLocaleString()}</span>
                    <span class="qty-init">/ ${Number(h.initialQuantity).toLocaleString()} kg</span>
                </td>
                <td><span class="price-val">₹${Number(h.pricePerKg).toFixed(2)}</span></td>
                <td>${h.harvestDate}</td>
                <td>${escapeHtml(h.location)}</td>
                <td><span class="status-pill ${statusClass}">${h.status}</span></td>
                <td>
                    <div class="action-btn-group">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="viewFarmerHarvestQuality(${h.harvestId})">⭐ Quality</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="openEditHarvestModal(${h.harvestId})">✏️ Edit</button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="handleDeleteHarvest(${h.harvestId})">🗑️ Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function submitCreateHarvest() {
    clearHarvestErrors();
    hideHarvestAlert();

    const cropIdVal = document.getElementById('harvest-crop-select').value;
    const quantityVal = document.getElementById('harvest-quantity').value;
    const priceVal = document.getElementById('harvest-price').value;
    const dateVal = document.getElementById('harvest-date').value;
    const locationVal = document.getElementById('harvest-location').value.trim();

    let hasError = false;

    if (!cropIdVal) {
        document.getElementById('harvest-crop-error').textContent = 'Please select a crop';
        hasError = true;
    }
    if (!quantityVal || parseFloat(quantityVal) <= 0) {
        document.getElementById('harvest-quantity-error').textContent = 'Quantity must be greater than 0 kg';
        hasError = true;
    }
    if (!priceVal || parseFloat(priceVal) <= 0) {
        document.getElementById('harvest-price-error').textContent = 'Price must be greater than ₹0';
        hasError = true;
    }
    if (!dateVal) {
        document.getElementById('harvest-date-error').textContent = 'Harvest date is required';
        hasError = true;
    }
    if (!locationVal) {
        document.getElementById('harvest-location-error').textContent = 'Location is required';
        hasError = true;
    }

    if (hasError) return;

    setButtonLoading('add-harvest-btn', 'add-harvest-spinner', 'add-harvest-text', true, 'Listing Lot...');

    const payload = {
        cropId: parseInt(cropIdVal, 10),
        quantity: parseFloat(quantityVal),
        pricePerKg: parseFloat(priceVal),
        harvestDate: dateVal,
        location: locationVal
    };

    const token = getAuthToken();

    try {
        const response = await fetch(FARMER_HARVESTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (response.status === 201) {
            showHarvestAlert(`Harvest lot #H-${data.data.harvestId} (${data.data.cropName}) listed successfully!`, 'success');
            document.getElementById('harvest-crop-select').value = '';
            document.getElementById('harvest-quantity').value = '';
            document.getElementById('harvest-price').value = '';
            await loadFarmerHarvests();
            await loadFarmerProfileData();
        } else if (response.status === 400 && data?.errors) {
            for (const [field, msg] of Object.entries(data.errors)) {
                const el = document.getElementById(`harvest-${field.toLowerCase()}-error`);
                if (el) el.textContent = msg;
            }
            showHarvestAlert('Please correct the validation errors in the form.', 'error');
        } else {
            showHarvestAlert(data?.message || 'Failed to create harvest lot.', 'error');
        }
    } catch (err) {
        showHarvestAlert('Network error: Unable to create harvest lot.', 'error');
    } finally {
        setButtonLoading('add-harvest-btn', 'add-harvest-spinner', 'add-harvest-text', false, 'List Harvest Lot');
    }
}

function openEditHarvestModal(harvestId) {
    const harvest = farmerHarvests.find(h => h.harvestId === harvestId);
    if (!harvest) return;

    document.getElementById('edit-harvest-id').value = harvest.harvestId;
    document.getElementById('modal-crop-title').textContent = `Edit Harvest Lot #H-${harvest.harvestId} (${harvest.cropName})`;
    document.getElementById('edit-available-qty').value = harvest.availableQuantity;
    document.getElementById('edit-price').value = harvest.pricePerKg;
    document.getElementById('edit-date').value = harvest.harvestDate;
    document.getElementById('edit-status').value = harvest.status;
    document.getElementById('edit-location').value = harvest.location;
    document.getElementById('edit-max-qty-helper').textContent = `Initial Lot Quantity: ${harvest.initialQuantity} kg (Max available)`;

    const modalAlert = document.getElementById('edit-modal-alert');
    if (modalAlert) modalAlert.classList.add('hidden');

    const modal = document.getElementById('edit-harvest-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openEditHarvestModal = openEditHarvestModal;

function closeEditHarvestModal() {
    const modal = document.getElementById('edit-harvest-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeEditHarvestModal = closeEditHarvestModal;

async function submitUpdateHarvest() {
    const harvestId = document.getElementById('edit-harvest-id').value;
    const availableQty = document.getElementById('edit-available-qty').value;
    const price = document.getElementById('edit-price').value;
    const date = document.getElementById('edit-date').value;
    const status = document.getElementById('edit-status').value;
    const location = document.getElementById('edit-location').value.trim();

    const payload = {};
    if (availableQty !== '') payload.availableQuantity = parseFloat(availableQty);
    if (price !== '') payload.pricePerKg = parseFloat(price);
    if (date) payload.harvestDate = date;
    if (status) payload.status = status;
    if (location) payload.location = location;

    setButtonLoading('save-harvest-changes-btn', 'edit-save-spinner', 'edit-save-text', true, 'Saving...');

    const token = getAuthToken();

    try {
        const response = await fetch(`${FARMER_HARVESTS_ENDPOINT}/${harvestId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
            closeEditHarvestModal();
            showHarvestAlert(`Harvest lot #H-${harvestId} updated successfully.`, 'success');
            await loadFarmerHarvests();
            await loadFarmerProfileData();
        } else {
            const modalAlert = document.getElementById('edit-modal-alert');
            if (modalAlert) {
                modalAlert.textContent = data?.message || 'Failed to update harvest.';
                modalAlert.className = 'auth-alert auth-alert-error';
                modalAlert.classList.remove('hidden');
            }
        }
    } catch (err) {
        const modalAlert = document.getElementById('edit-modal-alert');
        if (modalAlert) {
            modalAlert.textContent = 'Network error: Failed to update harvest.';
            modalAlert.className = 'auth-alert auth-alert-error';
            modalAlert.classList.remove('hidden');
        }
    } finally {
        setButtonLoading('save-harvest-changes-btn', 'edit-save-spinner', 'edit-save-text', false, 'Save Changes');
    }
}

async function handleDeleteHarvest(harvestId) {
    const confirmDelete = window.confirm(`Are you sure you want to delete or cancel Harvest Lot #H-${harvestId}?`);
    if (!confirmDelete) return;

    const token = getAuthToken();

    try {
        const response = await fetch(`${FARMER_HARVESTS_ENDPOINT}/${harvestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
            showHarvestAlert(`Harvest lot #H-${harvestId} deleted successfully.`, 'success');
            await loadFarmerHarvests();
            await loadFarmerProfileData();
        } else if (response.status === 400) {
            // Associated with orders! Offer to mark CANCELLED instead.
            const cancelConfirm = window.confirm(
                `${data?.message || 'Cannot delete this harvest because orders exist.'}\n\nWould you like to change its status to CANCELLED instead?`
            );
            if (cancelConfirm) {
                await updateHarvestStatusToCancelled(harvestId);
            }
        } else {
            showHarvestAlert(data?.message || `Failed to delete harvest (HTTP ${response.status})`, 'error');
        }
    } catch (err) {
        showHarvestAlert('Network error: Unable to process harvest deletion.', 'error');
    }
}
window.handleDeleteHarvest = handleDeleteHarvest;

async function updateHarvestStatusToCancelled(harvestId) {
    const token = getAuthToken();
    try {
        const response = await fetch(`${FARMER_HARVESTS_ENDPOINT}/${harvestId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ status: 'CANCELLED' })
        });

        if (response.ok) {
            showHarvestAlert(`Harvest lot #H-${harvestId} status updated to CANCELLED.`, 'success');
            await loadFarmerHarvests();
            await loadFarmerProfileData();
        } else {
            showHarvestAlert('Failed to update harvest status to CANCELLED.', 'error');
        }
    } catch (err) {
        showHarvestAlert('Network error: Failed to cancel harvest.', 'error');
    }
}

function openEditFarmerModal() {
    const locText = document.getElementById('stat-farm-location').textContent;
    const sizeText = document.getElementById('stat-farm-size').textContent;
    const expText = document.getElementById('stat-farm-exp').textContent;

    document.getElementById('edit-profile-location').value = locText !== 'Not set' ? locText : '';
    document.getElementById('edit-profile-size').value = parseFloat(sizeText) || '';
    document.getElementById('edit-profile-exp').value = parseInt(expText, 10) || '';

    const modalAlert = document.getElementById('edit-profile-alert');
    if (modalAlert) modalAlert.classList.add('hidden');

    const modal = document.getElementById('edit-farmer-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openEditFarmerModal = openEditFarmerModal;

function closeEditFarmerModal() {
    const modal = document.getElementById('edit-farmer-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeEditFarmerModal = closeEditFarmerModal;

async function submitUpdateFarmerProfile() {
    const locationVal = document.getElementById('edit-profile-location').value.trim();
    const sizeVal = document.getElementById('edit-profile-size').value;
    const expVal = document.getElementById('edit-profile-exp').value;

    const payload = {};
    if (locationVal) payload.farmLocation = locationVal;
    if (sizeVal) payload.farmSizeAcres = parseFloat(sizeVal);
    if (expVal) payload.experienceYears = parseInt(expVal, 10);

    setButtonLoading('save-profile-btn', 'save-profile-spinner', 'save-profile-text', true, 'Saving...');

    const token = getAuthToken();

    try {
        const response = await fetch(FARMER_PROFILE_ENDPOINT, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
            closeEditFarmerModal();
            showAlert('Farmer profile updated successfully!', 'success');
            await loadFarmerProfileData();
            await getCurrentUser(); // Update upper profile card
        } else {
            const modalAlert = document.getElementById('edit-profile-alert');
            if (modalAlert) {
                modalAlert.textContent = data?.message || 'Failed to update profile.';
                modalAlert.className = 'auth-alert auth-alert-error';
                modalAlert.classList.remove('hidden');
            }
        }
    } catch (err) {
        const modalAlert = document.getElementById('edit-profile-alert');
        if (modalAlert) {
            modalAlert.textContent = 'Network error: Failed to update profile.';
            modalAlert.className = 'auth-alert auth-alert-error';
            modalAlert.classList.remove('hidden');
        }
    } finally {
        setButtonLoading('save-profile-btn', 'save-profile-spinner', 'save-profile-text', false, 'Update Profile');
    }
}

function showHarvestAlert(message, type) {
    const alertEl = document.getElementById('harvest-alert');
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = `auth-alert auth-alert-${type}`;
    alertEl.classList.remove('hidden');
}

function hideHarvestAlert() {
    const alertEl = document.getElementById('harvest-alert');
    if (alertEl) alertEl.classList.add('hidden');
}

function clearHarvestErrors() {
    ['harvest-crop-error', 'harvest-quantity-error', 'harvest-price-error', 'harvest-date-error', 'harvest-location-error'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, function(m) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[m];
    });
}
window.escapeHtml = escapeHtml;

// ===================================================================
// Phase 5: Farmer Quality Inspection Modal Logic
// ===================================================================

async function viewFarmerHarvestQuality(harvestId) {
    const token = getAuthToken();
    if (!token) return;

    const modal = document.getElementById('farmer-quality-modal');
    const assessedBody = document.getElementById('farmer-q-modal-body');
    const unassessedBody = document.getElementById('farmer-q-unassessed-body');
    if (!modal) return;

    try {
        const response = await fetch(`${FARMER_HARVESTS_ENDPOINT}/${harvestId}/quality`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const data = result.data;

            if (data && data.assessmentId) {
                // Assessment is present
                if (assessedBody) assessedBody.classList.remove('hidden');
                if (unassessedBody) unassessedBody.classList.add('hidden');

                const scoreEl = document.getElementById('farmer-q-score');
                if (scoreEl) scoreEl.textContent = Number(data.qualityScore).toFixed(2);

                const gradeBadge = document.getElementById('farmer-q-grade-badge');
                if (gradeBadge) {
                    gradeBadge.textContent = `Grade ${data.qualityGrade}`;
                    gradeBadge.className = `grade-badge grade-${data.qualityGrade.toLowerCase()}`;
                }

                const statusBadge = document.getElementById('farmer-q-status-badge');
                if (statusBadge) {
                    statusBadge.textContent = data.verificationStatus;
                    statusBadge.className = `verif-badge verif-${data.verificationStatus.toLowerCase()}`;
                }

                const setField = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = val;
                };

                setField('farmer-q-freshness', `${data.freshness} / 10`);
                setField('farmer-q-appearance', `${data.appearance} / 10`);
                setField('farmer-q-size', `${data.size} / 10`);
                setField('farmer-q-color', `${data.color} / 10`);
                setField('farmer-q-ripeness', `${data.ripeness} / 10`);
                setField('farmer-q-damage', `${Number(data.damagePercentage).toFixed(1)}%`);

                setField('farmer-q-harvest-date', data.harvestDate || '--');
                setField('farmer-q-assess-date', data.assessmentDate || '--');
                setField('farmer-q-inspector', data.adminName || `Admin #${data.adminId}`);
                setField('farmer-q-notes', data.inspectorNotes || 'No additional remarks recorded.');
            } else {
                // Not assessed yet
                if (assessedBody) assessedBody.classList.add('hidden');
                if (unassessedBody) unassessedBody.classList.remove('hidden');
            }

            modal.classList.remove('hidden');
        } else if (response.status === 403) {
            alert('Access Denied: You do not have permission to view quality information for this harvest.');
        } else {
            alert('Failed to retrieve quality assessment.');
        }
    } catch (err) {
        console.error('Error fetching quality:', err);
    }
}
window.viewFarmerHarvestQuality = viewFarmerHarvestQuality;

function closeFarmerQualityModal() {
    const modal = document.getElementById('farmer-quality-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeFarmerQualityModal = closeFarmerQualityModal;

// ===================================================================
// Phase 5: Admin Quality Management Dashboard Logic
// ===================================================================

async function initAdminQualityDashboard() {
    await loadAdminQualityMetrics();
    await loadAdminQualityQueue();
    await loadAdminOrders();
    await loadAdminDeliveries();
    await loadAdminPayments();
    await loadAdminPriceHistory();
}

async function loadAdminQualityMetrics() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(`${ADMIN_QUALITY_ENDPOINT}/metrics`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const res = await response.json();
            const metrics = res.data || {};
            const elPending = document.getElementById('admin-stat-pending');
            const elVerified = document.getElementById('admin-stat-verified');
            const elRejected = document.getElementById('admin-stat-rejected');
            const elTotal = document.getElementById('admin-stat-total');

            if (elPending) elPending.textContent = metrics.pendingTotal ?? 0;
            if (elVerified) elVerified.textContent = metrics.verified ?? 0;
            if (elRejected) elRejected.textContent = metrics.rejected ?? 0;
            if (elTotal) elTotal.textContent = metrics.totalHarvests ?? 0;
        }
    } catch (err) {
        console.error('Failed to load quality metrics:', err);
    }
}

async function loadAdminQualityQueue() {
    const token = getAuthToken();
    if (!token) return;

    const tbody = document.getElementById('admin-quality-tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #64748b;">Loading quality queue...</td></tr>';
    }

    try {
        const url = `${ADMIN_QUALITY_ENDPOINT}/pending?status=${encodeURIComponent(activeAdminQualityFilter)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const res = await response.json();
            adminQualityLots = res.data || [];
            renderAdminQualityTable();
        } else {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #ef4444;">Failed to load quality assessment queue.</td></tr>';
            }
        }
    } catch (err) {
        console.error('Failed to load quality queue:', err);
    }
}

function renderAdminQualityTable() {
    const tbody = document.getElementById('admin-quality-tbody');
    if (!tbody) return;

    if (adminQualityLots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #64748b;">No harvest lots found matching filter: <strong>${activeAdminQualityFilter}</strong>.</td></tr>`;
        return;
    }

    tbody.innerHTML = adminQualityLots.map(lot => {
        let statusBadge = '';
        let scoreBadge = '';
        let actionButtons = '';

        if (!lot.hasAssessment || lot.assessmentStatus === 'NOT_ASSESSED') {
            statusBadge = '<span class="verif-badge verif-not-assessed">NOT ASSESSED</span>';
            scoreBadge = '<span style="color: #94a3b8; font-size: 0.85rem;">--</span>';
            actionButtons = `<button type="button" class="btn btn-primary btn-sm" onclick="openAdminAssessModal(${lot.harvestId}, null)">➕ Assess</button>`;
        } else if (lot.assessmentStatus === 'PENDING') {
            statusBadge = '<span class="verif-badge verif-pending">PENDING</span>';
            scoreBadge = `
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <strong>${Number(lot.qualityScore).toFixed(2)}</strong>
                    <span class="grade-badge grade-${lot.qualityGrade.toLowerCase()}">${lot.qualityGrade}</span>
                </div>
            `;
            actionButtons = `
                <div class="action-btn-group">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="openAdminAssessModal(${lot.harvestId}, ${lot.assessmentId})">✏️ Edit</button>
                    <button type="button" class="btn btn-primary btn-sm" style="background: #16a34a;" onclick="handleAdminVerifyQuality(${lot.assessmentId})">✅ Verify</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="handleAdminRejectQuality(${lot.assessmentId})">❌ Reject</button>
                </div>
            `;
        } else if (lot.assessmentStatus === 'VERIFIED') {
            statusBadge = '<span class="verif-badge verif-verified">VERIFIED</span>';
            scoreBadge = `
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <strong>${Number(lot.qualityScore).toFixed(2)}</strong>
                    <span class="grade-badge grade-${lot.qualityGrade.toLowerCase()}">${lot.qualityGrade}</span>
                </div>
            `;
            actionButtons = `
                <div class="action-btn-group">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="openAdminAssessModal(${lot.harvestId}, ${lot.assessmentId})">✏️ Re-Assess</button>
                </div>
            `;
        } else if (lot.assessmentStatus === 'REJECTED') {
            statusBadge = '<span class="verif-badge verif-rejected">REJECTED</span>';
            scoreBadge = `
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <strong>${Number(lot.qualityScore).toFixed(2)}</strong>
                    <span class="grade-badge grade-${lot.qualityGrade.toLowerCase()}">${lot.qualityGrade}</span>
                </div>
            `;
            actionButtons = `
                <div class="action-btn-group">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="openAdminAssessModal(${lot.harvestId}, ${lot.assessmentId})">✏️ Re-Assess</button>
                    <button type="button" class="btn btn-primary btn-sm" style="background: #16a34a;" onclick="handleAdminVerifyQuality(${lot.assessmentId})">✅ Verify</button>
                </div>
            `;
        }

        return `
            <tr>
                <td><span class="lot-id-badge">#H-${lot.harvestId}</span></td>
                <td>
                    <div class="crop-name-cell">
                        <strong>${escapeHtml(lot.cropName)}</strong>
                        <span class="crop-category-tag">${lot.cropCategory || 'CROP'}</span>
                    </div>
                </td>
                <td>
                    <div><strong>${escapeHtml(lot.farmerName)}</strong></div>
                    <small style="color: #64748b;">${escapeHtml(lot.farmerPhone || '')}</small>
                </td>
                <td>
                    <span class="qty-val qty-avail">${Number(lot.availableQuantity).toLocaleString()}</span>
                    <span class="qty-init">/ ${Number(lot.initialQuantity).toLocaleString()} kg</span>
                </td>
                <td>${lot.harvestDate}</td>
                <td>${escapeHtml(lot.location)}</td>
                <td>${statusBadge}</td>
                <td>${scoreBadge}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

// Modal handling
async function openAdminAssessModal(harvestId, assessmentId) {
    const token = getAuthToken();
    if (!token) return;

    const modal = document.getElementById('admin-assess-modal');
    const title = document.getElementById('assess-modal-title');
    const alertBox = document.getElementById('assess-modal-alert');
    if (alertBox) alertBox.classList.add('hidden');

    document.getElementById('assess-harvest-id').value = harvestId;
    document.getElementById('assess-existing-id').value = assessmentId || '';

    try {
        const response = await fetch(`${ADMIN_QUALITY_ENDPOINT}/harvests/${harvestId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = (await response.json()).data;
            const h = data.harvest;
            const qa = data.assessment;

            document.getElementById('assess-ctx-crop').textContent = `${h.cropName} (${h.cropCategory})`;
            document.getElementById('assess-ctx-farmer').textContent = `${h.farmerName} (#${h.farmerId})`;
            document.getElementById('assess-ctx-qty').textContent = Number(h.availableQuantity).toLocaleString();
            document.getElementById('assess-ctx-date').textContent = h.harvestDate;
            document.getElementById('assess-ctx-location').textContent = h.location;

            if (qa) {
                title.textContent = `Update Quality Assessment (#QA-${qa.assessmentId})`;
                document.getElementById('param-freshness').value = qa.freshness;
                document.getElementById('param-appearance').value = qa.appearance;
                document.getElementById('param-size').value = qa.size;
                document.getElementById('param-color').value = qa.color;
                document.getElementById('param-ripeness').value = qa.ripeness;
                document.getElementById('param-damage').value = qa.damagePercentage;
                document.getElementById('param-notes').value = qa.inspectorNotes || '';
                document.getElementById('save-assess-text').textContent = 'Update & Re-Submit Assessment';
            } else {
                title.textContent = `New Quality Assessment for Lot #H-${harvestId}`;
                document.getElementById('param-freshness').value = 8;
                document.getElementById('param-appearance').value = 8;
                document.getElementById('param-size').value = 8;
                document.getElementById('param-color').value = 8;
                document.getElementById('param-ripeness').value = 8;
                document.getElementById('param-damage').value = 3.0;
                document.getElementById('param-notes').value = '';
                document.getElementById('save-assess-text').textContent = 'Save Official Assessment';
            }

            updateLiveScorePreview();
            modal.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Failed to open assess modal:', err);
    }
}
window.openAdminAssessModal = openAdminAssessModal;

function closeAdminAssessModal() {
    const modal = document.getElementById('admin-assess-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeAdminAssessModal = closeAdminAssessModal;

function updateLiveScorePreview() {
    const f = parseFloat(document.getElementById('param-freshness').value) || 0;
    const a = parseFloat(document.getElementById('param-appearance').value) || 0;
    const s = parseFloat(document.getElementById('param-size').value) || 0;
    const c = parseFloat(document.getElementById('param-color').value) || 0;
    const r = parseFloat(document.getElementById('param-ripeness').value) || 0;

    const avg = (f + a + s + c + r) / 5.0;
    const score = avg * 10.0;
    const scoreFormatted = Math.min(100, Math.max(0, score)).toFixed(2);

    let grade = 'C';
    let gradeClass = 'grade-c';
    if (score >= 80) {
        grade = 'A';
        gradeClass = 'grade-a';
    } else if (score >= 60) {
        grade = 'B';
        gradeClass = 'grade-b';
    }

    const scoreNumEl = document.getElementById('preview-score-num');
    const gradeBadgeEl = document.getElementById('preview-grade-badge');
    if (scoreNumEl) scoreNumEl.textContent = scoreFormatted;
    if (gradeBadgeEl) {
        gradeBadgeEl.textContent = `Grade ${grade}`;
        gradeBadgeEl.className = `grade-badge ${gradeClass}`;
    }
}

async function submitAdminAssessment() {
    const token = getAuthToken();
    if (!token) return;

    const harvestId = parseInt(document.getElementById('assess-harvest-id').value, 10);
    const existingId = document.getElementById('assess-existing-id').value;
    const modalAlert = document.getElementById('assess-modal-alert');
    if (modalAlert) modalAlert.classList.add('hidden');

    const freshness = parseInt(document.getElementById('param-freshness').value, 10);
    const appearance = parseInt(document.getElementById('param-appearance').value, 10);
    const size = parseInt(document.getElementById('param-size').value, 10);
    const color = parseInt(document.getElementById('param-color').value, 10);
    const ripeness = parseInt(document.getElementById('param-ripeness').value, 10);
    const damage = parseFloat(document.getElementById('param-damage').value);
    const notes = document.getElementById('param-notes').value.trim();

    if ([freshness, appearance, size, color, ripeness].some(v => isNaN(v) || v < 1 || v > 10)) {
        if (modalAlert) {
            modalAlert.textContent = 'All quality rating parameters must be between 1 and 10.';
            modalAlert.className = 'auth-alert auth-alert-error';
            modalAlert.classList.remove('hidden');
        }
        return;
    }

    if (isNaN(damage) || damage < 0 || damage > 100) {
        if (modalAlert) {
            modalAlert.textContent = 'Damage percentage must be between 0.00% and 100.00%.';
            modalAlert.className = 'auth-alert auth-alert-error';
            modalAlert.classList.remove('hidden');
        }
        return;
    }

    setButtonLoading('save-assessment-btn', 'save-assess-spinner', 'save-assess-text', true, 'Saving...');

    try {
        let url = ADMIN_QUALITY_ENDPOINT;
        let method = 'POST';
        let payload = {
            harvestId,
            freshness,
            appearance,
            size,
            color,
            ripeness,
            damagePercentage: damage,
            inspectorNotes: notes || null
        };

        if (existingId) {
            url = `${ADMIN_QUALITY_ENDPOINT}/${existingId}`;
            method = 'PUT';
            payload = {
                freshness,
                appearance,
                size,
                color,
                ripeness,
                damagePercentage: damage,
                inspectorNotes: notes || null
            };
        }

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
            closeAdminAssessModal();
            showAdminQualityAlert(existingId ? `Quality assessment updated successfully!` : `Quality assessment recorded successfully!`, 'success');
            await loadAdminQualityMetrics();
            await loadAdminQualityQueue();
        } else if (response.status === 409) {
            if (modalAlert) {
                modalAlert.textContent = data?.message || 'Conflict: Assessment already exists for this harvest.';
                modalAlert.className = 'auth-alert auth-alert-error';
                modalAlert.classList.remove('hidden');
            }
        } else {
            if (modalAlert) {
                modalAlert.textContent = data?.message || `Failed to save assessment (HTTP ${response.status}).`;
                modalAlert.className = 'auth-alert auth-alert-error';
                modalAlert.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (modalAlert) {
            modalAlert.textContent = 'Network error: Failed to save quality assessment.';
            modalAlert.className = 'auth-alert auth-alert-error';
            modalAlert.classList.remove('hidden');
        }
    } finally {
        setButtonLoading('save-assessment-btn', 'save-assess-spinner', 'save-assess-text', false, existingId ? 'Update & Re-Submit Assessment' : 'Save Official Assessment');
    }
}

async function handleAdminVerifyQuality(assessmentId) {
    const token = getAuthToken();
    if (!token) return;

    if (!confirm(`Are you sure you want to certify and VERIFY Quality Assessment #${assessmentId}?`)) {
        return;
    }

    try {
        const response = await fetch(`${ADMIN_QUALITY_ENDPOINT}/${assessmentId}/verify`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            showAdminQualityAlert(`Quality Assessment #${assessmentId} is now officially VERIFIED.`, 'success');
            await loadAdminQualityMetrics();
            await loadAdminQualityQueue();
        } else {
            alert(`Failed to verify assessment #${assessmentId}.`);
        }
    } catch (err) {
        console.error('Verify failed:', err);
    }
}
window.handleAdminVerifyQuality = handleAdminVerifyQuality;

async function handleAdminRejectQuality(assessmentId) {
    const token = getAuthToken();
    if (!token) return;

    const remarks = prompt('Please enter the administrative reason for REJECTION (optional):');
    if (remarks === null) return;

    try {
        const response = await fetch(`${ADMIN_QUALITY_ENDPOINT}/${assessmentId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ notes: remarks })
        });

        if (response.ok) {
            showAdminQualityAlert(`Quality Assessment #${assessmentId} has been REJECTED.`, 'error');
            await loadAdminQualityMetrics();
            await loadAdminQualityQueue();
        } else {
            alert(`Failed to reject assessment #${assessmentId}.`);
        }
    } catch (err) {
        console.error('Reject failed:', err);
    }
}
window.handleAdminRejectQuality = handleAdminRejectQuality;

function showAdminQualityAlert(message, type) {
    const el = document.getElementById('admin-quality-alert');
    if (!el) return;
    el.textContent = message;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.add('hidden');
    }, 5000);
}

// ===================================================================
// Phase 6: Commercial Buyer Requirements Dashboard
// ===================================================================

const BUYER_REQUIREMENTS_ENDPOINT = `${API_BASE_URL}/api/buyer/requirements`;

let buyerRequirements = [];
let buyerReqFilter = 'ALL';
let buyerCropsCatalog = [];
let buyerDashboardInitialized = false;

async function initBuyerDashboard() {
    await loadBuyerCropsCatalog();
    setupBuyerEventListeners();
    await loadBuyerMetrics();
    await loadBuyerRequirements();
    await loadBuyerOrders();
    await loadBuyerDeliveries();
    await loadBuyerPayments();
    await loadBuyerPriceHistory();
}

async function loadBuyerCropsCatalog() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(CROPS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            buyerCropsCatalog = result.data || [];
            populateBuyerCropSelects();
        }
    } catch (err) {
        console.error('Failed to load crops catalog for buyer:', err);
    }
}

function populateBuyerCropSelects() {
    const createSelect = document.getElementById('req-crop-select');
    const editSelect = document.getElementById('edit-req-crop');

    if (createSelect) {
        createSelect.innerHTML = '<option value="">-- Choose Crop from Catalog --</option>';
        buyerCropsCatalog.forEach(crop => {
            const opt = document.createElement('option');
            opt.value = crop.cropId;
            opt.textContent = `${crop.cropName} (${crop.category})`;
            createSelect.appendChild(opt);
        });
    }

    if (editSelect) {
        editSelect.innerHTML = '';
        buyerCropsCatalog.forEach(crop => {
            const opt = document.createElement('option');
            opt.value = crop.cropId;
            opt.textContent = `${crop.cropName} (${crop.category})`;
            editSelect.appendChild(opt);
        });
    }

    // Default required by date to 14 days in the future
    const dateInput = document.getElementById('req-required-by');
    if (dateInput && !dateInput.value) {
        const target = new Date();
        target.setDate(target.getDate() + 14);
        dateInput.value = target.toISOString().split('T')[0];
        dateInput.min = new Date().toISOString().split('T')[0];
    }
}

function setupBuyerEventListeners() {
    if (buyerDashboardInitialized) return;
    buyerDashboardInitialized = true;

    // Create form submission
    const createForm = document.getElementById('create-requirement-form');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateRequirement);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-buyer-req-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadBuyerMetrics();
            await loadBuyerRequirements();
            showBuyerReqAlert('Buyer requirements refreshed.', 'success');
        });
    }

    // Filter tabs
    const tabs = document.querySelectorAll('.buyer-filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            buyerReqFilter = tab.getAttribute('data-filter');
            renderBuyerRequirementsTable();
        });
    });

    // Edit form submission
    const editForm = document.getElementById('edit-requirement-form');
    if (editForm) {
        editForm.addEventListener('submit', handleSaveEditRequirement);
    }

    // Edit Modal close buttons
    const closeEditBtn = document.getElementById('close-edit-req-modal-btn');
    if (closeEditBtn) closeEditBtn.addEventListener('click', closeEditRequirementModal);

    const cancelEditBtn = document.getElementById('cancel-edit-req-btn');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditRequirementModal);

    // View Modal close buttons
    const closeViewBtn = document.getElementById('close-view-req-modal-btn');
    if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewRequirementModal);

    const closeViewFooterBtn = document.getElementById('close-view-req-btn');
    if (closeViewFooterBtn) closeViewFooterBtn.addEventListener('click', closeViewRequirementModal);
}

async function loadBuyerMetrics() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(`${BUYER_REQUIREMENTS_ENDPOINT}/metrics`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const metrics = result.data;
            if (metrics) {
                document.getElementById('stat-buyer-total').textContent = metrics.totalRequirements || 0;
                document.getElementById('stat-buyer-open').textContent = metrics.openRequirements || 0;
                document.getElementById('stat-buyer-fulfilled').textContent = metrics.fulfilledRequirements || 0;
                document.getElementById('stat-buyer-expired').textContent = metrics.expiredRequirements || 0;
                document.getElementById('stat-buyer-cancelled').textContent = metrics.cancelledRequirements || 0;
            }
        }
    } catch (err) {
        console.error('Failed to load buyer metrics:', err);
    }
}

async function loadBuyerRequirements() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(BUYER_REQUIREMENTS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            buyerRequirements = result.data || [];
            updateBuyerFilterCounts();
            renderBuyerRequirementsTable();
        }
    } catch (err) {
        console.error('Failed to load buyer requirements:', err);
    }
}

function updateBuyerFilterCounts() {
    const all = buyerRequirements.length;
    const open = buyerRequirements.filter(r => r.status === 'OPEN').length;
    const fulfilled = buyerRequirements.filter(r => r.status === 'FULFILLED').length;
    const expired = buyerRequirements.filter(r => r.status === 'EXPIRED').length;
    const cancelled = buyerRequirements.filter(r => r.status === 'CANCELLED').length;

    const elAll = document.getElementById('buyer-filter-all');
    if (elAll) elAll.textContent = all;

    const elOpen = document.getElementById('buyer-filter-open');
    if (elOpen) elOpen.textContent = open;

    const elFul = document.getElementById('buyer-filter-fulfilled');
    if (elFul) elFul.textContent = fulfilled;

    const elExp = document.getElementById('buyer-filter-expired');
    if (elExp) elExp.textContent = expired;

    const elCanc = document.getElementById('buyer-filter-cancelled');
    if (elCanc) elCanc.textContent = cancelled;
}

function renderBuyerRequirementsTable() {
    const tbody = document.getElementById('buyer-requirements-tbody');
    if (!tbody) return;

    let filtered = buyerRequirements;
    if (buyerReqFilter !== 'ALL') {
        filtered = buyerRequirements.filter(r => r.status === buyerReqFilter);
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-muted">
                    No buyer requirements found for filter "${buyerReqFilter}".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(req => {
        const gradeClass = req.minQualityGrade === 'A' ? 'grade-a' : (req.minQualityGrade === 'B' ? 'grade-b' : 'grade-c');
        const statusClass = `status-${(req.status || 'open').toLowerCase()}`;
        const canEdit = req.status === 'OPEN' || req.status === 'EXPIRED';
        const canCancel = req.status === 'OPEN';

        return `
            <tr>
                <td><strong>#REQ-${req.requirementId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${req.cropName || 'Crop #' + req.cropId}</div>
                    <small style="color: #64748b;">${req.cropCategory || 'CROP'}</small>
                </td>
                <td><strong>${parseFloat(req.requiredQuantity).toLocaleString()} kg</strong></td>
                <td>₹${parseFloat(req.maxPricePerKg).toFixed(2)}/kg</td>
                <td>
                    <span class="grade-badge ${gradeClass}">Grade ${req.minQualityGrade}</span>
                </td>
                <td>${req.preferredLocation || 'N/A'}</td>
                <td>${req.requiredByDate || 'N/A'}</td>
                <td>
                    <span class="status-pill ${statusClass}">${req.status}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="btn-action btn-match" ${req.status === 'OPEN' ? '' : 'disabled style="opacity:0.4; cursor:not-allowed;" title="Only OPEN requirements can be matched"'} onclick="openMatchingModal(${req.requirementId})">
                            🎯 View Matches
                        </button>
                        <button type="button" class="btn-action btn-assess" onclick="openViewRequirementModal(${req.requirementId})">
                            👁️ View
                        </button>
                        <button type="button" class="btn-action btn-edit" ${canEdit ? '' : 'disabled style="opacity:0.4; cursor:not-allowed;"'} onclick="openEditRequirementModal(${req.requirementId})">
                            ✏️ Edit
                        </button>
                        <button type="button" class="btn-action btn-reject" ${canCancel ? '' : 'disabled style="opacity:0.4; cursor:not-allowed;"'} onclick="handleCancelRequirement(${req.requirementId})">
                            🚫 Cancel
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleCreateRequirement(e) {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    clearBuyerReqErrors();

    const cropId = parseInt(document.getElementById('req-crop-select').value);
    const requiredQuantity = parseFloat(document.getElementById('req-quantity').value);
    const maxPricePerKg = parseFloat(document.getElementById('req-max-price').value);
    const minQualityGrade = document.getElementById('req-min-grade').value;
    const preferredLocation = document.getElementById('req-location').value.trim();
    const requiredByDate = document.getElementById('req-required-by').value;

    let hasError = false;
    if (!cropId) {
        document.getElementById('req-crop-error').textContent = 'Please choose a crop from the catalog.';
        hasError = true;
    }
    if (isNaN(requiredQuantity) || requiredQuantity <= 0) {
        document.getElementById('req-quantity-error').textContent = 'Quantity must be greater than 0 kg.';
        hasError = true;
    }
    if (isNaN(maxPricePerKg) || maxPricePerKg <= 0) {
        document.getElementById('req-max-price-error').textContent = 'Maximum price must be greater than 0.';
        hasError = true;
    }
    if (!preferredLocation) {
        document.getElementById('req-location-error').textContent = 'Preferred location is required.';
        hasError = true;
    }
    if (!requiredByDate) {
        document.getElementById('req-required-by-error').textContent = 'Required-by date is required.';
        hasError = true;
    }

    if (hasError) return;

    const payload = {
        cropId,
        requiredQuantity,
        maxPricePerKg,
        minQualityGrade,
        preferredLocation,
        requiredByDate
    };

    const submitBtn = document.getElementById('add-req-btn');
    setButtonLoading('add-req-btn', 'add-req-spinner', 'add-req-text', true, 'Posting...');

    try {
        const response = await fetch(BUYER_REQUIREMENTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.status === 201) {
            showBuyerReqAlert('Buyer crop requirement posted successfully!', 'success');
            document.getElementById('create-requirement-form').reset();
            populateBuyerCropSelects();
            await loadBuyerMetrics();
            await loadBuyerRequirements();
        } else {
            showBuyerReqAlert(data.message || 'Failed to create buyer requirement.', 'error');
        }
    } catch (err) {
        showBuyerReqAlert('Network error while creating buyer requirement.', 'error');
    } finally {
        setButtonLoading('add-req-btn', 'add-req-spinner', 'add-req-text', false, 'Post Requirement');
    }
}

function clearBuyerReqErrors() {
    const ids = ['req-crop-error', 'req-quantity-error', 'req-max-price-error', 'req-min-grade-error', 'req-location-error', 'req-required-by-error'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
}

function showBuyerReqAlert(msg, type) {
    const el = document.getElementById('buyer-req-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.add('hidden');
    }, 5000);
}

function openEditRequirementModal(reqId) {
    const req = buyerRequirements.find(r => r.requirementId === reqId);
    if (!req) return;

    document.getElementById('edit-req-id').value = req.requirementId;
    document.getElementById('edit-req-crop').value = req.cropId;
    document.getElementById('edit-req-quantity').value = req.requiredQuantity;
    document.getElementById('edit-req-price').value = req.maxPricePerKg;
    document.getElementById('edit-req-grade').value = req.minQualityGrade;
    document.getElementById('edit-req-location').value = req.preferredLocation || '';
    document.getElementById('edit-req-date').value = req.requiredByDate || '';
    document.getElementById('edit-req-date').min = new Date().toISOString().split('T')[0];

    const alertEl = document.getElementById('edit-req-alert');
    if (alertEl) alertEl.classList.add('hidden');

    document.getElementById('edit-requirement-modal').classList.remove('hidden');
}
window.openEditRequirementModal = openEditRequirementModal;

function closeEditRequirementModal() {
    const el = document.getElementById('edit-requirement-modal');
    if (el) el.classList.add('hidden');
}
window.closeEditRequirementModal = closeEditRequirementModal;

async function handleSaveEditRequirement(e) {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const reqId = document.getElementById('edit-req-id').value;
    const cropId = parseInt(document.getElementById('edit-req-crop').value);
    const requiredQuantity = parseFloat(document.getElementById('edit-req-quantity').value);
    const maxPricePerKg = parseFloat(document.getElementById('edit-req-price').value);
    const minQualityGrade = document.getElementById('edit-req-grade').value;
    const preferredLocation = document.getElementById('edit-req-location').value.trim();
    const requiredByDate = document.getElementById('edit-req-date').value;

    const payload = {
        cropId,
        requiredQuantity,
        maxPricePerKg,
        minQualityGrade,
        preferredLocation,
        requiredByDate
    };

    setButtonLoading('save-edit-req-btn', 'save-edit-req-spinner', 'save-edit-req-text', true, 'Saving...');

    try {
        const response = await fetch(`${BUYER_REQUIREMENTS_ENDPOINT}/${reqId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            closeEditRequirementModal();
            showBuyerReqAlert(`Requirement #REQ-${reqId} updated successfully.`, 'success');
            await loadBuyerMetrics();
            await loadBuyerRequirements();
        } else {
            const alertEl = document.getElementById('edit-req-alert');
            if (alertEl) {
                alertEl.textContent = data.message || 'Failed to update requirement.';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Error updating requirement:', err);
    } finally {
        setButtonLoading('save-edit-req-btn', 'save-edit-req-spinner', 'save-edit-req-text', false, 'Save Changes');
    }
}

async function openViewRequirementModal(reqId) {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(`${BUYER_REQUIREMENTS_ENDPOINT}/${reqId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const req = result.data;

            document.getElementById('view-req-id').textContent = `#REQ-${req.requirementId}`;
            const statusBadge = document.getElementById('view-req-status-badge');
            statusBadge.textContent = req.status;
            statusBadge.className = `status-pill status-${(req.status || 'open').toLowerCase()}`;

            const gradeBadge = document.getElementById('view-req-grade-badge');
            gradeBadge.textContent = `Grade ${req.minQualityGrade}`;
            gradeBadge.className = `grade-badge grade-${req.minQualityGrade.toLowerCase()}`;

            document.getElementById('view-req-crop').textContent = `${req.cropName} (${req.cropCategory || 'CROP'})`;
            document.getElementById('view-req-quantity').textContent = `${parseFloat(req.requiredQuantity).toLocaleString()} kg`;
            document.getElementById('view-req-price').textContent = `₹${parseFloat(req.maxPricePerKg).toFixed(2)} / kg`;
            document.getElementById('view-req-date').textContent = req.requiredByDate || 'N/A';
            document.getElementById('view-req-location').textContent = req.preferredLocation || 'N/A';
            document.getElementById('view-req-created').textContent = req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A';
            document.getElementById('view-req-updated').textContent = req.updatedAt ? new Date(req.updatedAt).toLocaleString() : 'N/A';

            document.getElementById('view-requirement-modal').classList.remove('hidden');
        }
    } catch (err) {
        console.error('Error fetching requirement details:', err);
    }
}
window.openViewRequirementModal = openViewRequirementModal;

function closeViewRequirementModal() {
    const el = document.getElementById('view-requirement-modal');
    if (el) el.classList.add('hidden');
}
window.closeViewRequirementModal = closeViewRequirementModal;

async function handleCancelRequirement(reqId) {
    const token = getAuthToken();
    if (!token) return;

    if (!confirm(`Are you sure you want to CANCEL purchase requirement #REQ-${reqId}?`)) {
        return;
    }

    try {
        const response = await fetch(`${BUYER_REQUIREMENTS_ENDPOINT}/${reqId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showBuyerReqAlert(`Requirement #REQ-${reqId} has been cancelled.`, 'success');
            await loadBuyerMetrics();
            await loadBuyerRequirements();
        } else {
            showBuyerReqAlert(data.message || 'Failed to cancel requirement.', 'error');
        }
    } catch (err) {
        console.error('Error cancelling requirement:', err);
    }
}
window.handleCancelRequirement = handleCancelRequirement;

// ===================================================================
// Phase 7: Quality-Aware Matching Engine Frontend Implementation
// ===================================================================

let currentMatchedHarvests = [];

async function openMatchingModal(requirementId) {
    const token = getAuthToken();
    if (!token) return;

    const modal = document.getElementById('matching-modal');
    const alertBox = document.getElementById('matching-alert');
    const loading = document.getElementById('matching-loading');
    const emptyState = document.getElementById('matching-empty-state');
    const resultsContainer = document.getElementById('matching-results-list');

    if (alertBox) alertBox.classList.add('hidden');
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (emptyState) emptyState.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    if (modal) modal.classList.remove('hidden');

    currentMatchedRequirementId = requirementId;

    // Populate placeholder while fetching
    document.getElementById('match-req-id').textContent = `#REQ-${requirementId}`;
    document.getElementById('match-req-crop').textContent = 'Loading requirement details...';
    document.getElementById('match-total-count-badge').textContent = 'Evaluating candidates...';

    try {
        const response = await fetch(`${BUYER_REQUIREMENTS_ENDPOINT}/${requirementId}/matches`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json();
        if (loading) loading.classList.add('hidden');

        if (response.ok && result.data) {
            renderMatchingResults(result.data);
        } else {
            if (alertBox) {
                alertBox.textContent = result.message || 'Failed to retrieve matching harvests.';
                alertBox.className = 'auth-alert error';
                alertBox.classList.remove('hidden');
            }
            if (emptyState) emptyState.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Error fetching matching results:', err);
        if (loading) loading.classList.add('hidden');
        if (alertBox) {
            alertBox.textContent = 'Network or server error while connecting to matching engine.';
            alertBox.className = 'auth-alert error';
            alertBox.classList.remove('hidden');
        }
    }
}
window.openMatchingModal = openMatchingModal;

function renderMatchingResults(data) {
    // Populate Requirement Target Banner
    document.getElementById('match-req-id').textContent = `#REQ-${data.requirementId}`;
    document.getElementById('match-req-crop').textContent = data.cropName || 'Crop #' + data.cropId;
    document.getElementById('match-req-qty').textContent = `${parseFloat(data.requiredQuantity).toLocaleString()} kg`;
    document.getElementById('match-req-price').textContent = `₹${parseFloat(data.maximumPricePerKg).toFixed(2)} / kg`;
    
    const gradeBadge = document.getElementById('match-req-grade');
    if (gradeBadge) {
        gradeBadge.textContent = `Grade ${data.minimumQualityGrade}`;
        gradeBadge.className = `grade-badge ${data.minimumQualityGrade === 'A' ? 'grade-a' : (data.minimumQualityGrade === 'B' ? 'grade-b' : 'grade-c')}`;
    }
    
    document.getElementById('match-req-location').textContent = data.preferredLocation || 'Any Location';
    document.getElementById('match-req-date').textContent = data.requiredByDate || 'N/A';

    const countBadge = document.getElementById('match-total-count-badge');
    if (countBadge) {
        countBadge.textContent = `${data.totalMatches} Eligible Harvest${data.totalMatches === 1 ? '' : 's'}`;
    }

    currentMatchedHarvests = data.matches || [];
    const resultsContainer = document.getElementById('matching-results-list');
    const emptyState = document.getElementById('matching-empty-state');

    if (!data.matches || data.matches.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (resultsContainer) resultsContainer.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    resultsContainer.innerHTML = data.matches.map((m, index) => {
        const gradeClass = m.qualityGrade === 'A' ? 'grade-a' : (m.qualityGrade === 'B' ? 'grade-b' : 'grade-c');
        const locBadgeClass = m.locationMatch ? 'matched' : 'different';
        const locBadgeText = m.locationMatch ? '✓ Location Match' : 'Different Location';

        return `
            <div class="matched-harvest-card">
                <div class="matched-card-header">
                    <div class="matched-farmer-info">
                        <div class="matched-farmer-avatar">🧑‍🌾</div>
                        <div class="matched-farmer-meta">
                            <strong>${m.farmerName || 'Farmer #' + m.farmerId}</strong>
                            <span>📍 ${m.location || 'N/A'} <span class="location-tag ${locBadgeClass}">${locBadgeText}</span></span>
                        </div>
                    </div>
                    <div class="match-score-pill">
                        <span class="score-val">${parseFloat(m.matchScore).toFixed(2)}</span>
                        <span class="score-sub">Match Score / 100</span>
                    </div>
                </div>

                <div class="matched-card-metrics">
                    <div class="metric-item">
                        <span>Available Quantity</span>
                        <strong>${parseFloat(m.availableQuantity).toLocaleString()} kg</strong>
                    </div>
                    <div class="metric-item">
                        <span>Farmer Price</span>
                        <strong>₹${parseFloat(m.pricePerKg).toFixed(2)} / kg</strong>
                    </div>
                    <div class="metric-item">
                        <span>Quality Grade</span>
                        <div><span class="grade-badge ${gradeClass}">Grade ${m.qualityGrade}</span></div>
                    </div>
                    <div class="metric-item">
                        <span>Verified Quality Score</span>
                        <strong>${parseFloat(m.qualityScore).toFixed(1)} / 100</strong>
                    </div>
                </div>

                <!-- Transparent Score Breakdown -->
                <div class="score-breakdown-grid">
                    <div class="breakdown-box">
                        <span class="breakdown-label">💰 Price Match</span>
                        <span class="breakdown-value">${parseFloat(m.priceScore).toFixed(1)} <small>/ 30</small></span>
                    </div>
                    <div class="breakdown-box">
                        <span class="breakdown-label">🌿 Quality Score</span>
                        <span class="breakdown-value">${parseFloat(m.qualityScoreComponent).toFixed(1)} <small>/ 30</small></span>
                    </div>
                    <div class="breakdown-box">
                        <span class="breakdown-label">📍 Location Match</span>
                        <span class="breakdown-value">${parseFloat(m.locationScore).toFixed(1)} <small>/ 20</small></span>
                    </div>
                    <div class="breakdown-box">
                        <span class="breakdown-label">📦 Quantity Coverage</span>
                        <span class="breakdown-value">${parseFloat(m.quantityScore).toFixed(1)} <small>/ 20</small></span>
                    </div>
                </div>

                <div class="matched-card-footer">
                    <small style="color: #64748b;">Harvest Lot #${m.harvestId} &bull; Harvest Date: ${m.harvestDate || 'N/A'}</small>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="openMatchQualityModal(${m.harvestId})">
                            🔬 View Quality Inspection
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="openPlaceOrderModal(${m.harvestId})">
                            🛒 Place Order
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function closeMatchingModal() {
    const modal = document.getElementById('matching-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeMatchingModal = closeMatchingModal;

function openMatchQualityModal(harvestId) {
    const match = currentMatchedHarvests.find(m => m.harvestId === harvestId);
    if (!match) return;

    document.getElementById('mq-harvest-title').textContent = `Harvest #${match.harvestId} (${match.cropName || 'Crop'})`;
    document.getElementById('mq-farmer-name').textContent = `Farmer: ${match.farmerName || 'Farmer #' + match.farmerId}`;
    document.getElementById('mq-quality-score').textContent = parseFloat(match.qualityScore).toFixed(2);
    
    const gradeBadge = document.getElementById('mq-grade-badge');
    if (gradeBadge) {
        gradeBadge.textContent = `Grade ${match.qualityGrade}`;
        gradeBadge.className = `grade-badge ${match.qualityGrade === 'A' ? 'grade-a' : (match.qualityGrade === 'B' ? 'grade-b' : 'grade-c')}`;
    }

    document.getElementById('mq-freshness').textContent = `${match.freshness ?? '--'} / 10`;
    document.getElementById('mq-appearance').textContent = `${match.appearance ?? '--'} / 10`;
    document.getElementById('mq-size').textContent = `${match.size ?? '--'} / 10`;
    document.getElementById('mq-color').textContent = `${match.color ?? '--'} / 10`;
    document.getElementById('mq-ripeness').textContent = `${match.ripeness ?? '--'} / 10`;
    document.getElementById('mq-damage').textContent = `${match.damagePercentage ? parseFloat(match.damagePercentage).toFixed(2) : '0.00'} %`;

    document.getElementById('mq-location').textContent = match.location || 'N/A';
    document.getElementById('mq-date').textContent = match.harvestDate || 'N/A';
    document.getElementById('mq-notes').textContent = 'Official certified lot. Meets all regulatory standards for market distribution.';

    const modal = document.getElementById('match-quality-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openMatchQualityModal = openMatchQualityModal;

function closeMatchQualityModal() {
    const modal = document.getElementById('match-quality-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeMatchQualityModal = closeMatchQualityModal;

// Bind Phase 7 Modal Close Buttons
document.addEventListener('DOMContentLoaded', () => {
    const closeMatchingBtn = document.getElementById('close-matching-btn');
    const closeMatchingModalBtn = document.getElementById('close-matching-modal-btn');
    if (closeMatchingBtn) closeMatchingBtn.addEventListener('click', closeMatchingModal);
    if (closeMatchingModalBtn) closeMatchingModalBtn.addEventListener('click', closeMatchingModal);

    const closeMatchQualityBtn = document.getElementById('close-match-quality-btn');
    const closeMatchQualityModalBtn = document.getElementById('close-match-quality-modal-btn');
    if (closeMatchQualityBtn) closeMatchQualityBtn.addEventListener('click', closeMatchQualityModal);
    if (closeMatchQualityModalBtn) closeMatchQualityModalBtn.addEventListener('click', closeMatchQualityModal);
});

// ===================================================================
// Phase 8: Order Management Module
// ===================================================================

function formatOrderDateTime(isoString) {
    if (!isoString) return 'N/A';
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
               d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return isoString;
    }
}

function getOrderStatusPill(status) {
    const s = (status || 'PENDING').toUpperCase();
    let badgeClass = 'status-pending';
    if (s === 'ACCEPTED') badgeClass = 'status-accepted';
    else if (s === 'CONFIRMED') badgeClass = 'status-confirmed';
    else if (s === 'SHIPPED') badgeClass = 'status-shipped';
    else if (s === 'DELIVERED') badgeClass = 'status-delivered';
    else if (s === 'REJECTED') badgeClass = 'status-rejected';
    else if (s === 'CANCELLED') badgeClass = 'status-cancelled';
    return `<span class="status-pill ${badgeClass}">${s}</span>`;
}

function getDeliveryStatusPill(status) {
    const s = (status || 'PENDING').toUpperCase();
    let badgeClass = 'status-pending';
    if (s === 'SHIPPED') badgeClass = 'status-shipped';
    else if (s === 'IN_TRANSIT') badgeClass = 'status-in_transit';
    else if (s === 'DELIVERED') badgeClass = 'status-delivered';
    else if (s === 'CANCELLED' || s === 'FAILED') badgeClass = 'status-cancelled';
    return `<span class="status-pill ${badgeClass}">${s}</span>`;
}

function getPaymentStatusPill(status) {
    const s = (status || 'PENDING').toUpperCase();
    let badgeClass = 'status-pending';
    if (s === 'COMPLETED' || s === 'PAID') badgeClass = 'status-completed';
    else if (s === 'PROCESSING') badgeClass = 'status-processing';
    else if (s === 'REFUNDED') badgeClass = 'status-refunded';
    else if (s === 'FAILED' || s === 'CANCELLED') badgeClass = 'status-failed';
    return `<span class="status-pill ${badgeClass}">${s}</span>`;
}

// -------------------------------------------------------------------
// 1. Buyer: Place Order Workflow
// -------------------------------------------------------------------

function openPlaceOrderModal(harvestId) {
    const match = currentMatchedHarvests.find(m => m.harvestId === harvestId);
    if (!match) {
        alert('Selected harvest details could not be found.');
        return;
    }

    activeOrderUnitPrice = parseFloat(match.pricePerKg) || 0;

    // Populate modal context
    document.getElementById('order-harvest-id').value = match.harvestId;
    document.getElementById('order-req-id').value = currentMatchedRequirementId || '';
    document.getElementById('order-crop-name').textContent = match.cropName || ('Crop #' + match.cropId);
    document.getElementById('order-farmer-name').textContent = match.farmerName || ('Farmer #' + match.farmerId);
    document.getElementById('order-available-qty').textContent = `${parseFloat(match.availableQuantity).toLocaleString()} kg`;
    document.getElementById('order-unit-price').textContent = `₹${activeOrderUnitPrice.toFixed(2)} / kg`;

    const gradeEl = document.getElementById('order-quality-grade');
    if (gradeEl) {
        gradeEl.textContent = `Grade ${match.qualityGrade}`;
        gradeEl.className = `grade-badge ${match.qualityGrade === 'A' ? 'grade-a' : (match.qualityGrade === 'B' ? 'grade-b' : 'grade-c')}`;
    }

    // Default quantity (min of 50 or availableQuantity)
    const qtyInput = document.getElementById('order-quantity-input');
    const defaultQty = Math.min(parseFloat(match.availableQuantity), 50);
    qtyInput.value = defaultQty;
    qtyInput.max = match.availableQuantity;
    qtyInput.min = 1;

    document.getElementById('order-remarks-input').value = '';
    const alertBox = document.getElementById('place-order-modal-alert');
    if (alertBox) alertBox.classList.add('hidden');
    const errorEl = document.getElementById('order-quantity-error');
    if (errorEl) errorEl.textContent = '';

    updateOrderLivePreview();

    const modal = document.getElementById('place-order-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openPlaceOrderModal = openPlaceOrderModal;

function updateOrderLivePreview() {
    const qtyInput = document.getElementById('order-quantity-input');
    const qty = parseFloat(qtyInput.value) || 0;
    const total = qty * activeOrderUnitPrice;

    const calcQty = document.getElementById('order-calc-qty');
    const calcRate = document.getElementById('order-calc-rate');
    const calcTotal = document.getElementById('order-calc-total');

    if (calcQty) calcQty.textContent = `${qty.toLocaleString()} kg`;
    if (calcRate) calcRate.textContent = `₹${activeOrderUnitPrice.toFixed(2)}`;
    if (calcTotal) calcTotal.textContent = `₹${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function closePlaceOrderModal() {
    const modal = document.getElementById('place-order-modal');
    if (modal) modal.classList.add('hidden');
}
window.closePlaceOrderModal = closePlaceOrderModal;

async function handlePlaceOrderSubmit(e) {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const harvestId = parseInt(document.getElementById('order-harvest-id').value, 10);
    const reqIdVal = document.getElementById('order-req-id').value;
    const requirementId = reqIdVal ? parseInt(reqIdVal, 10) : null;
    const quantity = parseFloat(document.getElementById('order-quantity-input').value);
    const remarks = document.getElementById('order-remarks-input').value.trim();

    const alertBox = document.getElementById('place-order-modal-alert');
    const errorEl = document.getElementById('order-quantity-error');
    if (errorEl) errorEl.textContent = '';
    if (alertBox) alertBox.classList.add('hidden');

    if (isNaN(quantity) || quantity <= 0) {
        if (errorEl) errorEl.textContent = 'Please enter a valid positive quantity.';
        return;
    }

    const payload = {
        harvestId: harvestId,
        requirementId: requirementId,
        quantity: quantity,
        agreedPricePerKg: activeOrderUnitPrice,
        remarks: remarks || null
    };

    setButtonLoading('order-submit-btn', 'order-submit-spinner', 'order-submit-btn-text', true, 'Placing Order...');

    try {
        const response = await fetch(BUYER_ORDERS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => null);

        if (response.status === 201 && result && result.data) {
            closePlaceOrderModal();
            closeMatchingModal();
            await loadBuyerOrders();
            await loadBuyerRequirements();
            showBuyerOrderAlert(`Order #ORD-${result.data.orderId} successfully placed for ${parseFloat(result.data.quantity).toLocaleString()} kg! Reserved harvest stock.`, 'success');
        } else {
            if (alertBox) {
                alertBox.textContent = result?.message || `Failed to place order (HTTP ${response.status})`;
                alertBox.className = 'auth-alert error';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Error placing order:', err);
        if (alertBox) {
            alertBox.textContent = 'Network or server communication error.';
            alertBox.className = 'auth-alert error';
            alertBox.classList.remove('hidden');
        }
    } finally {
        setButtonLoading('order-submit-btn', 'order-submit-spinner', 'order-submit-btn-text', false, 'Confirm & Place Order');
    }
}

function showBuyerOrderAlert(message, type = 'success') {
    const el = document.getElementById('buyer-orders-alert');
    if (!el) return;
    el.textContent = message;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.add('hidden');
    }, 6000);
}

// -------------------------------------------------------------------
// 2. Buyer: Order History & Tracking
// -------------------------------------------------------------------

async function loadBuyerOrders() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(BUYER_ORDERS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            buyerOrders = result.data || [];
            updateBuyerOrderCounts();
            renderBuyerOrdersTable();
        }
    } catch (err) {
        console.error('Failed to load buyer purchase orders:', err);
    }
}

function updateBuyerOrderCounts() {
    const all = buyerOrders.length;
    const pending = buyerOrders.filter(o => o.orderStatus === 'PENDING').length;
    const accepted = buyerOrders.filter(o => o.orderStatus === 'ACCEPTED').length;
    const confirmed = buyerOrders.filter(o => o.orderStatus === 'CONFIRMED').length;
    const shipped = buyerOrders.filter(o => o.orderStatus === 'SHIPPED').length;
    const delivered = buyerOrders.filter(o => o.orderStatus === 'DELIVERED').length;
    const rejected = buyerOrders.filter(o => o.orderStatus === 'REJECTED').length;
    const cancelled = buyerOrders.filter(o => o.orderStatus === 'CANCELLED').length;

    const elAll = document.getElementById('buyer-order-count-all');
    const elPending = document.getElementById('buyer-order-count-pending');
    const elAccepted = document.getElementById('buyer-order-count-accepted');
    const elConfirmed = document.getElementById('buyer-order-count-confirmed');
    const elShipped = document.getElementById('buyer-order-count-shipped');
    const elDelivered = document.getElementById('buyer-order-count-delivered');
    const elRejected = document.getElementById('buyer-order-count-rejected');
    const elCancelled = document.getElementById('buyer-order-count-cancelled');

    if (elAll) elAll.textContent = all;
    if (elPending) elPending.textContent = pending;
    if (elAccepted) elAccepted.textContent = accepted;
    if (elConfirmed) elConfirmed.textContent = confirmed;
    if (elShipped) elShipped.textContent = shipped;
    if (elDelivered) elDelivered.textContent = delivered;
    if (elRejected) elRejected.textContent = rejected;
    if (elCancelled) elCancelled.textContent = cancelled;
}

function renderBuyerOrdersTable() {
    const tbody = document.getElementById('buyer-orders-tbody');
    if (!tbody) return;

    let filtered = buyerOrders;
    if (activeBuyerOrderFilter !== 'ALL') {
        filtered = buyerOrders.filter(o => o.orderStatus === activeBuyerOrderFilter);
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-muted">
                    No purchase orders found with status "${activeBuyerOrderFilter}".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        const canCancel = order.orderStatus === 'PENDING';
        return `
            <tr>
                <td><strong>#ORD-${order.orderId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(order.cropName || 'Crop')}</div>
                    <small style="color: #64748b;">Harvest Lot #${order.harvestId}</small>
                </td>
                <td>
                    <div><strong>${escapeHtml(order.farmerName || 'Farmer')}</strong></div>
                    <small style="color: #64748b;">📍 ${escapeHtml(order.farmLocation || 'N/A')}</small>
                </td>
                <td><strong>${parseFloat(order.quantity).toLocaleString()} kg</strong></td>
                <td>₹${parseFloat(order.agreedPricePerKg).toFixed(2)}/kg</td>
                <td><strong>₹${parseFloat(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><small>${formatOrderDateTime(order.orderDate)}</small></td>
                <td>${getOrderStatusPill(order.orderStatus)}</td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="btn-action btn-assess" onclick="openOrderDetailsModal(${order.orderId}, 'BUYER')">
                            👁️ Details
                        </button>
                        ${['ACCEPTED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus) ? `
                            <button type="button" class="btn-action btn-pay" onclick="openMakePaymentModal(${order.orderId}, ${order.totalAmount}, '${escapeHtml(order.cropName || 'Crop')}')">
                                💳 Pay
                            </button>
                        ` : ''}
                        ${order.orderStatus === 'ACCEPTED' ? `
                            <button type="button" class="btn-action" style="background:#0284c7; color:#fff;" onclick="openCreateDeliveryModal(${order.orderId}, '${escapeHtml(order.cropName || 'Crop')}', ${order.quantity})">
                                🚚 Delivery
                            </button>
                        ` : ''}
                        ${canCancel ? `
                            <button type="button" class="btn-action btn-cancel-order" onclick="openCancelOrderModal(${order.orderId})">
                                🚫 Cancel
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openCancelOrderModal(orderId) {
    document.getElementById('cancel-target-order-id').value = orderId;
    document.getElementById('cancel-order-id-label').textContent = `#ORD-${orderId}`;
    document.getElementById('cancel-reason-input').value = '';
    const alertBox = document.getElementById('cancel-order-modal-alert');
    if (alertBox) alertBox.classList.add('hidden');

    const modal = document.getElementById('cancel-order-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openCancelOrderModal = openCancelOrderModal;

function closeCancelOrderModal() {
    const modal = document.getElementById('cancel-order-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeCancelOrderModal = closeCancelOrderModal;

async function handleCancelOrderSubmit(e) {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const orderId = document.getElementById('cancel-target-order-id').value;
    const reason = document.getElementById('cancel-reason-input').value.trim();
    const alertBox = document.getElementById('cancel-order-modal-alert');

    setButtonLoading('confirm-cancel-order-btn', 'cancel-order-spinner', 'cancel-order-btn-text', true, 'Cancelling...');

    try {
        const response = await fetch(`${BUYER_ORDERS_ENDPOINT}/${orderId}/cancel`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ reason: reason || null })
        });

        const result = await response.json().catch(() => null);

        if (response.ok) {
            closeCancelOrderModal();
            await loadBuyerOrders();
            await loadBuyerRequirements();
            showBuyerOrderAlert(`Order #ORD-${orderId} was cancelled. Reserved harvest stock restored to farmer inventory.`, 'success');
        } else {
            if (alertBox) {
                alertBox.textContent = result?.message || `Failed to cancel order (HTTP ${response.status})`;
                alertBox.className = 'auth-alert error';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Error cancelling order:', err);
        if (alertBox) {
            alertBox.textContent = 'Network error while attempting cancellation.';
            alertBox.className = 'auth-alert error';
            alertBox.classList.remove('hidden');
        }
    } finally {
        setButtonLoading('confirm-cancel-order-btn', 'cancel-order-spinner', 'cancel-order-btn-text', false, 'Confirm Order Cancellation');
    }
}

// -------------------------------------------------------------------
// 3. Farmer: Incoming Orders & Decisions
// -------------------------------------------------------------------

async function loadFarmerOrders() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(FARMER_ORDERS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            farmerOrders = result.data || [];
            updateFarmerOrderCounts();
            renderFarmerOrdersTable();
        }
    } catch (err) {
        console.error('Failed to load farmer incoming orders:', err);
    }
}

function updateFarmerOrderCounts() {
    const all = farmerOrders.length;
    const pending = farmerOrders.filter(o => o.orderStatus === 'PENDING').length;
    const accepted = farmerOrders.filter(o => o.orderStatus === 'ACCEPTED').length;
    const confirmed = farmerOrders.filter(o => o.orderStatus === 'CONFIRMED').length;
    const shipped = farmerOrders.filter(o => o.orderStatus === 'SHIPPED').length;
    const delivered = farmerOrders.filter(o => o.orderStatus === 'DELIVERED').length;
    const rejected = farmerOrders.filter(o => o.orderStatus === 'REJECTED').length;
    const cancelled = farmerOrders.filter(o => o.orderStatus === 'CANCELLED').length;

    const elAll = document.getElementById('farmer-order-count-all');
    const elPending = document.getElementById('farmer-order-count-pending');
    const elAccepted = document.getElementById('farmer-order-count-accepted');
    const elConfirmed = document.getElementById('farmer-order-count-confirmed');
    const elShipped = document.getElementById('farmer-order-count-shipped');
    const elDelivered = document.getElementById('farmer-order-count-delivered');
    const elRejected = document.getElementById('farmer-order-count-rejected');
    const elCancelled = document.getElementById('farmer-order-count-cancelled');

    if (elAll) elAll.textContent = all;
    if (elPending) elPending.textContent = pending;
    if (elAccepted) elAccepted.textContent = accepted;
    if (elConfirmed) elConfirmed.textContent = confirmed;
    if (elShipped) elShipped.textContent = shipped;
    if (elDelivered) elDelivered.textContent = delivered;
    if (elRejected) elRejected.textContent = rejected;
    if (elCancelled) elCancelled.textContent = cancelled;
}

function renderFarmerOrdersTable() {
    const tbody = document.getElementById('farmer-orders-tbody');
    if (!tbody) return;

    let filtered = farmerOrders;
    if (activeFarmerOrderFilter !== 'ALL') {
        filtered = farmerOrders.filter(o => o.orderStatus === activeFarmerOrderFilter);
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-4 text-muted">
                    No orders found with status "${activeFarmerOrderFilter}".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        const isPending = order.orderStatus === 'PENDING';
        return `
            <tr>
                <td><strong>#ORD-${order.orderId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(order.cropName || 'Crop')}</div>
                    <small style="color: #64748b;">Harvest Lot #${order.harvestId}</small>
                </td>
                <td>
                    <div><strong>${escapeHtml(order.buyerName || 'Buyer')}</strong></div>
                    <small style="color: #64748b;">${escapeHtml(order.buyerPhone || '')}</small>
                </td>
                <td><strong>${parseFloat(order.quantity).toLocaleString()} kg</strong></td>
                <td>₹${parseFloat(order.agreedPricePerKg).toFixed(2)}/kg</td>
                <td><strong>₹${parseFloat(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><small>${formatOrderDateTime(order.orderDate)}</small></td>
                <td>${getOrderStatusPill(order.orderStatus)}</td>
                <td>
                    <div class="table-actions">
                        ${isPending ? `
                            <button type="button" class="btn-action btn-accept" onclick="handleAcceptFarmerOrder(${order.orderId})">
                                ✅ Accept
                            </button>
                            <button type="button" class="btn-action btn-reject" onclick="openRejectOrderModal(${order.orderId})">
                                ❌ Reject
                            </button>
                        ` : ''}
                        ${order.orderStatus === 'ACCEPTED' ? `
                            <button type="button" class="btn-action" style="background:#0284c7; color:#fff;" onclick="openCreateDeliveryModal(${order.orderId}, '${escapeHtml(order.cropName || 'Crop')}', ${order.quantity})">
                                🚚 Delivery
                            </button>
                        ` : ''}
                        <button type="button" class="btn-action btn-assess" onclick="openOrderDetailsModal(${order.orderId}, 'FARMER')">
                            👁️ Details
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleAcceptFarmerOrder(orderId) {
    const token = getAuthToken();
    if (!token) return;

    if (!confirm(`Are you sure you want to accept order #ORD-${orderId}? This confirms the commercial transaction.`)) {
        return;
    }

    try {
        const response = await fetch(`${FARMER_ORDERS_ENDPOINT}/${orderId}/accept`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const result = await response.json().catch(() => null);

        if (response.ok) {
            await loadFarmerOrders();
            await loadFarmerHarvests();
            showFarmerOrderAlert(`Order #ORD-${orderId} successfully ACCEPTED! Sale confirmed.`, 'success');
        } else {
            showFarmerOrderAlert(result?.message || `Failed to accept order (HTTP ${response.status})`, 'error');
        }
    } catch (err) {
        console.error('Error accepting order:', err);
        showFarmerOrderAlert('Network error while processing order acceptance.', 'error');
    }
}
window.handleAcceptFarmerOrder = handleAcceptFarmerOrder;

function openRejectOrderModal(orderId) {
    document.getElementById('reject-target-order-id').value = orderId;
    document.getElementById('reject-order-id-label').textContent = `#ORD-${orderId}`;
    document.getElementById('reject-reason-input').value = '';
    const alertBox = document.getElementById('reject-order-modal-alert');
    if (alertBox) alertBox.classList.add('hidden');

    const modal = document.getElementById('reject-order-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openRejectOrderModal = openRejectOrderModal;

function closeRejectOrderModal() {
    const modal = document.getElementById('reject-order-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeRejectOrderModal = closeRejectOrderModal;

async function handleRejectOrderSubmit(e) {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const orderId = document.getElementById('reject-target-order-id').value;
    const reason = document.getElementById('reject-reason-input').value.trim();
    const alertBox = document.getElementById('reject-order-modal-alert');

    setButtonLoading('confirm-reject-order-btn', 'reject-order-spinner', 'reject-order-btn-text', true, 'Rejecting...');

    try {
        const response = await fetch(`${FARMER_ORDERS_ENDPOINT}/${orderId}/reject`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ reason: reason || null })
        });

        const result = await response.json().catch(() => null);

        if (response.ok) {
            closeRejectOrderModal();
            await loadFarmerOrders();
            await loadFarmerHarvests();
            showFarmerOrderAlert(`Order #ORD-${orderId} was rejected. Reserved harvest stock was restored.`, 'success');
        } else {
            if (alertBox) {
                alertBox.textContent = result?.message || `Failed to reject order (HTTP ${response.status})`;
                alertBox.className = 'auth-alert error';
                alertBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Error rejecting order:', err);
        if (alertBox) {
            alertBox.textContent = 'Network error while attempting rejection.';
            alertBox.className = 'auth-alert error';
            alertBox.classList.remove('hidden');
        }
    } finally {
        setButtonLoading('confirm-reject-order-btn', 'reject-order-spinner', 'reject-order-btn-text', false, 'Confirm Order Rejection');
    }
}

function showFarmerOrderAlert(message, type = 'success') {
    const el = document.getElementById('farmer-orders-alert');
    if (!el) return;
    el.textContent = message;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => {
        el.classList.add('hidden');
    }, 6000);
}

// -------------------------------------------------------------------
// 4. Admin: Order Monitoring & Global Visibility
// -------------------------------------------------------------------

async function loadAdminOrders() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(ADMIN_ORDERS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            adminOrders = result.data || [];
            updateAdminOrderCounts();
            renderAdminOrdersTable();
        }
    } catch (err) {
        console.error('Failed to load admin marketplace orders:', err);
    }
}

function updateAdminOrderCounts() {
    const all = adminOrders.length;
    const pending = adminOrders.filter(o => o.orderStatus === 'PENDING').length;
    const accepted = adminOrders.filter(o => o.orderStatus === 'ACCEPTED').length;
    const confirmed = adminOrders.filter(o => o.orderStatus === 'CONFIRMED').length;
    const shipped = adminOrders.filter(o => o.orderStatus === 'SHIPPED').length;
    const delivered = adminOrders.filter(o => o.orderStatus === 'DELIVERED').length;
    const rejected = adminOrders.filter(o => o.orderStatus === 'REJECTED').length;
    const cancelled = adminOrders.filter(o => o.orderStatus === 'CANCELLED').length;

    const elAll = document.getElementById('admin-order-count-all');
    const elPending = document.getElementById('admin-order-count-pending');
    const elAccepted = document.getElementById('admin-order-count-accepted');
    const elConfirmed = document.getElementById('admin-order-count-confirmed');
    const elShipped = document.getElementById('admin-order-count-shipped');
    const elDelivered = document.getElementById('admin-order-count-delivered');
    const elRejected = document.getElementById('admin-order-count-rejected');
    const elCancelled = document.getElementById('admin-order-count-cancelled');

    if (elAll) elAll.textContent = all;
    if (elPending) elPending.textContent = pending;
    if (elAccepted) elAccepted.textContent = accepted;
    if (elConfirmed) elConfirmed.textContent = confirmed;
    if (elShipped) elShipped.textContent = shipped;
    if (elDelivered) elDelivered.textContent = delivered;
    if (elRejected) elRejected.textContent = rejected;
    if (elCancelled) elCancelled.textContent = cancelled;
}

function renderAdminOrdersTable() {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    let filtered = adminOrders;
    if (activeAdminOrderFilter !== 'ALL') {
        filtered = adminOrders.filter(o => o.orderStatus === activeAdminOrderFilter);
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-muted">
                    No marketplace orders found with status "${activeAdminOrderFilter}".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        return `
            <tr>
                <td><strong>#ORD-${order.orderId}</strong></td>
                <td>
                    <div><strong>${escapeHtml(order.buyerName || 'Buyer')}</strong></div>
                    <small style="color: #64748b;">${escapeHtml(order.buyerPhone || '')}</small>
                </td>
                <td>
                    <div><strong>${escapeHtml(order.farmerName || 'Farmer')}</strong></div>
                    <small style="color: #64748b;">📍 ${escapeHtml(order.farmLocation || 'N/A')}</small>
                </td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(order.cropName || 'Crop')}</div>
                    <small style="color: #64748b;">Lot #${order.harvestId}</small>
                </td>
                <td><strong>${parseFloat(order.quantity).toLocaleString()} kg</strong></td>
                <td>₹${parseFloat(order.agreedPricePerKg).toFixed(2)}/kg</td>
                <td><strong>₹${parseFloat(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><small>${formatOrderDateTime(order.orderDate)}</small></td>
                <td>${getOrderStatusPill(order.orderStatus)}</td>
                <td>
                    <button type="button" class="btn-action btn-assess" onclick="openOrderDetailsModal(${order.orderId}, 'ADMIN')">
                        👁️ Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// -------------------------------------------------------------------
// 5. Shared: Order Details Modal
// -------------------------------------------------------------------

async function openOrderDetailsModal(orderId, role = 'BUYER') {
    const token = getAuthToken();
    if (!token) return;

    let endpoint = `${BUYER_ORDERS_ENDPOINT}/${orderId}`;
    if (role === 'FARMER') endpoint = `${FARMER_ORDERS_ENDPOINT}/${orderId}`;
    else if (role === 'ADMIN') endpoint = `${ADMIN_ORDERS_ENDPOINT}/${orderId}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const order = result.data;
            if (!order) return;

            document.getElementById('detail-order-id').textContent = `#ORD-${order.orderId}`;
            document.getElementById('detail-order-status').innerHTML = getOrderStatusPill(order.orderStatus);
            document.getElementById('detail-order-date').textContent = formatOrderDateTime(order.orderDate);
            document.getElementById('detail-order-crop').textContent = `${order.cropName} (Lot #${order.harvestId})`;
            document.getElementById('detail-order-buyer').textContent = `${order.buyerName || 'Buyer'} (${order.buyerPhone || 'N/A'})`;
            document.getElementById('detail-order-farmer').textContent = `${order.farmerName || 'Farmer'} (${order.farmerPhone || 'N/A'})`;
            document.getElementById('detail-order-quantity').textContent = `${parseFloat(order.quantity).toLocaleString()} kg`;
            document.getElementById('detail-order-price').textContent = `₹${parseFloat(order.agreedPricePerKg).toFixed(2)} / kg`;
            document.getElementById('detail-order-total').textContent = `₹${parseFloat(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            document.getElementById('detail-order-location').textContent = order.farmLocation || 'N/A';
            document.getElementById('detail-order-remarks').textContent = order.remarks || 'None provided';

            const cancelRow = document.getElementById('detail-cancellation-row');
            const cancelText = document.getElementById('detail-order-cancel-reason');
            if (order.cancellationReason) {
                if (cancelText) cancelText.textContent = order.cancellationReason;
                if (cancelRow) cancelRow.classList.remove('hidden');
            } else {
                if (cancelRow) cancelRow.classList.add('hidden');
            }

            const modal = document.getElementById('order-details-modal');
            if (modal) modal.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Error opening order details:', err);
    }
}
window.openOrderDetailsModal = openOrderDetailsModal;

function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeOrderDetailsModal = closeOrderDetailsModal;

// ===================================================================
// Phase 9: Delivery & Logistics Management Logic
// ===================================================================

// --- Farmer Delivery Operations ---

async function loadFarmerDeliveries() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(FARMER_DELIVERIES_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            farmerDeliveries = result.data || [];
            updateFarmerDeliveryCounts();
            renderFarmerDeliveriesTable();
        }
    } catch (err) {
        console.error('Failed to load farmer deliveries:', err);
    }
}
window.loadFarmerDeliveries = loadFarmerDeliveries;

function updateFarmerDeliveryCounts() {
    const all = farmerDeliveries.length;
    const pending = farmerDeliveries.filter(d => d.deliveryStatus === 'PENDING').length;
    const shipped = farmerDeliveries.filter(d => d.deliveryStatus === 'SHIPPED' || d.deliveryStatus === 'IN_TRANSIT').length;
    const delivered = farmerDeliveries.filter(d => d.deliveryStatus === 'DELIVERED').length;

    const elAll = document.getElementById('farmer-delivery-count-all');
    const elPending = document.getElementById('farmer-delivery-count-pending');
    const elShipped = document.getElementById('farmer-delivery-count-shipped');
    const elDelivered = document.getElementById('farmer-delivery-count-delivered');

    if (elAll) elAll.textContent = all;
    if (elPending) elPending.textContent = pending;
    if (elShipped) elShipped.textContent = shipped;
    if (elDelivered) elDelivered.textContent = delivered;
}

function renderFarmerDeliveriesTable() {
    const tbody = document.getElementById('farmer-deliveries-tbody');
    if (!tbody) return;

    let filtered = farmerDeliveries;
    if (activeFarmerDeliveryFilter !== 'ALL') {
        if (activeFarmerDeliveryFilter === 'SHIPPED') {
            filtered = farmerDeliveries.filter(d => d.deliveryStatus === 'SHIPPED' || d.deliveryStatus === 'IN_TRANSIT');
        } else {
            filtered = farmerDeliveries.filter(d => d.deliveryStatus === activeFarmerDeliveryFilter);
        }
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    No deliveries found matching filter "${activeFarmerDeliveryFilter}".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(del => {
        const canShip = del.deliveryStatus === 'PENDING';
        const canDeliver = del.deliveryStatus === 'SHIPPED' || del.deliveryStatus === 'IN_TRANSIT';

        return `
            <tr>
                <td><strong>#DEL-${del.deliveryId}</strong></td>
                <td>
                    <div style="font-weight: 600;">#ORD-${del.orderId} — ${escapeHtml(del.cropName || 'Crop')}</div>
                    <small style="color: #64748b;">${parseFloat(del.quantity || 0).toLocaleString()} kg</small>
                </td>
                <td>
                    <div><strong>${escapeHtml(del.buyerName || 'Buyer')}</strong></div>
                    <small style="color: #64748b;">${escapeHtml(del.buyerPhone || 'N/A')}</small>
                </td>
                <td>
                    <div style="max-width: 220px; font-size: 0.85rem; line-height: 1.3;" title="${escapeHtml(del.deliveryAddress || '')}">
                        ${escapeHtml(del.deliveryAddress || 'Not specified')}
                    </div>
                </td>
                <td>
                    <div><span class="tracking-badge">${escapeHtml(del.trackingNumber || 'Unassigned')}</span></div>
                    <small style="color: #64748b;">${escapeHtml(del.vehicleNumber || 'Vehicle pending')}</small>
                </td>
                <td>
                    <small>
                        <div><strong>Ship:</strong> ${del.shippedDate ? formatOrderDateTime(del.shippedDate) : 'Pending'}</div>
                        <div><strong>Deliv:</strong> ${del.deliveredDate ? formatOrderDateTime(del.deliveredDate) : 'Pending'}</div>
                    </small>
                </td>
                <td>${getDeliveryStatusPill(del.deliveryStatus)}</td>
                <td>
                    <div class="table-actions">
                        ${canShip ? `
                            <button type="button" class="btn-action btn-ship" onclick="openShipDeliveryModal(${del.deliveryId}, ${del.orderId})">
                                🚚 Ship
                            </button>
                        ` : ''}
                        ${canDeliver ? `
                            <button type="button" class="btn-action btn-deliver" onclick="handleFarmerMarkDelivered(${del.deliveryId})">
                                ✅ Delivered
                            </button>
                        ` : ''}
                        <button type="button" class="btn-action btn-assess" onclick="openDeliveryDetailsModal(${del.deliveryId}, 'FARMER')">
                            👁️ Details
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Buyer Delivery Operations ---

async function loadBuyerDeliveries() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(BUYER_DELIVERIES_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            buyerDeliveries = result.data || [];
            updateBuyerDeliveryCounts();
            renderBuyerDeliveriesTable();
        }
    } catch (err) {
        console.error('Failed to load buyer deliveries:', err);
    }
}
window.loadBuyerDeliveries = loadBuyerDeliveries;

function updateBuyerDeliveryCounts() {
    const all = buyerDeliveries.length;
    const pending = buyerDeliveries.filter(d => d.deliveryStatus === 'PENDING').length;
    const shipped = buyerDeliveries.filter(d => d.deliveryStatus === 'SHIPPED' || d.deliveryStatus === 'IN_TRANSIT').length;
    const delivered = buyerDeliveries.filter(d => d.deliveryStatus === 'DELIVERED').length;

    const elAll = document.getElementById('buyer-delivery-count-all');
    const elPending = document.getElementById('buyer-delivery-count-pending');
    const elShipped = document.getElementById('buyer-delivery-count-shipped');
    const elDelivered = document.getElementById('buyer-delivery-count-delivered');

    if (elAll) elAll.textContent = all;
    if (elPending) elPending.textContent = pending;
    if (elShipped) elShipped.textContent = shipped;
    if (elDelivered) elDelivered.textContent = delivered;
}

function renderBuyerDeliveriesTable() {
    const tbody = document.getElementById('buyer-deliveries-tbody');
    if (!tbody) return;

    let filtered = buyerDeliveries;
    if (activeBuyerDeliveryFilter !== 'ALL') {
        if (activeBuyerDeliveryFilter === 'SHIPPED') {
            filtered = buyerDeliveries.filter(d => d.deliveryStatus === 'SHIPPED' || d.deliveryStatus === 'IN_TRANSIT');
        } else {
            filtered = buyerDeliveries.filter(d => d.deliveryStatus === activeBuyerDeliveryFilter);
        }
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    No inbound deliveries found matching filter "${activeBuyerDeliveryFilter}".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(del => {
        const canConfirm = del.deliveryStatus === 'SHIPPED' || del.deliveryStatus === 'IN_TRANSIT';

        return `
            <tr>
                <td><strong>#DEL-${del.deliveryId}</strong></td>
                <td>
                    <div style="font-weight: 600;">#ORD-${del.orderId} — ${escapeHtml(del.cropName || 'Crop')}</div>
                    <small style="color: #64748b;">${parseFloat(del.quantity || 0).toLocaleString()} kg</small>
                </td>
                <td>
                    <div><strong>${escapeHtml(del.farmerName || 'Farmer')}</strong></div>
                    <small style="color: #64748b;">${escapeHtml(del.farmerPhone || 'N/A')}</small>
                </td>
                <td>
                    <div style="max-width: 220px; font-size: 0.85rem; line-height: 1.3;" title="${escapeHtml(del.deliveryAddress || '')}">
                        ${escapeHtml(del.deliveryAddress || 'Not specified')}
                    </div>
                </td>
                <td>
                    <div><span class="tracking-badge">${escapeHtml(del.trackingNumber || 'Unassigned')}</span></div>
                    <small style="color: #64748b;">${escapeHtml(del.vehicleNumber || 'Vehicle pending')}</small>
                </td>
                <td>
                    <small>
                        <div><strong>Ship:</strong> ${del.shippedDate ? formatOrderDateTime(del.shippedDate) : 'Pending'}</div>
                        <div><strong>Deliv:</strong> ${del.deliveredDate ? formatOrderDateTime(del.deliveredDate) : 'Pending'}</div>
                    </small>
                </td>
                <td>${getDeliveryStatusPill(del.deliveryStatus)}</td>
                <td>
                    <div class="table-actions">
                        ${canConfirm ? `
                            <button type="button" class="btn-action btn-deliver" onclick="handleBuyerConfirmReceived(${del.deliveryId})">
                                ✅ Confirm Receipt
                            </button>
                        ` : ''}
                        <button type="button" class="btn-action btn-assess" onclick="openDeliveryDetailsModal(${del.deliveryId}, 'BUYER')">
                            👁️ Details
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Admin Delivery Operations ---

async function loadAdminDeliveries() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(ADMIN_DELIVERIES_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            adminDeliveries = result.data || [];
            updateAdminDeliveryCounts();
            renderAdminDeliveriesTable();
        }
    } catch (err) {
        console.error('Failed to load admin deliveries:', err);
    }
}
window.loadAdminDeliveries = loadAdminDeliveries;

function updateAdminDeliveryCounts() {
    const all = adminDeliveries.length;
    const pending = adminDeliveries.filter(d => d.deliveryStatus === 'PENDING').length;
    const shipped = adminDeliveries.filter(d => d.deliveryStatus === 'SHIPPED' || d.deliveryStatus === 'IN_TRANSIT').length;
    const delivered = adminDeliveries.filter(d => d.deliveryStatus === 'DELIVERED').length;

    const elAll = document.getElementById('admin-delivery-count-all');
    const elPending = document.getElementById('admin-delivery-count-pending');
    const elShipped = document.getElementById('admin-delivery-count-shipped');
    const elDelivered = document.getElementById('admin-delivery-count-delivered');

    if (elAll) elAll.textContent = all;
    if (elPending) elPending.textContent = pending;
    if (elShipped) elShipped.textContent = shipped;
    if (elDelivered) elDelivered.textContent = delivered;
}

function renderAdminDeliveriesTable() {
    const tbody = document.getElementById('admin-deliveries-tbody');
    if (!tbody) return;

    let filtered = adminDeliveries;
    if (activeAdminDeliveryFilter !== 'ALL') {
        if (activeAdminDeliveryFilter === 'SHIPPED') {
            filtered = adminDeliveries.filter(d => d.deliveryStatus === 'SHIPPED' || d.deliveryStatus === 'IN_TRANSIT');
        } else {
            filtered = adminDeliveries.filter(d => d.deliveryStatus === activeAdminDeliveryFilter);
        }
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-muted">
                    No deliveries recorded in the system for status "${activeAdminDeliveryFilter}".
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(del => {
        return `
            <tr>
                <td><strong>#DEL-${del.deliveryId}</strong></td>
                <td>
                    <div style="font-weight: 600;">#ORD-${del.orderId} — ${escapeHtml(del.cropName || 'Crop')}</div>
                    <small style="color: #64748b;">${parseFloat(del.quantity || 0).toLocaleString()} kg</small>
                </td>
                <td>
                    <div><strong>${escapeHtml(del.buyerName || 'Buyer')}</strong></div>
                    <small style="color: #64748b;">${escapeHtml(del.buyerPhone || 'N/A')}</small>
                </td>
                <td>
                    <div><strong>${escapeHtml(del.farmerName || 'Farmer')}</strong></div>
                    <small style="color: #64748b;">${escapeHtml(del.farmerPhone || 'N/A')}</small>
                </td>
                <td>
                    <div style="max-width: 200px; font-size: 0.85rem;" title="${escapeHtml(del.deliveryAddress || '')}">
                        ${escapeHtml(del.deliveryAddress || 'Not specified')}
                    </div>
                </td>
                <td>
                    <div><span class="tracking-badge">${escapeHtml(del.trackingNumber || 'Unassigned')}</span></div>
                    <small style="color: #64748b;">${escapeHtml(del.vehicleNumber || 'Pending')}</small>
                </td>
                <td>${getDeliveryStatusPill(del.deliveryStatus)}</td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="btn-action btn-assess" onclick="openDeliveryDetailsModal(${del.deliveryId}, 'ADMIN')">
                            👁️ Monitor
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Modals & Actions ---

function openCreateDeliveryModal(orderId, cropName = '', qty = 0) {
    document.getElementById('delivery-order-id').value = orderId;
    document.getElementById('create-delivery-order-ref').textContent = `#ORD-${orderId}`;
    document.getElementById('create-delivery-crop-info').textContent = cropName || 'Produce Lot';
    document.getElementById('create-delivery-qty-info').textContent = qty ? `${parseFloat(qty).toLocaleString()} kg` : '--';

    document.getElementById('delivery-address-input').value = '';
    document.getElementById('delivery-vehicle-input').value = '';
    document.getElementById('delivery-tracking-input').value = '';
    document.getElementById('delivery-eta-input').value = '';
    document.getElementById('delivery-remarks-input').value = '';

    const alertEl = document.getElementById('create-delivery-alert');
    if (alertEl) alertEl.classList.add('hidden');

    const modal = document.getElementById('create-delivery-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openCreateDeliveryModal = openCreateDeliveryModal;

function closeCreateDeliveryModal() {
    const modal = document.getElementById('create-delivery-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeCreateDeliveryModal = closeCreateDeliveryModal;

async function handleCreateDeliverySubmit(event) {
    if (event) event.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const orderId = document.getElementById('delivery-order-id').value;
    const deliveryAddress = document.getElementById('delivery-address-input').value.trim();
    const vehicleNumber = document.getElementById('delivery-vehicle-input').value.trim();
    const trackingNumber = document.getElementById('delivery-tracking-input').value.trim();
    const etaInput = document.getElementById('delivery-eta-input').value;
    const remarks = document.getElementById('delivery-remarks-input').value.trim();

    const alertEl = document.getElementById('create-delivery-alert');
    const spinner = document.getElementById('create-delivery-spinner');
    const btnText = document.getElementById('create-delivery-text');
    const submitBtn = document.getElementById('confirm-create-delivery-btn');

    if (!deliveryAddress) {
        if (alertEl) {
            alertEl.textContent = 'Delivery / Shipping Address is required.';
            alertEl.className = 'auth-alert auth-alert-error';
            alertEl.classList.remove('hidden');
        }
        return;
    }

    const payload = {
        orderId: parseInt(orderId, 10),
        deliveryAddress: deliveryAddress,
        vehicleNumber: vehicleNumber || null,
        trackingNumber: trackingNumber || null,
        estimatedDeliveryDate: etaInput ? new Date(etaInput).toISOString() : null,
        remarks: remarks || null
    };

    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Creating...';
    if (submitBtn) submitBtn.disabled = true;

    try {
        const isFarmer = currentUser && currentUser.role === 'FARMER';
        const endpoint = isFarmer ? FARMER_DELIVERIES_ENDPOINT : BUYER_DELIVERIES_ENDPOINT;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            closeCreateDeliveryModal();
            if (isFarmer) {
                await loadFarmerDeliveries();
                await loadFarmerOrders();
                showFarmerDeliveryAlert('Delivery successfully scheduled!', 'success');
            } else {
                await loadBuyerDeliveries();
                await loadBuyerOrders();
                showBuyerDeliveryAlert('Delivery successfully scheduled!', 'success');
            }
        } else {
            if (alertEl) {
                alertEl.textContent = data.message || 'Failed to create delivery record.';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (alertEl) {
            alertEl.textContent = 'Network error communicating with delivery service.';
            alertEl.className = 'auth-alert auth-alert-error';
            alertEl.classList.remove('hidden');
        }
    } finally {
        if (spinner) spinner.classList.add('hidden');
        if (btnText) btnText.textContent = 'Create Delivery Record';
        if (submitBtn) submitBtn.disabled = false;
    }
}

function openShipDeliveryModal(deliveryId, orderId) {
    document.getElementById('ship-target-delivery-id').value = deliveryId;
    document.getElementById('ship-delivery-ref').textContent = `Delivery #DEL-${deliveryId} (Order #ORD-${orderId})`;
    document.getElementById('ship-vehicle-input').value = '';
    document.getElementById('ship-tracking-input').value = '';
    document.getElementById('ship-remarks-input').value = '';

    const alertEl = document.getElementById('ship-delivery-alert');
    if (alertEl) alertEl.classList.add('hidden');

    const modal = document.getElementById('ship-delivery-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openShipDeliveryModal = openShipDeliveryModal;

function closeShipDeliveryModal() {
    const modal = document.getElementById('ship-delivery-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeShipDeliveryModal = closeShipDeliveryModal;

async function handleShipDeliverySubmit(event) {
    if (event) event.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const deliveryId = document.getElementById('ship-target-delivery-id').value;
    const vehicleNumber = document.getElementById('ship-vehicle-input').value.trim();
    const trackingNumber = document.getElementById('ship-tracking-input').value.trim();
    const remarks = document.getElementById('ship-remarks-input').value.trim();

    const alertEl = document.getElementById('ship-delivery-alert');
    const spinner = document.getElementById('ship-delivery-spinner');
    const btnText = document.getElementById('ship-delivery-text');
    const submitBtn = document.getElementById('confirm-ship-delivery-btn');

    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Dispatching...';
    if (submitBtn) submitBtn.disabled = true;

    try {
        const response = await fetch(`${FARMER_DELIVERIES_ENDPOINT}/${deliveryId}/ship`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                vehicleNumber: vehicleNumber || null,
                trackingNumber: trackingNumber || null,
                remarks: remarks || null
            })
        });

        const data = await response.json();

        if (response.ok) {
            closeShipDeliveryModal();
            await loadFarmerDeliveries();
            await loadFarmerOrders();
            showFarmerDeliveryAlert(`Shipment #DEL-${deliveryId} dispatched successfully! Order marked as SHIPPED.`, 'success');
        } else {
            if (alertEl) {
                alertEl.textContent = data.message || 'Failed to dispatch shipment.';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (alertEl) {
            alertEl.textContent = 'Network error dispatching shipment.';
            alertEl.className = 'auth-alert auth-alert-error';
            alertEl.classList.remove('hidden');
        }
    } finally {
        if (spinner) spinner.classList.add('hidden');
        if (btnText) btnText.textContent = 'Confirm Dispatch (Ship)';
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function handleFarmerMarkDelivered(deliveryId) {
    const token = getAuthToken();
    if (!token) return;

    if (!confirm(`Mark delivery #DEL-${deliveryId} as DELIVERED? This completes fulfillment and transitions the underlying order to DELIVERED.`)) {
        return;
    }

    try {
        const response = await fetch(`${FARMER_DELIVERIES_ENDPOINT}/${deliveryId}/deliver`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                remarks: 'Delivered confirmed by producer'
            })
        });

        const data = await response.json();

        if (response.ok) {
            await loadFarmerDeliveries();
            await loadFarmerOrders();
            showFarmerDeliveryAlert(`Delivery #DEL-${deliveryId} marked as DELIVERED successfully!`, 'success');
        } else {
            showFarmerDeliveryAlert(data.message || 'Failed to mark delivery delivered.', 'error');
        }
    } catch (err) {
        showFarmerDeliveryAlert('Network error completing delivery.', 'error');
    }
}
window.handleFarmerMarkDelivered = handleFarmerMarkDelivered;

async function handleBuyerConfirmReceived(deliveryId) {
    const token = getAuthToken();
    if (!token) return;

    if (!confirm(`Confirm receipt for delivery #DEL-${deliveryId}? This acknowledges full produce handover and closes the order as DELIVERED.`)) {
        return;
    }

    try {
        const response = await fetch(`${BUYER_DELIVERIES_ENDPOINT}/${deliveryId}/confirm-received`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                remarks: 'Produce delivery received and confirmed by buyer'
            })
        });

        const data = await response.json();

        if (response.ok) {
            await loadBuyerDeliveries();
            await loadBuyerOrders();
            showBuyerDeliveryAlert(`Delivery #DEL-${deliveryId} receipt confirmed! Order marked as DELIVERED.`, 'success');
        } else {
            showBuyerDeliveryAlert(data.message || 'Failed to confirm delivery receipt.', 'error');
        }
    } catch (err) {
        showBuyerDeliveryAlert('Network error confirming receipt.', 'error');
    }
}
window.handleBuyerConfirmReceived = handleBuyerConfirmReceived;

async function openDeliveryDetailsModal(deliveryId, role = 'BUYER') {
    const token = getAuthToken();
    if (!token) return;

    let endpoint = `${BUYER_DELIVERIES_ENDPOINT}/${deliveryId}`;
    if (role === 'FARMER') endpoint = `${FARMER_DELIVERIES_ENDPOINT}/${deliveryId}`;
    else if (role === 'ADMIN') endpoint = `${ADMIN_DELIVERIES_ENDPOINT}/${deliveryId}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            const del = result.data;
            if (!del) return;

            document.getElementById('dd-delivery-id').textContent = `#DEL-${del.deliveryId}`;
            document.getElementById('dd-order-id').textContent = del.orderId;
            document.getElementById('dd-status-badge').innerHTML = getDeliveryStatusPill(del.deliveryStatus);
            document.getElementById('dd-crop-details').textContent = `${del.cropName || 'Produce'} — ${parseFloat(del.quantity || 0).toLocaleString()} kg`;
            document.getElementById('dd-farmer-name').textContent = `${del.farmerName || 'Farmer'} (${del.farmerPhone || 'N/A'})`;
            document.getElementById('dd-buyer-name').textContent = `${del.buyerName || 'Buyer'} (${del.buyerPhone || 'N/A'})`;
            document.getElementById('dd-address').textContent = del.deliveryAddress || 'Not specified';
            document.getElementById('dd-vehicle').textContent = del.vehicleNumber || 'Unassigned';
            document.getElementById('dd-tracking').textContent = del.trackingNumber || 'Unassigned';
            document.getElementById('dd-eta').textContent = del.estimatedDeliveryDate ? formatOrderDateTime(del.estimatedDeliveryDate) : 'Not specified';
            document.getElementById('dd-shipped-date').textContent = del.shippedDate ? formatOrderDateTime(del.shippedDate) : 'Not yet dispatched';
            document.getElementById('dd-delivered-date').textContent = del.deliveredDate ? formatOrderDateTime(del.deliveredDate) : 'Pending delivery';
            document.getElementById('dd-remarks').textContent = del.remarks || 'None';

            const modal = document.getElementById('delivery-details-modal');
            if (modal) modal.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Error opening delivery details:', err);
    }
}
window.openDeliveryDetailsModal = openDeliveryDetailsModal;

function closeDeliveryDetailsModal() {
    const modal = document.getElementById('delivery-details-modal');
    if (modal) modal.classList.add('hidden');
}
window.closeDeliveryDetailsModal = closeDeliveryDetailsModal;

function showFarmerDeliveryAlert(msg, type = 'success') {
    const el = document.getElementById('farmer-deliveries-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function showBuyerDeliveryAlert(msg, type = 'success') {
    const el = document.getElementById('buyer-deliveries-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

// ===================================================================
// Phase 11: Price History & Analytics Logic
// ===================================================================

function showFarmerPriceHistoryAlert(message, type = 'error') {
    const alert = document.getElementById('farmer-price-history-alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = `auth-alert alert-${type}`;
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 5000);
}

function showBuyerPriceHistoryAlert(message, type = 'error') {
    const alert = document.getElementById('buyer-price-history-alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = `auth-alert alert-${type}`;
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 5000);
}

function showAdminPriceHistoryAlert(message, type = 'error') {
    const alert = document.getElementById('admin-price-history-alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = `auth-alert alert-${type}`;
    alert.classList.remove('hidden');
    setTimeout(() => alert.classList.add('hidden'), 5000);
}

function populateCropFilterDropdown(selectElementId, crops) {
    const select = document.getElementById(selectElementId);
    if (!select || !crops || crops.length === 0) return;
    const currentVal = select.value;
    const defaultLabel = selectElementId === 'buyer-ph-crop-select' ? '-- All Crops Overview --' : 'All Crops';
    select.innerHTML = `<option value="">${defaultLabel}</option>`;
    crops.forEach(crop => {
        const opt = document.createElement('option');
        opt.value = crop.cropId;
        opt.textContent = `${crop.cropName} (${crop.category || 'General'})`;
        select.appendChild(opt);
    });
    if (currentVal) select.value = currentVal;
}

// --- Farmer Price History ---

async function loadFarmerPriceHistory() {
    const token = getAuthToken();
    if (!token) return;

    if (allCrops.length > 0) {
        populateCropFilterDropdown('farmer-ph-crop-filter', allCrops);
    }

    const cropId = document.getElementById('farmer-ph-crop-filter')?.value;
    const startDate = document.getElementById('farmer-ph-start-date')?.value;
    const endDate = document.getElementById('farmer-ph-end-date')?.value;

    const params = new URLSearchParams();
    if (cropId) params.append('cropId', cropId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = params.toString() ? `${FARMER_PRICE_HISTORY_ENDPOINT}?${params.toString()}` : FARMER_PRICE_HISTORY_ENDPOINT;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            const result = await response.json();
            farmerPriceHistory = result.data || [];
            renderFarmerPriceHistoryTable();
        } else {
            const err = await response.json();
            showFarmerPriceHistoryAlert(err.message || 'Failed to load sales price history.');
        }
    } catch (err) {
        console.error('Failed to load farmer price history:', err);
        showFarmerPriceHistoryAlert('Network error loading price history.');
    }
}

function renderFarmerPriceHistoryTable() {
    const tbody = document.getElementById('farmer-price-history-tbody');
    if (!tbody) return;

    if (farmerPriceHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No sales price records found.</td></tr>';
        return;
    }

    tbody.innerHTML = farmerPriceHistory.map(ph => {
        const price = ph.unitPrice != null ? Number(ph.unitPrice).toFixed(2) : (ph.modalPricePerKg != null ? Number(ph.modalPricePerKg).toFixed(2) : '--');
        const qty = ph.quantity != null ? Number(ph.quantity).toFixed(2) : '--';
        const total = ph.totalAmount != null ? Number(ph.totalAmount).toFixed(2) : '--';
        const isSale = ph.sourceType === 'TRANSACTION_SALE';
        const sourceBadge = isSale
            ? '<span class="source-badge source-badge-sale">Sale Contract</span>'
            : '<span class="source-badge source-badge-mandi">Mandi Benchmark</span>';

        return `
            <tr>
                <td><strong>#${ph.priceId}</strong></td>
                <td>${ph.orderId ? `<span class="txn-badge">#${ph.orderId}</span>` : '<span class="text-muted">--</span>'}</td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(ph.cropName || 'Crop')}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(ph.cropCategory || '')}</div>
                </td>
                <td><strong style="color: #15803d;">₹${price}</strong></td>
                <td>${qty} kg</td>
                <td><strong>₹${total}</strong></td>
                <td>${escapeHtml(ph.marketLocation || 'Direct Farm')}</td>
                <td>${escapeHtml(ph.recordedDate || '')}</td>
                <td>${sourceBadge}</td>
            </tr>
        `;
    }).join('');
}

// --- Buyer Price History & Analytics ---

async function loadBuyerPriceHistory() {
    const token = getAuthToken();
    if (!token) return;

    if (allCrops.length > 0) {
        populateCropFilterDropdown('buyer-ph-crop-select', allCrops);
    }

    const cropSelect = document.getElementById('buyer-ph-crop-select');
    const cropId = cropSelect ? cropSelect.value : '';
    const startDate = document.getElementById('buyer-ph-start-date')?.value;
    const endDate = document.getElementById('buyer-ph-end-date')?.value;

    const params = new URLSearchParams();
    if (cropId) params.append('cropId', cropId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = params.toString() ? `${BUYER_PRICE_HISTORY_ENDPOINT}?${params.toString()}` : BUYER_PRICE_HISTORY_ENDPOINT;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            const result = await response.json();
            buyerPriceHistory = result.data || [];
            renderBuyerPriceHistoryTable();
        }

        // If specific crop selected, load crop analytics
        if (cropId) {
            await loadBuyerCropAnalytics(cropId, startDate, endDate);
        } else {
            resetBuyerCropAnalyticsDisplay();
        }
    } catch (err) {
        console.error('Failed to load buyer price history:', err);
    }
}

async function loadBuyerCropAnalytics(cropId, startDate, endDate) {
    const token = getAuthToken();
    if (!token || !cropId) return;

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = params.toString()
        ? `${BUYER_PRICE_HISTORY_ENDPOINT}/analytics/${cropId}?${params.toString()}`
        : `${BUYER_PRICE_HISTORY_ENDPOINT}/analytics/${cropId}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            const result = await response.json();
            selectedBuyerCropAnalytics = result.data;
            renderBuyerCropAnalytics(selectedBuyerCropAnalytics);
        }
    } catch (err) {
        console.error('Failed to load crop analytics:', err);
    }
}

function renderBuyerCropAnalytics(analytics) {
    if (!analytics) {
        resetBuyerCropAnalyticsDisplay();
        return;
    }

    const avgEl = document.getElementById('buyer-ph-avg-price');
    const minMaxEl = document.getElementById('buyer-ph-min-max');
    const latestEl = document.getElementById('buyer-ph-latest-price');
    const volumeEl = document.getElementById('buyer-ph-volume');
    const trendEl = document.getElementById('buyer-ph-trend-badge');

    if (avgEl) avgEl.textContent = analytics.averagePrice != null ? `₹${Number(analytics.averagePrice).toFixed(2)}` : '--';
    if (minMaxEl) {
        const min = analytics.minimumPrice != null ? `₹${Number(analytics.minimumPrice).toFixed(2)}` : '--';
        const max = analytics.maximumPrice != null ? `₹${Number(analytics.maximumPrice).toFixed(2)}` : '--';
        minMaxEl.textContent = `${min} - ${max}`;
    }
    if (latestEl) latestEl.textContent = analytics.latestPrice != null ? `₹${Number(analytics.latestPrice).toFixed(2)}` : '--';
    if (volumeEl) volumeEl.textContent = analytics.totalQuantity != null ? `${Number(analytics.totalQuantity).toFixed(2)} kg` : '0 kg';

    if (trendEl) {
        const trend = analytics.recentTrend || 'INSUFFICIENT_DATA';
        let trendHtml;
        if (trend === 'UPWARD') {
            trendHtml = '<span class="trend-badge trend-upward">📈 UPWARD</span>';
        } else if (trend === 'DOWNWARD') {
            trendHtml = '<span class="trend-badge trend-downward">📉 DOWNWARD</span>';
        } else if (trend === 'STABLE') {
            trendHtml = '<span class="trend-badge trend-stable">⚖️ STABLE</span>';
        } else {
            trendHtml = '<span class="trend-badge trend-insufficient">ℹ️ INSUFFICIENT DATA</span>';
        }
        trendEl.innerHTML = trendHtml;
    }
}

function resetBuyerCropAnalyticsDisplay() {
    const avgEl = document.getElementById('buyer-ph-avg-price');
    const minMaxEl = document.getElementById('buyer-ph-min-max');
    const latestEl = document.getElementById('buyer-ph-latest-price');
    const volumeEl = document.getElementById('buyer-ph-volume');
    const trendEl = document.getElementById('buyer-ph-trend-badge');

    if (avgEl) avgEl.textContent = '--';
    if (minMaxEl) minMaxEl.textContent = '--';
    if (latestEl) latestEl.textContent = '--';
    if (volumeEl) volumeEl.textContent = '--';
    if (trendEl) trendEl.innerHTML = '<span class="trend-badge trend-insufficient">Select Crop</span>';
}

function renderBuyerPriceHistoryTable() {
    const tbody = document.getElementById('buyer-price-history-tbody');
    if (!tbody) return;

    if (buyerPriceHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No historical pricing data available.</td></tr>';
        return;
    }

    tbody.innerHTML = buyerPriceHistory.map(ph => {
        const effective = ph.effectivePrice != null ? Number(ph.effectivePrice).toFixed(2) : (ph.modalPricePerKg != null ? Number(ph.modalPricePerKg).toFixed(2) : '--');
        const qty = ph.quantity != null ? `${Number(ph.quantity).toFixed(2)} kg` : '--';
        const total = ph.totalAmount != null ? `₹${Number(ph.totalAmount).toFixed(2)}` : '--';
        const isSale = ph.sourceType === 'TRANSACTION_SALE';
        const sourceBadge = isSale
            ? '<span class="source-badge source-badge-sale">Sale Contract</span>'
            : '<span class="source-badge source-badge-mandi">Mandi Benchmark</span>';

        return `
            <tr>
                <td><strong>#${ph.priceId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(ph.cropName || 'Crop')}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(ph.cropCategory || '')}</div>
                </td>
                <td>${sourceBadge}</td>
                <td>${ph.orderId ? `<span class="txn-badge">#${ph.orderId}</span>` : '<span class="text-muted">--</span>'}</td>
                <td><strong style="color: #15803d;">₹${effective}</strong></td>
                <td>${qty}</td>
                <td>${total}</td>
                <td>${escapeHtml(ph.marketLocation || 'Market Direct')}</td>
                <td>${escapeHtml(ph.recordedDate || '')}</td>
            </tr>
        `;
    }).join('');
}

// --- Admin Price History & Macro Analytics ---

async function loadAdminPriceHistory() {
    const token = getAuthToken();
    if (!token) return;

    if (allCrops.length > 0) {
        populateCropFilterDropdown('admin-ph-crop-filter', allCrops);
    }

    const cropId = document.getElementById('admin-ph-crop-filter')?.value;
    const sourceType = document.getElementById('admin-ph-source-filter')?.value;
    const startDate = document.getElementById('admin-ph-start-date')?.value;
    const endDate = document.getElementById('admin-ph-end-date')?.value;

    // 1. Fetch marketplace macro summary
    const summaryParams = new URLSearchParams();
    if (startDate) summaryParams.append('startDate', startDate);
    if (endDate) summaryParams.append('endDate', endDate);
    const summaryUrl = summaryParams.toString()
        ? `${ADMIN_PRICE_HISTORY_ENDPOINT}/summary?${summaryParams.toString()}`
        : `${ADMIN_PRICE_HISTORY_ENDPOINT}/summary`;

    try {
        const summaryRes = await fetch(summaryUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (summaryRes.ok) {
            const summaryResult = await summaryRes.json();
            marketplacePriceSummary = summaryResult.data;
            renderAdminMarketplaceSummary(marketplacePriceSummary);
        }
    } catch (err) {
        console.error('Failed to load marketplace summary:', err);
    }

    // 2. Fetch full price history
    const params = new URLSearchParams();
    if (cropId) params.append('cropId', cropId);
    if (sourceType) params.append('sourceType', sourceType);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = params.toString() ? `${ADMIN_PRICE_HISTORY_ENDPOINT}?${params.toString()}` : ADMIN_PRICE_HISTORY_ENDPOINT;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            const result = await response.json();
            adminPriceHistory = result.data || [];
            renderAdminPriceHistoryTable();
        }
    } catch (err) {
        console.error('Failed to load admin price history:', err);
    }
}

function renderAdminMarketplaceSummary(summary) {
    if (!summary) return;
    const txnsEl = document.getElementById('admin-ph-total-txns');
    const volumeEl = document.getElementById('admin-ph-total-volume');
    const avgEl = document.getElementById('admin-ph-avg-price');
    const highEl = document.getElementById('admin-ph-highest-crop');
    const lowEl = document.getElementById('admin-ph-lowest-crop');

    if (txnsEl) txnsEl.textContent = summary.overallTransactionCount || 0;
    if (volumeEl) volumeEl.textContent = summary.overallTotalQuantity != null ? Number(summary.overallTotalQuantity).toFixed(2) : '0.00';
    if (avgEl) avgEl.textContent = summary.overallAveragePrice != null ? `₹${Number(summary.overallAveragePrice).toFixed(2)}` : '₹0.00';
    if (highEl) {
        const val = summary.highestCropAveragePrice != null ? ` (₹${Number(summary.highestCropAveragePrice).toFixed(2)})` : '';
        highEl.textContent = `${summary.highestPricedCrop || '-'}${val}`;
    }
    if (lowEl) {
        const val = summary.lowestCropAveragePrice != null ? ` (₹${Number(summary.lowestCropAveragePrice).toFixed(2)})` : '';
        lowEl.textContent = `${summary.lowestPricedCrop || '-'}${val}`;
    }
}

function renderAdminPriceHistoryTable() {
    const tbody = document.getElementById('admin-price-history-tbody');
    if (!tbody) return;

    if (adminPriceHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center py-4 text-muted">No historical price entries found.</td></tr>';
        return;
    }

    tbody.innerHTML = adminPriceHistory.map(ph => {
        const effective = ph.effectivePrice != null ? Number(ph.effectivePrice).toFixed(2) : (ph.modalPricePerKg != null ? Number(ph.modalPricePerKg).toFixed(2) : '--');
        const qty = ph.quantity != null ? `${Number(ph.quantity).toFixed(2)}` : '--';
        const total = ph.totalAmount != null ? `₹${Number(ph.totalAmount).toFixed(2)}` : '--';
        const isSale = ph.sourceType === 'TRANSACTION_SALE';
        const sourceBadge = isSale
            ? '<span class="source-badge source-badge-sale">Commercial Sale</span>'
            : '<span class="source-badge source-badge-mandi">Mandi Benchmark</span>';

        return `
            <tr>
                <td><strong>#${ph.priceId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(ph.cropName || 'Crop')}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(ph.cropCategory || '')}</div>
                </td>
                <td>${sourceBadge}</td>
                <td>${ph.orderId ? `<span class="txn-badge">#${ph.orderId}</span>` : '<span class="text-muted">--</span>'}</td>
                <td>${ph.farmerName ? escapeHtml(ph.farmerName) : '<span class="text-muted">--</span>'}</td>
                <td>${ph.buyerName ? escapeHtml(ph.buyerName) : '<span class="text-muted">--</span>'}</td>
                <td><strong style="color: #15803d;">₹${effective}</strong></td>
                <td>${qty}</td>
                <td><strong>${total}</strong></td>
                <td>${escapeHtml(ph.marketLocation || 'Market Direct')}</td>
                <td>${escapeHtml(ph.recordedDate || '')}</td>
            </tr>
        `;
    }).join('');
}

// ===================================================================
// Phase 10: Payment Processing, Tracking & Settlement Logic
// ===================================================================

function showFarmerPaymentAlert(msg, type = 'success') {
    const el = document.getElementById('farmer-payments-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function showBuyerPaymentAlert(msg, type = 'success') {
    const el = document.getElementById('buyer-payments-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function showAdminPaymentAlert(msg, type = 'success') {
    const el = document.getElementById('admin-payments-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-alert auth-alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

// --- Farmer Payment Operations ---

async function loadFarmerPayments() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(FARMER_PAYMENTS_ENDPOINT, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            const result = await response.json();
            farmerPayments = result.data || [];
            updateFarmerPaymentCounts();
            renderFarmerPaymentsTable();
        }
    } catch (err) {
        console.error('Failed to load farmer payments:', err);
    }
}

function updateFarmerPaymentCounts() {
    const completed = farmerPayments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID').length;
    const pending = farmerPayments.filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PROCESSING').length;
    const refunded = farmerPayments.filter(p => p.paymentStatus === 'REFUNDED').length;

    const elAll = document.getElementById('farmer-payment-count-all');
    const elCompleted = document.getElementById('farmer-payment-count-completed');
    const elPending = document.getElementById('farmer-payment-count-pending');
    const elRefunded = document.getElementById('farmer-payment-count-refunded');

    if (elAll) elAll.textContent = farmerPayments.length;
    if (elCompleted) elCompleted.textContent = completed;
    if (elPending) elPending.textContent = pending;
    if (elRefunded) elRefunded.textContent = refunded;
}

function renderFarmerPaymentsTable() {
    const tbody = document.getElementById('farmer-payments-tbody');
    if (!tbody) return;

    let filtered = farmerPayments;
    if (activeFarmerPaymentFilter === 'COMPLETED') {
        filtered = farmerPayments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID');
    } else if (activeFarmerPaymentFilter === 'PENDING') {
        filtered = farmerPayments.filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PROCESSING');
    } else if (activeFarmerPaymentFilter === 'REFUNDED') {
        filtered = farmerPayments.filter(p => p.paymentStatus === 'REFUNDED');
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No payments found matching "${activeFarmerPaymentFilter}".</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(payment => {
        const dateStr = payment.paymentDate ? formatOrderDateTime(payment.paymentDate) : '--';
        return `
            <tr>
                <td><strong>#PAY-${payment.paymentId}</strong></td>
                <td>
                    <strong>${escapeHtml(payment.cropName || 'Crop')}</strong>
                    <br><small style="color:#64748b;">Order #ORD-${payment.orderId}</small>
                </td>
                <td>
                    ${escapeHtml(payment.buyerName || 'Buyer')}
                    <br><small style="color:#64748b;">${escapeHtml(payment.buyerPhone || 'N/A')}</small>
                </td>
                <td><strong style="color:#16a34a;">₹${parseFloat(payment.amount).toFixed(2)}</strong></td>
                <td><span class="badge" style="background:#f1f5f9; color:#334155; font-size:0.75rem;">${payment.paymentMethod}</span></td>
                <td><code class="txn-badge">${payment.transactionReference || '--'}</code></td>
                <td><small>${dateStr}</small></td>
                <td>${getPaymentStatusPill(payment.paymentStatus)}</td>
                <td>
                    <button type="button" class="btn-action btn-assess" onclick="openPaymentDetailsModal(${payment.paymentId}, 'FARMER')">
                        👁️ Receipt
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Buyer Payment Operations ---

async function loadBuyerPayments() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(BUYER_PAYMENTS_ENDPOINT, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            const result = await response.json();
            buyerPayments = result.data || [];
            updateBuyerPaymentCounts();
            renderBuyerPaymentsTable();
        }
    } catch (err) {
        console.error('Failed to load buyer payments:', err);
    }
}

function updateBuyerPaymentCounts() {
    const completed = buyerPayments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID').length;
    const pending = buyerPayments.filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PROCESSING').length;
    const refunded = buyerPayments.filter(p => p.paymentStatus === 'REFUNDED').length;

    const elAll = document.getElementById('buyer-payment-count-all');
    const elCompleted = document.getElementById('buyer-payment-count-completed');
    const elPending = document.getElementById('buyer-payment-count-pending');
    const elRefunded = document.getElementById('buyer-payment-count-refunded');

    if (elAll) elAll.textContent = buyerPayments.length;
    if (elCompleted) elCompleted.textContent = completed;
    if (elPending) elPending.textContent = pending;
    if (elRefunded) elRefunded.textContent = refunded;
}

function renderBuyerPaymentsTable() {
    const tbody = document.getElementById('buyer-payments-tbody');
    if (!tbody) return;

    let filtered = buyerPayments;
    if (activeBuyerPaymentFilter === 'COMPLETED') {
        filtered = buyerPayments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID');
    } else if (activeBuyerPaymentFilter === 'PENDING') {
        filtered = buyerPayments.filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PROCESSING');
    } else if (activeBuyerPaymentFilter === 'REFUNDED') {
        filtered = buyerPayments.filter(p => p.paymentStatus === 'REFUNDED');
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No payments found matching "${activeBuyerPaymentFilter}".</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(payment => {
        const dateStr = payment.paymentDate ? formatOrderDateTime(payment.paymentDate) : '--';
        return `
            <tr>
                <td><strong>#PAY-${payment.paymentId}</strong></td>
                <td>
                    <strong>${escapeHtml(payment.cropName || 'Crop')}</strong>
                    <br><small style="color:#64748b;">Order #ORD-${payment.orderId}</small>
                </td>
                <td>
                    ${escapeHtml(payment.farmerName || 'Farmer')}
                    <br><small style="color:#64748b;">${escapeHtml(payment.farmerPhone || 'N/A')}</small>
                </td>
                <td><strong style="color:#16a34a;">₹${parseFloat(payment.amount).toFixed(2)}</strong></td>
                <td><span class="badge" style="background:#f1f5f9; color:#334155; font-size:0.75rem;">${payment.paymentMethod}</span></td>
                <td><code class="txn-badge">${payment.transactionReference || '--'}</code></td>
                <td><small>${dateStr}</small></td>
                <td>${getPaymentStatusPill(payment.paymentStatus)}</td>
                <td>
                    <button type="button" class="btn-action btn-assess" onclick="openPaymentDetailsModal(${payment.paymentId}, 'BUYER')">
                        👁️ Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Admin Payment Operations ---

async function loadAdminPayments() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(ADMIN_PAYMENTS_ENDPOINT, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (response.ok) {
            const result = await response.json();
            adminPayments = result.data || [];
            updateAdminPaymentCounts();
            renderAdminPaymentsTable();
        }
    } catch (err) {
        console.error('Failed to load admin payments:', err);
    }
}

function updateAdminPaymentCounts() {
    const completed = adminPayments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID').length;
    const pending = adminPayments.filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PROCESSING').length;
    const refunded = adminPayments.filter(p => p.paymentStatus === 'REFUNDED').length;

    const elAll = document.getElementById('admin-payment-count-all');
    const elCompleted = document.getElementById('admin-payment-count-completed');
    const elPending = document.getElementById('admin-payment-count-pending');
    const elRefunded = document.getElementById('admin-payment-count-refunded');

    if (elAll) elAll.textContent = adminPayments.length;
    if (elCompleted) elCompleted.textContent = completed;
    if (elPending) elPending.textContent = pending;
    if (elRefunded) elRefunded.textContent = refunded;
}

function renderAdminPaymentsTable() {
    const tbody = document.getElementById('admin-payments-tbody');
    if (!tbody) return;

    let filtered = adminPayments;
    if (activeAdminPaymentFilter === 'COMPLETED') {
        filtered = adminPayments.filter(p => p.paymentStatus === 'COMPLETED' || p.paymentStatus === 'PAID');
    } else if (activeAdminPaymentFilter === 'PENDING') {
        filtered = adminPayments.filter(p => p.paymentStatus === 'PENDING' || p.paymentStatus === 'PROCESSING');
    } else if (activeAdminPaymentFilter === 'REFUNDED') {
        filtered = adminPayments.filter(p => p.paymentStatus === 'REFUNDED');
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">No payments found matching "${activeAdminPaymentFilter}".</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(payment => {
        const dateStr = payment.paymentDate ? formatOrderDateTime(payment.paymentDate) : '--';
        return `
            <tr>
                <td><strong>#PAY-${payment.paymentId}</strong></td>
                <td>
                    <strong>${escapeHtml(payment.cropName || 'Crop')}</strong>
                    <br><small style="color:#64748b;">Order #ORD-${payment.orderId}</small>
                </td>
                <td>${escapeHtml(payment.buyerName || 'Buyer')}</td>
                <td>${escapeHtml(payment.farmerName || 'Farmer')}</td>
                <td><strong style="color:#16a34a;">₹${parseFloat(payment.amount).toFixed(2)}</strong></td>
                <td><span class="badge" style="background:#f1f5f9; color:#334155; font-size:0.75rem;">${payment.paymentMethod}</span></td>
                <td><code class="txn-badge">${payment.transactionReference || '--'}</code></td>
                <td><small>${dateStr}</small></td>
                <td>${getPaymentStatusPill(payment.paymentStatus)}</td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="btn-action btn-assess" onclick="openPaymentDetailsModal(${payment.paymentId}, 'ADMIN')">
                            👁️
                        </button>
                        <button type="button" class="btn-action" style="background:#f59e0b; color:#fff;" onclick="openUpdatePaymentStatusModal(${payment.paymentId}, '${payment.paymentStatus}')">
                            ⚙️ Status
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// --- Make Payment Modal (Buyer) ---

async function openMakePaymentModal(orderId, totalAmount, cropName) {
    const token = getAuthToken();
    if (!token) return;

    document.getElementById('payment-order-id').value = orderId;
    const alertEl = document.getElementById('make-payment-alert');
    if (alertEl) alertEl.classList.add('hidden');

    try {
        const res = await fetch(`${BUYER_PAYMENTS_ENDPOINT}/order/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (res.ok) {
            const json = await res.json();
            const summary = json.data;
            document.getElementById('payment-order-total-val').textContent = `₹${parseFloat(summary.orderTotal).toFixed(2)}`;
            document.getElementById('payment-already-paid-val').textContent = `₹${parseFloat(summary.totalPaid).toFixed(2)}`;

            const remEl = document.getElementById('payment-remaining-bal-val');
            remEl.textContent = `₹${parseFloat(summary.remainingBalance).toFixed(2)}`;
            if (summary.remainingBalance <= 0) {
                remEl.className = 'payment-stat-value balance-zero';
            } else {
                remEl.className = 'payment-stat-value balance-due';
            }

            const amountInput = document.getElementById('payment-amount-input');
            amountInput.value = summary.remainingBalance > 0 ? summary.remainingBalance.toFixed(2) : '0.00';
            amountInput.max = summary.remainingBalance > 0 ? summary.remainingBalance : '0';
        } else {
            document.getElementById('payment-order-total-val').textContent = `₹${parseFloat(totalAmount).toFixed(2)}`;
            document.getElementById('payment-already-paid-val').textContent = `₹0.00`;
            document.getElementById('payment-remaining-bal-val').textContent = `₹${parseFloat(totalAmount).toFixed(2)}`;
            document.getElementById('payment-amount-input').value = parseFloat(totalAmount).toFixed(2);
        }
    } catch (err) {
        console.error('Failed to load order payment summary:', err);
    }

    const modal = document.getElementById('make-payment-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeMakePaymentModal() {
    const modal = document.getElementById('make-payment-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('make-payment-form');
    if (form) form.reset();
}

async function handleMakePaymentSubmit(event) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const orderId = parseInt(document.getElementById('payment-order-id').value, 10);
    const amountVal = parseFloat(document.getElementById('payment-amount-input').value);
    const method = document.getElementById('payment-method-select').value;
    const txnRef = document.getElementById('payment-txn-ref-input').value.trim();
    const remarks = document.getElementById('payment-remarks-input').value.trim();

    const alertEl = document.getElementById('make-payment-alert');
    if (isNaN(amountVal) || amountVal <= 0) {
        if (alertEl) {
            alertEl.textContent = 'Please enter a valid payment amount greater than zero.';
            alertEl.className = 'auth-alert auth-alert-error';
            alertEl.classList.remove('hidden');
        }
        return;
    }

    const spinner = document.getElementById('make-payment-spinner');
    const btnText = document.getElementById('make-payment-text');
    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Processing Payment...';

    const payload = {
        orderId: orderId,
        amount: amountVal,
        paymentMethod: method,
        transactionReference: txnRef || null,
        remarks: remarks || null
    };

    try {
        const response = await fetch(BUYER_PAYMENTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            closeMakePaymentModal();
            await loadBuyerPayments();
            await loadBuyerOrders();
            await loadBuyerDeliveries();
            showBuyerPaymentAlert(`Payment of ₹${amountVal.toFixed(2)} recorded successfully!`, 'success');
        } else {
            if (alertEl) {
                alertEl.textContent = result.message || 'Payment submission failed.';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Error submitting payment:', err);
        if (alertEl) {
            alertEl.textContent = 'Network error while recording payment.';
            alertEl.className = 'auth-alert auth-alert-error';
            alertEl.classList.remove('hidden');
        }
    } finally {
        if (spinner) spinner.classList.add('hidden');
        if (btnText) btnText.textContent = 'Submit Payment';
    }
}

// --- Payment Details Modal ---

async function openPaymentDetailsModal(paymentId, role = 'BUYER') {
    const token = getAuthToken();
    if (!token) return;

    let endpoint = `${BUYER_PAYMENTS_ENDPOINT}/${paymentId}`;
    if (role === 'FARMER') endpoint = `${FARMER_PAYMENTS_ENDPOINT}/${paymentId}`;
    else if (role === 'ADMIN') endpoint = `${ADMIN_PAYMENTS_ENDPOINT}/${paymentId}`;

    try {
        const res = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        if (res.ok) {
            const json = await res.json();
            const p = json.data;

            document.getElementById('pd-payment-id').textContent = `#PAY-${p.paymentId}`;
            document.getElementById('pd-order-id').textContent = p.orderId;
            document.getElementById('pd-crop-details').textContent = `${p.cropName || 'Crop'} (${p.orderQuantity || '--'} kg)`;
            document.getElementById('pd-farmer-name').textContent = `${p.farmerName || 'Farmer'} (${p.farmerPhone || 'N/A'})`;
            document.getElementById('pd-buyer-name').textContent = `${p.buyerName || 'Buyer'} (${p.buyerPhone || 'N/A'})`;
            document.getElementById('pd-amount').textContent = `₹${parseFloat(p.amount).toFixed(2)}`;
            document.getElementById('pd-method').textContent = p.paymentMethod;
            document.getElementById('pd-txn-ref').textContent = p.transactionReference || '--';
            document.getElementById('pd-date').textContent = p.paymentDate ? formatOrderDateTime(p.paymentDate) : '--';
            document.getElementById('pd-remarks').textContent = p.remarks || 'None';
            document.getElementById('pd-status-badge').innerHTML = getPaymentStatusPill(p.paymentStatus);

            const modal = document.getElementById('payment-details-modal');
            if (modal) modal.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Failed to load payment details:', err);
    }
}

function closePaymentDetailsModal() {
    const modal = document.getElementById('payment-details-modal');
    if (modal) modal.classList.add('hidden');
}

// --- Admin Update Payment Status Modal ---

function openUpdatePaymentStatusModal(paymentId, currentStatus) {
    document.getElementById('admin-update-payment-id').value = paymentId;
    document.getElementById('admin-ctx-payment-ref').textContent = `Payment #PAY-${paymentId}`;
    document.getElementById('admin-ctx-payment-status').textContent = currentStatus;

    const select = document.getElementById('admin-payment-target-status');
    if (select) {
        select.value = currentStatus === 'COMPLETED' ? 'REFUNDED' : 'COMPLETED';
    }

    const alertEl = document.getElementById('admin-payment-status-alert');
    if (alertEl) alertEl.classList.add('hidden');

    const modal = document.getElementById('admin-payment-status-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeUpdatePaymentStatusModal() {
    const modal = document.getElementById('admin-payment-status-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('admin-payment-status-form');
    if (form) form.reset();
}

async function handleUpdatePaymentStatusSubmit(event) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const paymentId = parseInt(document.getElementById('admin-update-payment-id').value, 10);
    const targetStatus = document.getElementById('admin-payment-target-status').value;
    const remarks = document.getElementById('admin-payment-remarks-input').value.trim();

    const spinner = document.getElementById('admin-payment-status-spinner');
    const btnText = document.getElementById('admin-payment-status-text');
    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Saving...';

    const alertEl = document.getElementById('admin-payment-status-alert');

    try {
        const response = await fetch(`${ADMIN_PAYMENTS_ENDPOINT}/${paymentId}/status?status=${targetStatus}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                paymentStatus: targetStatus,
                remarks: remarks || null
            })
        });

        const result = await response.json();

        if (response.ok) {
            closeUpdatePaymentStatusModal();
            await loadAdminPayments();
            await loadAdminOrders();
            showAdminPaymentAlert(`Payment #PAY-${paymentId} status transitioned to ${targetStatus}.`, 'success');
        } else {
            if (alertEl) {
                alertEl.textContent = result.message || 'Failed to update payment status.';
                alertEl.className = 'auth-alert auth-alert-error';
                alertEl.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Failed to update payment status:', err);
        if (alertEl) {
            alertEl.textContent = 'Network error while updating payment status.';
            alertEl.className = 'auth-alert auth-alert-error';
            alertEl.classList.remove('hidden');
        }
    } finally {
        if (spinner) spinner.classList.add('hidden');
        if (btnText) btnText.textContent = 'Save Status';
    }
}

// -------------------------------------------------------------------
// 6. Phase 8 & Phase 9 DOM Event Listeners & Binding
// -------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Live calculation on Place Order quantity input
    const orderQtyInput = document.getElementById('order-quantity-input');
    if (orderQtyInput) {
        orderQtyInput.addEventListener('input', updateOrderLivePreview);
        orderQtyInput.addEventListener('change', updateOrderLivePreview);
    }

    // 2. Place Order Form Submit
    const placeOrderForm = document.getElementById('place-order-form');
    if (placeOrderForm) {
        placeOrderForm.addEventListener('submit', handlePlaceOrderSubmit);
    }

    // 3. Place Order Modal Close Buttons
    const closePlaceOrderBtn = document.getElementById('close-place-order-btn');
    const cancelPlaceOrderBtn = document.getElementById('cancel-place-order-btn');
    if (closePlaceOrderBtn) closePlaceOrderBtn.addEventListener('click', closePlaceOrderModal);
    if (cancelPlaceOrderBtn) cancelPlaceOrderBtn.addEventListener('click', closePlaceOrderModal);

    // 4. Order Details Modal Close Buttons
    const closeOrderDetailBtn = document.getElementById('close-order-detail-btn');
    const closeOrderDetailFooterBtn = document.getElementById('close-order-detail-footer-btn');
    if (closeOrderDetailBtn) closeOrderDetailBtn.addEventListener('click', closeOrderDetailsModal);
    if (closeOrderDetailFooterBtn) closeOrderDetailFooterBtn.addEventListener('click', closeOrderDetailsModal);

    // 5. Cancel Order Modal Submit & Close
    const cancelOrderForm = document.getElementById('cancel-order-form');
    if (cancelOrderForm) cancelOrderForm.addEventListener('submit', handleCancelOrderSubmit);

    const closeCancelOrderBtn = document.getElementById('close-cancel-order-btn');
    const dismissCancelOrderBtn = document.getElementById('dismiss-cancel-order-btn');
    if (closeCancelOrderBtn) closeCancelOrderBtn.addEventListener('click', closeCancelOrderModal);
    if (dismissCancelOrderBtn) dismissCancelOrderBtn.addEventListener('click', closeCancelOrderModal);

    // 6. Reject Order Modal Submit & Close
    const rejectOrderForm = document.getElementById('reject-order-form');
    if (rejectOrderForm) rejectOrderForm.addEventListener('submit', handleRejectOrderSubmit);

    const closeRejectOrderBtn = document.getElementById('close-reject-order-btn');
    const dismissRejectOrderBtn = document.getElementById('dismiss-reject-order-btn');
    if (closeRejectOrderBtn) closeRejectOrderBtn.addEventListener('click', closeRejectOrderModal);
    if (dismissRejectOrderBtn) dismissRejectOrderBtn.addEventListener('click', closeRejectOrderModal);

    // 7. Refresh Order Buttons
    const refreshBuyerOrdersBtn = document.getElementById('refresh-buyer-orders-btn');
    if (refreshBuyerOrdersBtn) {
        refreshBuyerOrdersBtn.addEventListener('click', async () => {
            await loadBuyerOrders();
            showBuyerOrderAlert('Purchase orders list refreshed.', 'success');
        });
    }

    const refreshFarmerOrdersBtn = document.getElementById('refresh-farmer-orders-btn');
    if (refreshFarmerOrdersBtn) {
        refreshFarmerOrdersBtn.addEventListener('click', async () => {
            await loadFarmerOrders();
            showFarmerOrderAlert('Incoming orders list refreshed.', 'success');
        });
    }

    const refreshAdminOrdersBtn = document.getElementById('refresh-admin-orders-btn');
    if (refreshAdminOrdersBtn) {
        refreshAdminOrdersBtn.addEventListener('click', async () => {
            await loadAdminOrders();
            const el = document.getElementById('admin-orders-alert');
            if (el) {
                el.textContent = 'Marketplace orders refreshed.';
                el.className = 'auth-alert auth-alert-success';
                el.classList.remove('hidden');
                setTimeout(() => el.classList.add('hidden'), 4000);
            }
        });
    }

    // 8. Order Filter Tabs
    document.querySelectorAll('.buyer-order-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.buyer-order-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeBuyerOrderFilter = tab.getAttribute('data-filter') || 'ALL';
            renderBuyerOrdersTable();
        });
    });

    document.querySelectorAll('.farmer-order-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.farmer-order-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFarmerOrderFilter = tab.getAttribute('data-filter') || 'ALL';
            renderFarmerOrdersTable();
        });
    });

    document.querySelectorAll('.admin-order-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-order-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAdminOrderFilter = tab.getAttribute('data-filter') || 'ALL';
            renderAdminOrdersTable();
        });
    });

    // 9. Phase 9: Create Delivery Modal Handlers
    const createDeliveryForm = document.getElementById('create-delivery-form');
    if (createDeliveryForm) createDeliveryForm.addEventListener('submit', handleCreateDeliverySubmit);

    const closeCreateDeliveryModalBtn = document.getElementById('close-create-delivery-modal-btn');
    const dismissCreateDeliveryBtn = document.getElementById('dismiss-create-delivery-btn');
    if (closeCreateDeliveryModalBtn) closeCreateDeliveryModalBtn.addEventListener('click', closeCreateDeliveryModal);
    if (dismissCreateDeliveryBtn) dismissCreateDeliveryBtn.addEventListener('click', closeCreateDeliveryModal);

    // 10. Phase 9: Ship Delivery Modal Handlers
    const shipDeliveryForm = document.getElementById('ship-delivery-form');
    if (shipDeliveryForm) shipDeliveryForm.addEventListener('submit', handleShipDeliverySubmit);

    const closeShipDeliveryModalBtn = document.getElementById('close-ship-delivery-modal-btn');
    const dismissShipDeliveryBtn = document.getElementById('dismiss-ship-delivery-btn');
    if (closeShipDeliveryModalBtn) closeShipDeliveryModalBtn.addEventListener('click', closeShipDeliveryModal);
    if (dismissShipDeliveryBtn) dismissShipDeliveryBtn.addEventListener('click', closeShipDeliveryModal);

    // 11. Phase 9: Delivery Details Modal Handlers
    const closeDeliveryDetailsModalBtn = document.getElementById('close-delivery-details-modal-btn');
    const closeDeliveryDetailsBtn = document.getElementById('close-delivery-details-btn');
    if (closeDeliveryDetailsModalBtn) closeDeliveryDetailsModalBtn.addEventListener('click', closeDeliveryDetailsModal);
    if (closeDeliveryDetailsBtn) closeDeliveryDetailsBtn.addEventListener('click', closeDeliveryDetailsModal);

    // 12. Phase 9: Refresh Delivery Buttons
    const refreshFarmerDeliveriesBtn = document.getElementById('refresh-farmer-deliveries-btn');
    if (refreshFarmerDeliveriesBtn) {
        refreshFarmerDeliveriesBtn.addEventListener('click', async () => {
            await loadFarmerDeliveries();
            showFarmerDeliveryAlert('Outgoing deliveries refreshed.', 'success');
        });
    }

    const refreshBuyerDeliveriesBtn = document.getElementById('refresh-buyer-deliveries-btn');
    if (refreshBuyerDeliveriesBtn) {
        refreshBuyerDeliveriesBtn.addEventListener('click', async () => {
            await loadBuyerDeliveries();
            showBuyerDeliveryAlert('Inbound deliveries refreshed.', 'success');
        });
    }

    const refreshAdminDeliveriesBtn = document.getElementById('refresh-admin-deliveries-btn');
    if (refreshAdminDeliveriesBtn) {
        refreshAdminDeliveriesBtn.addEventListener('click', async () => {
            await loadAdminDeliveries();
            const el = document.getElementById('admin-deliveries-alert');
            if (el) {
                el.textContent = 'Deliveries refreshed.';
                el.className = 'auth-alert auth-alert-success';
                el.classList.remove('hidden');
                setTimeout(() => el.classList.add('hidden'), 4000);
            }
        });
    }

    // 13. Phase 9: Delivery Filter Tabs
    document.querySelectorAll('.farmer-delivery-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.farmer-delivery-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFarmerDeliveryFilter = tab.getAttribute('data-filter') || 'ALL';
            renderFarmerDeliveriesTable();
        });
    });

    document.querySelectorAll('.buyer-delivery-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.buyer-delivery-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeBuyerDeliveryFilter = tab.getAttribute('data-filter') || 'ALL';
            renderBuyerDeliveriesTable();
        });
    });

    document.querySelectorAll('.admin-delivery-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-delivery-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAdminDeliveryFilter = tab.getAttribute('data-filter') || 'ALL';
            renderAdminDeliveriesTable();
        });
    });

    // 14. Phase 10: Make Payment Modal Handlers
    const makePaymentForm = document.getElementById('make-payment-form');
    if (makePaymentForm) makePaymentForm.addEventListener('submit', handleMakePaymentSubmit);

    const closeMakePaymentModalBtn = document.getElementById('close-make-payment-modal-btn');
    const dismissMakePaymentBtn = document.getElementById('dismiss-make-payment-btn');
    if (closeMakePaymentModalBtn) closeMakePaymentModalBtn.addEventListener('click', closeMakePaymentModal);
    if (dismissMakePaymentBtn) dismissMakePaymentBtn.addEventListener('click', closeMakePaymentModal);

    // 15. Phase 10: Payment Details Modal Handlers
    const closePaymentDetailsModalBtn = document.getElementById('close-payment-details-modal-btn');
    const closePaymentDetailsBtn = document.getElementById('close-payment-details-btn');
    if (closePaymentDetailsModalBtn) closePaymentDetailsModalBtn.addEventListener('click', closePaymentDetailsModal);
    if (closePaymentDetailsBtn) closePaymentDetailsBtn.addEventListener('click', closePaymentDetailsModal);

    // 16. Phase 10: Admin Update Payment Status Modal Handlers
    const adminPaymentStatusForm = document.getElementById('admin-payment-status-form');
    if (adminPaymentStatusForm) adminPaymentStatusForm.addEventListener('submit', handleUpdatePaymentStatusSubmit);

    const closeAdminPaymentStatusModalBtn = document.getElementById('close-admin-payment-status-modal-btn');
    const dismissAdminPaymentStatusBtn = document.getElementById('dismiss-admin-payment-status-btn');
    if (closeAdminPaymentStatusModalBtn) closeAdminPaymentStatusModalBtn.addEventListener('click', closeUpdatePaymentStatusModal);
    if (dismissAdminPaymentStatusBtn) dismissAdminPaymentStatusBtn.addEventListener('click', closeUpdatePaymentStatusModal);

    // 17. Phase 10: Refresh Payment Buttons
    const refreshFarmerPaymentsBtn = document.getElementById('refresh-farmer-payments-btn');
    if (refreshFarmerPaymentsBtn) {
        refreshFarmerPaymentsBtn.addEventListener('click', async () => {
            await loadFarmerPayments();
            showFarmerPaymentAlert('Received payments list refreshed.', 'success');
        });
    }

    const refreshBuyerPaymentsBtn = document.getElementById('refresh-buyer-payments-btn');
    if (refreshBuyerPaymentsBtn) {
        refreshBuyerPaymentsBtn.addEventListener('click', async () => {
            await loadBuyerPayments();
            showBuyerPaymentAlert('Payment history refreshed.', 'success');
        });
    }

    const refreshAdminPaymentsBtn = document.getElementById('refresh-admin-payments-btn');
    if (refreshAdminPaymentsBtn) {
        refreshAdminPaymentsBtn.addEventListener('click', async () => {
            await loadAdminPayments();
            showAdminPaymentAlert('Global payments refreshed.', 'success');
        });
    }

    // 18. Phase 10: Payment Filter Tabs
    document.querySelectorAll('.farmer-payment-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.farmer-payment-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFarmerPaymentFilter = tab.getAttribute('data-filter') || 'ALL';
            renderFarmerPaymentsTable();
        });
    });

    document.querySelectorAll('.buyer-payment-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.buyer-payment-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeBuyerPaymentFilter = tab.getAttribute('data-filter') || 'ALL';
            renderBuyerPaymentsTable();
        });
    });

    document.querySelectorAll('.admin-payment-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-payment-filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeAdminPaymentFilter = tab.getAttribute('data-filter') || 'ALL';
            renderAdminPaymentsTable();
        });
    });

    // 19. Phase 11: Price History & Analytics Event Listeners
    const refreshFarmerPhBtn = document.getElementById('refresh-farmer-price-history-btn');
    if (refreshFarmerPhBtn) {
        refreshFarmerPhBtn.addEventListener('click', async () => {
            await loadFarmerPriceHistory();
            showFarmerPriceHistoryAlert('Farmer sales price history refreshed.', 'success');
        });
    }

    const farmerPhFilterBtn = document.getElementById('farmer-ph-filter-btn');
    if (farmerPhFilterBtn) {
        farmerPhFilterBtn.addEventListener('click', async () => {
            await loadFarmerPriceHistory();
        });
    }

    const farmerPhResetBtn = document.getElementById('farmer-ph-reset-btn');
    if (farmerPhResetBtn) {
        farmerPhResetBtn.addEventListener('click', async () => {
            const cropFilter = document.getElementById('farmer-ph-crop-filter');
            const startDate = document.getElementById('farmer-ph-start-date');
            const endDate = document.getElementById('farmer-ph-end-date');
            if (cropFilter) cropFilter.value = '';
            if (startDate) startDate.value = '';
            if (endDate) endDate.value = '';
            await loadFarmerPriceHistory();
        });
    }

    const refreshBuyerPhBtn = document.getElementById('refresh-buyer-price-history-btn');
    if (refreshBuyerPhBtn) {
        refreshBuyerPhBtn.addEventListener('click', async () => {
            await loadBuyerPriceHistory();
            showBuyerPriceHistoryAlert('Market price intelligence refreshed.', 'success');
        });
    }

    const buyerPhCropSelect = document.getElementById('buyer-ph-crop-select');
    if (buyerPhCropSelect) {
        buyerPhCropSelect.addEventListener('change', async () => {
            await loadBuyerPriceHistory();
        });
    }

    const buyerPhFilterBtn = document.getElementById('buyer-ph-filter-btn');
    if (buyerPhFilterBtn) {
        buyerPhFilterBtn.addEventListener('click', async () => {
            await loadBuyerPriceHistory();
        });
    }

    const buyerPhResetBtn = document.getElementById('buyer-ph-reset-btn');
    if (buyerPhResetBtn) {
        buyerPhResetBtn.addEventListener('click', async () => {
            const cropSelect = document.getElementById('buyer-ph-crop-select');
            const startDate = document.getElementById('buyer-ph-start-date');
            const endDate = document.getElementById('buyer-ph-end-date');
            if (cropSelect) cropSelect.value = '';
            if (startDate) startDate.value = '';
            if (endDate) endDate.value = '';
            await loadBuyerPriceHistory();
        });
    }

    const refreshAdminPhBtn = document.getElementById('refresh-admin-price-history-btn');
    if (refreshAdminPhBtn) {
        refreshAdminPhBtn.addEventListener('click', async () => {
            await loadAdminPriceHistory();
            showAdminPriceHistoryAlert('Marketplace price history & summary refreshed.', 'success');
        });
    }

    const adminPhFilterBtn = document.getElementById('admin-ph-filter-btn');
    if (adminPhFilterBtn) {
        adminPhFilterBtn.addEventListener('click', async () => {
            await loadAdminPriceHistory();
        });
    }

    const adminPhResetBtn = document.getElementById('admin-ph-reset-btn');
    if (adminPhResetBtn) {
        adminPhResetBtn.addEventListener('click', async () => {
            const cropFilter = document.getElementById('admin-ph-crop-filter');
            const sourceFilter = document.getElementById('admin-ph-source-filter');
            const startDate = document.getElementById('admin-ph-start-date');
            const endDate = document.getElementById('admin-ph-end-date');
            if (cropFilter) cropFilter.value = '';
            if (sourceFilter) sourceFilter.value = '';
            if (startDate) startDate.value = '';
            if (endDate) endDate.value = '';
            await loadAdminPriceHistory();
        });
    }
});
