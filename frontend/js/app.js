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

const TOKEN_STORAGE_KEY = 'agriconnect_jwt_token';

// State
let currentUser = null;
let allCrops = [];
let farmerHarvests = [];
let activeHarvestFilter = 'ALL';
let adminQualityLots = [];
let activeAdminQualityFilter = 'PENDING';

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
                    <button type="button" class="btn btn-secondary btn-sm" onclick="openMatchQualityModal(${m.harvestId})">
                        🔬 View Quality Inspection
                    </button>
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

