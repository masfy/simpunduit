/* --- CONFIG --- */
const API_URL = import.meta.env.VITE_API_URL || "https://script.google.com/macros/s/AKfycbyFiCLejOurFuyvsO_cku7LkHy6ZHXaO3BR-KQCNsFMZOnmMRVl5V_dlvs3aExt3MHVtg/exec";

/* --- STATE & MOCK DATA --- */
let mockData = {
    trx: [],
    cats: [
        { id: 'C1', name: 'Makan', type: 'Pengeluaran' },
        { id: 'C2', name: 'Transport', type: 'Pengeluaran' },
        { id: 'C3', name: 'Gaji', type: 'Pemasukan' }
    ],
    profile: { name: 'User Simulasi', status: 'Mode Preview', photo: '' }
};
let appState = { trx: [], cats: [], profile: {} };
let activeCatTab = 'Pengeluaran';
let myChart = null;
let tempPhotoBase64 = '';

/* --- INIT --- */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('trxDate').valueAsDate = new Date();
    loadData();
    
    // Attach event listeners
    document.getElementById('dashboardFilter').addEventListener('change', renderDashboard);
    document.getElementById('trxForm').addEventListener('submit', handleTrxSubmit);
    document.getElementById('filePhoto').addEventListener('change', function() { handlePhotoUpload(this); });
    document.querySelector('form[onsubmit="handleProfileUpdate(event)"]').addEventListener('submit', handleProfileUpdate);
    
    // Navigation
    document.getElementById('nav-dashboard').addEventListener('click', () => navTo('dashboard'));
    document.getElementById('nav-history').addEventListener('click', () => navTo('history'));
    document.querySelector('.btn-add-main').parentElement.addEventListener('click', () => navTo('add'));
    document.getElementById('nav-categories').addEventListener('click', () => navTo('categories'));
    document.getElementById('nav-profile').addEventListener('click', () => navTo('profile'));

    // Tabs
    document.getElementById('tabExp').addEventListener('click', () => switchCatTab('Pengeluaran'));
    document.getElementById('tabInc').addEventListener('click', () => switchCatTab('Pemasukan'));

    // Category Add
    document.querySelector('.input-group button').addEventListener('click', handleAddCategory);
    
    // Radio buttons
    document.getElementById('typeExp').addEventListener('change', loadCategoryOptions);
    document.getElementById('typeInc').addEventListener('change', loadCategoryOptions);

    // Search
    document.querySelector('input[placeholder*="Cari transaksi"]').addEventListener('keyup', (e) => filterHistory(e.target.value));
});

async function loadData() {
    try {
        // Try fetching from API
        const [cats, trx, prof] = await Promise.all([
            fetch(`${API_URL}?action=getCategories`).then(res => res.json()),
            fetch(`${API_URL}?action=getTransactions`).then(res => res.json()),
            fetch(`${API_URL}?action=getProfile`).then(res => res.json())
        ]);

        appState.cats = cats;
        appState.trx = trx;
        appState.profile = prof;
        finishLoad();
    } catch (error) {
        console.warn("Backend connection failed, using mock data.", error);
        // Fallback to mock data
        appState.cats = mockData.cats;
        appState.profile = mockData.profile;
        appState.trx = mockData.trx;
        finishLoad();

        // Optional: Notify user
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        Toast.fire({
            icon: 'warning',
            title: 'Mode Offline / Simulasi'
        });
    }
}

function finishLoad() {
    // Hide Custom Loader
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
    renderUI();
}

function renderUI() {
    renderDashboard();
    renderHistory();
    renderCategories(); // Logic tab ada di sini
    updateProfileUI();
    loadCategoryOptions(); // Form add trx
}

/* --- NAVIGATION --- */
function navTo(page) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const nav = document.getElementById('nav-' + page);
    if (nav) nav.classList.add('active');

    // Re-render specific logic
    if (page === 'dashboard') renderDashboard();
    if (page === 'categories') renderCategories();
}

/* --- CATEGORY LOGIC (UPDATED) --- */
function switchCatTab(type) {
    activeCatTab = type;
    // Update Tab UI
    const tabExp = document.getElementById('tabExp');
    const tabInc = document.getElementById('tabInc');

    if (type === 'Pengeluaran') {
        tabExp.className = 'cat-tab active-exp';
        tabInc.className = 'cat-tab';
    } else {
        tabExp.className = 'cat-tab';
        tabInc.className = 'cat-tab active-inc';
    }
    renderCategories();
}

function renderCategories() {
    const list = document.getElementById('categoryListSettings');
    list.innerHTML = '';

    // Filter by Active Tab
    const filtered = appState.cats.filter(c => c.type === activeCatTab);

    if (filtered.length === 0) list.innerHTML = '<li class="list-group-item text-center text-muted py-4">Belum ada kategori.</li>';

    filtered.forEach(c => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center bg-white';
        li.innerHTML = `
            <span class="fw-bold text-dark">${c.name}</span>
            <button class="btn btn-light btn-sm text-danger rounded-circle" data-id="${c.id}"><i class="fas fa-trash"></i></button>
        `;
        // Add delete listener
        li.querySelector('button').addEventListener('click', () => deleteCat(c.id));
        list.appendChild(li);
    });
}

async function handleAddCategory() {
    const name = document.getElementById('newCatName').value.trim();
    if (!name) return;

    // CLIENT SIDE DUPLICATE CHECK
    const exists = appState.cats.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === activeCatTab);
    if (exists) {
        Swal.fire('Gagal', `Kategori "${name}" sudah ada di ${activeCatTab}!`, 'error');
        return;
    }

    const newCat = { name, type: activeCatTab };

    // Optimistic UI Update
    const tempId = Date.now().toString();
    appState.cats.push({ ...newCat, id: tempId });
    document.getElementById('newCatName').value = '';
    renderCategories();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveCategory', data: newCat })
        }).then(r => r.json());

        if (res.success) {
            loadData(); // Reload to sync real ID
        } else {
            throw new Error(res.message || 'Unknown error');
        }
    } catch (e) {
        console.error(e);
        // Revert
        appState.cats = appState.cats.filter(c => c.id !== tempId);
        renderCategories();
        Swal.fire('Error', 'Gagal menyimpan kategori', 'error');
    }
}

async function deleteCat(id) {
    if (!confirm('Hapus kategori ini?')) return;

    // Optimistic
    const backup = [...appState.cats];
    appState.cats = appState.cats.filter(c => c.id != id);
    renderCategories();

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteCategory', id: id })
        }).then(r => r.json());

        if (res.success) {
            loadData();
        } else {
            throw new Error(res.message);
        }
    } catch (e) {
        console.error(e);
        appState.cats = backup;
        renderCategories();
        Swal.fire('Error', 'Gagal menghapus kategori', 'error');
    }
}

/* --- PROFILE PHOTO LOGIC --- */
function handlePhotoUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Resize logic using Canvas
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Resize to max 150px
                const MAX_SIZE = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                } else {
                    if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Compress
                tempPhotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
                document.getElementById('profileImgBig').src = tempPhotoBase64; // Preview
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function updateProfileUI() {
    const p = appState.profile;
    // Avatar Logic
    let imgUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=6C63FF&color=fff`;
    if (p.photo && p.photo.startsWith('data:image')) imgUrl = p.photo;

    document.getElementById('miniProfileImg').src = imgUrl;
    document.getElementById('profileImgBig').src = imgUrl;

    document.getElementById('profileNameDisplay').innerText = p.name || 'User';
    document.getElementById('profileStatusDisplay').innerText = p.status || 'Status';

    // Set Form Values
    document.getElementById('editName').value = p.name || '';
    document.getElementById('editStatus').value = p.status || '';
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveProfile');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Menyimpan...';
    btn.disabled = true;

    const newData = {
        name: document.getElementById('editName').value,
        status: document.getElementById('editStatus').value,
        photo: tempPhotoBase64 // Will be empty string if not changed
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'updateProfile', data: newData })
        }).then(r => r.json());

        if (res.success) {
            tempPhotoBase64 = ''; // Clear temp
            loadData(); // Sync
            Swal.fire('Sukses', 'Profil berhasil disimpan!', 'success');
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Gagal update profil', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/* --- DASHBOARD & TRANSACTION (Standard) --- */
function loadCategoryOptions() {
    const type = document.querySelector('input[name="type"]:checked').value;
    const select = document.getElementById('trxCategory');
    select.innerHTML = '';
    appState.cats.filter(c => c.type === type).forEach(c => {
        select.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
}

function renderDashboard() {
    const filter = document.getElementById('dashboardFilter').value;
    // Simple logic for brevity, expands nicely
    let inc = 0, exp = 0;
    const catTotals = {};

    appState.trx.forEach(t => {
        // Should add Date Filtering logic here (same as v2)
        if (t.type === 'Pemasukan') inc += Number(t.amount);
        else {
            exp += Number(t.amount);
            catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
        }
    });

    document.getElementById('totalIncome').innerText = `Rp ${inc.toLocaleString()}`;
    document.getElementById('totalExpense').innerText = `Rp ${exp.toLocaleString()}`;
    document.getElementById('totalBalance').innerText = `Rp ${(inc - exp).toLocaleString()}`;

    renderChart(catTotals);
}

function renderChart(dataObj) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(dataObj),
            datasets: [{
                data: Object.values(dataObj),
                backgroundColor: ['#6C63FF', '#FF6584', '#00B894', '#FDCB6E', '#0984e3', '#e17055'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: 'Plus Jakarta Sans', size: 12 },
                        boxWidth: 10
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#2D3436',
                    bodyColor: '#2D3436',
                    borderColor: 'rgba(0,0,0,0.05)',
                    borderWidth: 1,
                    padding: 12,
                    bodyFont: { family: 'Plus Jakarta Sans', size: 13 },
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            },
            onClick: (e, activeElements) => {
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const category = myChart.data.labels[index];

                    // Interaction: Filter History
                    const searchInput = document.querySelector('input[placeholder*="Cari transaksi"]');
                    if (searchInput) {
                        searchInput.value = category;
                        filterHistory(category);

                        // Scroll to history
                        document.getElementById('page-history').scrollIntoView({ behavior: 'smooth' });

                        Swal.fire({
                            toast: true,
                            position: 'top',
                            icon: 'info',
                            title: `Filter: ${category}`,
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }
                }
            }
        }
    });
}

async function handleTrxSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveTrx');
    btn.disabled = true;
    btn.innerText = 'Menyimpan...';

    const data = {
        date: document.getElementById('trxDate').value,
        type: document.querySelector('input[name="type"]:checked').value,
        category: document.getElementById('trxCategory').value,
        amount: document.getElementById('trxAmount').value,
        note: document.getElementById('trxNote').value
    };

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'addTransaction', data: data })
        }).then(r => r.json());

        if (res.success) {
            loadData();
            resetForm(btn);
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Gagal menyimpan transaksi', 'error');
        btn.disabled = false;
        btn.innerText = 'SIMPAN';
    }
}

function resetForm(btn) {
    btn.disabled = false;
    btn.innerText = 'SIMPAN';
    document.getElementById('trxForm').reset();
    document.getElementById('trxDate').valueAsDate = new Date();
    Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1000, showConfirmButton: false });
    navTo('dashboard');
}

function filterHistory(keyword) {
    const lower = keyword.toLowerCase();
    const filtered = appState.trx.filter(t =>
        t.category.toLowerCase().includes(lower) ||
        (t.note && t.note.toLowerCase().includes(lower))
    );
    renderHistoryList(filtered);
}

function renderHistory() {
    renderHistoryList(appState.trx);
}

function renderHistoryList(data) {
    const div = document.getElementById('fullHistoryList');
    div.innerHTML = data.map(t => {
        const isExp = t.type === 'Pengeluaran';
        return `
        <div class="d-flex justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm mb-2">
            <div class="d-flex align-items-center">
                <div class="rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style="width:40px; height:40px; background:${isExp ? '#fff0f0' : '#f0fff4'}; color:${isExp ? '#e74a3b' : '#00b894'}">
                    <i class="fas ${isExp ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div>
                    <div class="fw-bold text-dark">${t.category}</div>
                    <small class="text-muted" style="font-size:0.75rem">${t.date.substring(0, 10)}</small>
                </div>
            </div>
            <div class="fw-bold ${isExp ? 'text-danger' : 'text-success'}">
                ${isExp ? '-' : '+'} ${Number(t.amount).toLocaleString()}
            </div>
        </div>`;
    }).join('');
}
