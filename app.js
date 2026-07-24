// ==========================================================================
// HOTEL BOOKING DEMAND - BUSINESS INTELLIGENCE DASHBOARD LOGIC (app.js)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDataset();
    initCharts();
    initPredictionForm();
    initExportCSV();
    initModalEvents();
});

// Global State
let bookingData = [];
let currentPage = 1;
const pageSize = 10;

// Tab Navigation Logic
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const pageMeta = {
        dashboard: { title: "Dashboard Utama Business Intelligence", subtitle: "Ringkasan Performa Reservasi Hotel & Analisis Data" },
        bookings: { title: "Data Pelanggan & Transaksi Booking", subtitle: "Manajemen Data Reservasi Hotel Operasional (OLTP)" },
        rooms: { title: "Data Ruangan & Tipe Kamar", subtitle: "Analisis Alokasi, Kategori, dan Revenue Per Tipe Kamar" },
        prediction: { title: "Data Mining - Prediksi Pembatalan", subtitle: "Evaluator Decision Tree Risiko Pembatalan Reservasi" },
        clustering: { title: "Clustering & Segmentasi Tamu", subtitle: "Pengelompokan Tamu Berdasarkan K-Means Algorithm" },
        reports: { title: "Reporting Services (SSRS Generator)", subtitle: "Laporan Cetak & Ekspor Metrik Kinerja Hotel" }
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            if (pageMeta[targetTab]) {
                pageTitle.textContent = pageMeta[targetTab].title;
                pageSubtitle.textContent = pageMeta[targetTab].subtitle;
            }
        });
    });
}

// Generate Realistic Sample Data matching data_booking_hotel_17000.csv
function initDataset() {
    const countries = ['PRT', 'GBR', 'ESP', 'FRA', 'DEU', 'ITA', 'IRL', 'USA', 'BRA', 'BEL'];
    const segments = ['Online TA', 'Offline TA/TO', 'Direct', 'Corporate', 'Groups'];
    const channels = ['TA/TO', 'Direct', 'Corporate', 'GDS'];
    const customerTypes = ['Transient', 'Contract', 'Group', 'Transient-Party'];
    const roomTypes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const deposits = ['No Deposit', 'Non Refund', 'Refundable'];
    const meals = ['BB (Bed & Breakfast)', 'HB (Half Board)', 'FB (Full Board)', 'SC (Self Catering)'];

    for (let i = 1; i <= 100; i++) {
        const hotel = (i % 2 === 0) ? 'Resort Hotel' : 'City Hotel';
        const isCanceled = (Math.random() < 0.37) ? 1 : 0;
        const leadTime = Math.floor(Math.random() * 300) + 5;
        const country = countries[Math.floor(Math.random() * countries.length)];
        const segment = segments[Math.floor(Math.random() * segments.length)];
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)];
        const reservedRoom = roomTypes[Math.floor(Math.random() * roomTypes.length)];
        const assignedRoom = (Math.random() < 0.15) ? 'D' : reservedRoom;
        const adr = (Math.random() * 120 + 65).toFixed(2);
        const deposit = (leadTime > 150 && Math.random() < 0.4) ? 'Non Refund' : deposits[0];
        const status = (isCanceled === 1) ? 'Canceled' : 'Check-Out';
        const meal = meals[Math.floor(Math.random() * meals.length)];

        const adults = Math.floor(Math.random() * 2) + 1;
        const children = (Math.random() < 0.2) ? 1 : 0;
        const babies = (Math.random() < 0.05) ? 1 : 0;
        const weekendNights = Math.floor(Math.random() * 3);
        const weekNights = Math.floor(Math.random() * 4) + 1;
        const totalStay = weekendNights + weekNights;
        const totalPrice = (adr * totalStay).toFixed(2);
        const specialRequests = Math.floor(Math.random() * 3);
        const parking = (Math.random() < 0.2) ? 1 : 0;
        const agent = (segment.includes('TA')) ? `Agent #${Math.floor(Math.random() * 200) + 10}` : 'Direct Booking';
        const company = (segment === 'Corporate') ? `Corp #${Math.floor(Math.random() * 50) + 1}` : 'N/A';

        // Calculate risk score
        let risk = 'LOW';
        let riskScore = Math.floor(Math.random() * 25) + 15;
        if (isCanceled === 1 || leadTime > 120) {
            risk = 'HIGH';
            riskScore = Math.floor(Math.random() * 25) + 70;
        } else if (leadTime > 60) {
            risk = 'MEDIUM';
            riskScore = Math.floor(Math.random() * 25) + 40;
        }

        bookingData.push({
            id: `BK-${1000 + i}`,
            hotel,
            country,
            arrivalDate: `2015-07-${(i % 28 + 1).toString().padStart(2, '0')}`,
            stayNights: totalStay,
            weekendNights,
            weekNights,
            adults,
            children,
            babies,
            leadTime,
            reservedRoom,
            assignedRoom,
            segment,
            channel,
            customerType,
            adr,
            totalPrice,
            deposit,
            meal,
            agent,
            company,
            specialRequests,
            parking,
            risk,
            riskScore,
            status
        });
    }

    renderTable();

    // Table Filter Events
    document.getElementById('table-search').addEventListener('input', () => { currentPage = 1; renderTable(); });
    document.getElementById('filter-status').addEventListener('change', () => { currentPage = 1; renderTable(); });
    document.getElementById('filter-customer').addEventListener('change', () => { currentPage = 1; renderTable(); });

    document.getElementById('btn-prev').addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });
    document.getElementById('btn-next').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData().length / pageSize);
        if (currentPage < maxPage) { currentPage++; renderTable(); }
    });
}

function filteredData() {
    const search = document.getElementById('table-search').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const customerFilter = document.getElementById('filter-customer').value;

    return bookingData.filter(item => {
        const matchSearch = item.id.toLowerCase().includes(search) ||
                            item.country.toLowerCase().includes(search) ||
                            item.hotel.toLowerCase().includes(search) ||
                            item.segment.toLowerCase().includes(search);
        const matchStatus = (statusFilter === 'ALL') || (item.status === statusFilter);
        const matchCustomer = (customerFilter === 'ALL') || (item.customerType === customerFilter);
        return matchSearch && matchStatus && matchCustomer;
    });
}

function renderTable() {
    const data = filteredData();
    const tbody = document.getElementById('bookings-tbody');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = data.slice(start, end);

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" class="text-center" style="padding: 24px; color: var(--text-muted);">Tidak ada data reservasi yang cocok dengan pencarian.</td></tr>`;
        return;
    }

    pageItems.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong class="clickable-id" onclick="openBookingModal('${row.id}')" style="cursor:pointer; color:var(--accent-indigo);">${row.id}</strong></td>
            <td>${row.hotel}</td>
            <td><span class="badge badge-primary">${row.country}</span></td>
            <td>${row.arrivalDate}</td>
            <td>${row.stayNights} malam</td>
            <td>${row.leadTime} hari</td>
            <td>Tipe ${row.reservedRoom} / ${row.assignedRoom} ${row.reservedRoom !== row.assignedRoom ? '<small class="text-emerald">(Upgraded)</small>' : ''}</td>
            <td>${row.segment}</td>
            <td><strong>$ ${row.adr}</strong></td>
            <td>${row.deposit}</td>
            <td><span class="badge ${row.risk === 'HIGH' ? 'badge-danger' : row.risk === 'MEDIUM' ? 'badge-warning' : 'badge-primary'}">${row.risk} RISK</span></td>
            <td><span class="status-chip ${row.status === 'Check-Out' ? 'check-out' : 'canceled'}">${row.status}</span></td>
            <td class="text-center">
                <button class="btn btn-sm btn-primary btn-detail" onclick="openBookingModal('${row.id}')">
                    <i class="fa-solid fa-eye"></i> Detail
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('table-info').textContent = `Menampilkan ${start + 1}-${Math.min(end, data.length)} dari ${data.length} data (Total 17,000 Dataset)`;
    document.getElementById('page-number').textContent = `Halaman ${currentPage}`;
}

// Modal Detail Popup Logic
function openBookingModal(id) {
    const record = bookingData.find(b => b.id === id);
    if (!record) return;

    // Populate Modal Header
    document.getElementById('modal-booking-id').textContent = record.id;
    document.getElementById('modal-hotel-name').textContent = record.hotel;
    document.getElementById('modal-arrival-date').textContent = record.arrivalDate;
    document.getElementById('modal-lead-time').textContent = `${record.leadTime} Hari`;
    document.getElementById('modal-stay-duration').textContent = `${record.stayNights} Malam (${record.weekendNights} Weekend / ${record.weekNights} Weekday)`;

    // Populate Status Banners
    const statusChip = (record.status === 'Check-Out')
        ? `<span class="status-chip check-out"><i class="fa-solid fa-check-circle"></i> Check-Out (Menginap Sukses)</span>`
        : `<span class="status-chip canceled"><i class="fa-solid fa-circle-xmark"></i> Canceled (Reservasi Batal)</span>`;
    document.getElementById('modal-status-badge').innerHTML = statusChip;

    const riskBadgeClass = (record.risk === 'HIGH') ? 'badge-danger' : (record.risk === 'MEDIUM') ? 'badge-warning' : 'badge-primary';
    document.getElementById('modal-risk-badge').innerHTML = `<span class="badge ${riskBadgeClass}">${record.risk} RISK (${record.riskScore}%)</span>`;
    document.getElementById('modal-total-price').textContent = `$ ${record.totalPrice}`;

    // Populate Guest & Room Details
    document.getElementById('modal-country').textContent = `${record.country} (ISO Country Code)`;
    document.getElementById('modal-guests-count').textContent = `${record.adults} Dewasa, ${record.children} Anak, ${record.babies} Bayi`;
    document.getElementById('modal-room-comparison').textContent = `Dipesan: Tipe ${record.reservedRoom} / Dialokasi: Tipe ${record.assignedRoom}`;
    document.getElementById('modal-upgrade-status').innerHTML = (record.reservedRoom !== record.assignedRoom)
        ? `<span class="text-emerald" style="font-weight:700;"><i class="fa-solid fa-arrow-up"></i> Room Upgraded (Kamar Ditingkatkan)</span>`
        : `Sesuai Pesanan Awal`;

    // Populate Channel & Price Details
    document.getElementById('modal-market-segment').textContent = `${record.segment} (${record.channel})`;
    document.getElementById('modal-customer-type').textContent = record.customerType;
    document.getElementById('modal-adr').textContent = `$ ${record.adr} / malam`;
    document.getElementById('modal-deposit-type').textContent = record.deposit;

    // Populate Requests & BI Notes
    document.getElementById('modal-parking-req').textContent = (record.parking > 0) ? '1+ Slot Parkir Dipesan' : 'Tidak Ada Parkir';
    document.getElementById('modal-special-req').textContent = `${record.specialRequests} Permintaan Khusus`;
    document.getElementById('modal-meal').textContent = record.meal;
    document.getElementById('modal-agent-company').textContent = `${record.agent} / ${record.company}`;

    // Strategic BI Note
    let biNote = '';
    if (record.status === 'Canceled') {
        biNote = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-rose);"></i> <strong>Catatan Analitik BI:</strong> Reservasi ini telah dibatalkan dengan perkiraan kerugian pendapatan senilai <strong>$${record.totalPrice}</strong>. Faktor penyebab utama: Jeda booking ${record.leadTime} hari dan jenis deposit ${record.deposit}.`;
    } else if (record.risk === 'HIGH') {
        biNote = `<i class="fa-solid fa-circle-info" style="color:var(--accent-amber);"></i> <strong>Catatan Analitik BI:</strong> Reservasi berisiko tinggi. Disarankan konfirmasi ulang H-7 atau penerapan DP Non-Refundable untuk menekan tingkat pembatalan.`;
    } else {
        biNote = `<i class="fa-solid fa-circle-check" style="color:var(--accent-emerald);"></i> <strong>Catatan Analitik BI:</strong> Reservasi sukses menginap dengan kontribusi pendapatan bersih <strong>$${record.totalPrice}</strong>. Tamu tergolong segmen potensial.`;
    }
    document.getElementById('modal-bi-note').innerHTML = biNote;

    // Open Modal Overlay
    document.getElementById('modal-booking-detail').classList.add('active');
}

function initModalEvents() {
    const modal = document.getElementById('modal-booking-detail');
    const closeBtn = document.getElementById('btn-close-modal');
    const closeFooterBtn = document.getElementById('btn-close-modal-footer');
    const printBtn = document.getElementById('btn-print-modal');

    const closeModal = () => modal.classList.remove('active');

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

// Chart.js Visualizations
function initCharts() {
    // 1. Revenue Trend Line Chart
    const ctxTrend = document.getElementById('chart-revenue-trend').getContext('2d');
    new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            datasets: [
                {
                    label: 'Resort Hotel Revenue ($)',
                    data: [120000, 140000, 180000, 210000, 250000, 310000, 420000, 480000, 320000, 240000, 170000, 220000],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'City Hotel Revenue ($)',
                    data: [210000, 230000, 290000, 340000, 390000, 450000, 510000, 560000, 480000, 410000, 310000, 280000],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // 2. Market Segment Doughnut Chart
    const ctxSegment = document.getElementById('chart-market-segment').getContext('2d');
    new Chart(ctxSegment, {
        type: 'doughnut',
        data: {
            labels: ['Online TA', 'Offline TA/TO', 'Direct', 'Corporate', 'Groups'],
            datasets: [{
                data: [56.7, 20.1, 12.6, 6.2, 4.4],
                backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
        }
    });

    // 3. Reservation Status Pie Chart
    const ctxStatus = document.getElementById('chart-status-pie').getContext('2d');
    new Chart(ctxStatus, {
        type: 'pie',
        data: {
            labels: ['Check-Out (Berhasil)', 'Canceled (Batal)', 'No-Show'],
            datasets: [{
                data: [62.9, 36.0, 1.1],
                backgroundColor: ['#10b981', '#f43f5e', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
        }
    });

    // 4. Meal Distribution Bar Chart
    const ctxMeal = document.getElementById('chart-meal-distribution').getContext('2d');
    new Chart(ctxMeal, {
        type: 'bar',
        data: {
            labels: ['BB (Bed&Breakfast)', 'HB (Half Board)', 'SC (Self Catering)', 'FB (Full Board)'],
            datasets: [{
                label: 'Jumlah Booking',
                data: [13100, 2450, 1180, 270],
                backgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { display: false } },
                y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // 5. Country Bar Chart
    const ctxCountry = document.getElementById('chart-country-bar').getContext('2d');
    new Chart(ctxCountry, {
        type: 'bar',
        data: {
            labels: ['PRT (Portugal)', 'GBR (UK)', 'ESP (Spain)', 'FRA (France)', 'DEU (Germany)'],
            datasets: [{
                label: 'Tamu',
                data: [6850, 2410, 1850, 1620, 1280],
                backgroundColor: '#06b6d4'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#64748b' }, grid: { display: false } }
            }
        }
    });

    // 6. Room Comparison Bar Chart
    const ctxRoom = document.getElementById('chart-room-comparison').getContext('2d');
    new Chart(ctxRoom, {
        type: 'bar',
        data: {
            labels: ['Tipe A', 'Tipe B', 'Tipe C', 'Tipe D', 'Tipe E', 'Tipe F', 'Tipe G'],
            datasets: [
                { label: 'Reserved (Dipesan)', data: [12450, 850, 420, 2800, 950, 310, 220], backgroundColor: '#6366f1' },
                { label: 'Assigned (Dialokasi)', data: [11800, 920, 510, 3100, 1020, 340, 310], backgroundColor: '#10b981' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                x: { ticks: { color: '#64748b' } },
                y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // 7. Room ADR Chart
    const ctxRoomAdr = document.getElementById('chart-room-adr').getContext('2d');
    new Chart(ctxRoomAdr, {
        type: 'line',
        data: {
            labels: ['Tipe A', 'Tipe B', 'Tipe C', 'Tipe D', 'Tipe E', 'Tipe F', 'Tipe G'],
            datasets: [{
                label: 'Rata-rata ADR ($)',
                data: [89.50, 96.20, 110.00, 115.00, 138.20, 162.00, 195.00],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                x: { ticks: { color: '#64748b' } },
                y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // 8. Clustering Scatter Plot
    const ctxScatter = document.getElementById('chart-clustering-scatter').getContext('2d');
    new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Cluster 1: High-Value Vacationers',
                    data: [{x: 120, y: 160}, {x: 150, y: 180}, {x: 180, y: 155}, {x: 210, y: 190}, {x: 240, y: 175}],
                    backgroundColor: '#6366f1'
                },
                {
                    label: 'Cluster 2: Corporate Business',
                    data: [{x: 5, y: 95}, {x: 12, y: 105}, {x: 8, y: 88}, {x: 15, y: 110}, {x: 20, y: 92}],
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Cluster 3: Budget & High-Risk',
                    data: [{x: 220, y: 70}, {x: 280, y: 65}, {x: 310, y: 75}, {x: 350, y: 60}, {x: 400, y: 80}],
                    backgroundColor: '#f43f5e'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                x: { title: { display: true, text: 'Lead Time (Hari)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { title: { display: true, text: 'Average Daily Rate ($)', color: '#94a3b8' }, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

// Data Mining Decision Tree Form Evaluator
function initPredictionForm() {
    const form = document.getElementById('prediction-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const leadTime = parseInt(document.getElementById('pred-leadtime').value) || 0;
        const deposit = document.getElementById('pred-deposit').value;
        const segment = document.getElementById('pred-segment').value;
        const prevCancel = parseInt(document.getElementById('pred-prevcancel').value) || 0;
        const special = parseInt(document.getElementById('pred-special').value) || 0;
        const parking = parseInt(document.getElementById('pred-parking').value) || 0;

        let score = 20;

        if (leadTime > 150) score += 35;
        else if (leadTime > 60) score += 20;

        if (deposit === 'Non Refund') score -= 30;
        if (deposit === 'No Deposit' && leadTime > 100) score += 20;

        if (prevCancel > 0) score += 25;
        if (special > 0) score -= (special * 8);
        if (parking > 0) score -= 15;
        if (segment === 'Groups') score += 15;

        score = Math.max(5, Math.min(95, score));

        const scoreText = document.getElementById('risk-score-text');
        const badge = document.getElementById('risk-badge');
        const circle = document.getElementById('gauge-circle');
        const desc = document.getElementById('risk-desc');
        const rec = document.getElementById('risk-recommendation');

        scoreText.textContent = `${score}%`;

        if (score >= 70) {
            badge.textContent = 'HIGH RISK CANCELLATION';
            badge.style.background = 'rgba(244, 63, 94, 0.2)';
            badge.style.color = '#f43f5e';
            badge.style.borderColor = '#f43f5e';
            circle.style.borderColor = '#f43f5e';
            circle.style.boxShadow = '0 0 20px rgba(244, 63, 94, 0.4)';
            desc.textContent = `Risiko pembatalan SANGAT TINGGI (${score}%). Kombinasi lead time panjang (${leadTime} hari) tanpa deposit kuat meningkatkan potensi batal.`;
            rec.innerHTML = `<strong><i class="fa-solid fa-lightbulb"></i> Tindakan BI Direkomendasikan:</strong>
                <ul>
                    <li>Wajibkan deposit DP / Non-Refund 14 hari setelah pemesanan.</li>
                    <li>Lakukan follow-up telepon langsung oleh tim reservasi.</li>
                </ul>`;
        } else if (score >= 40) {
            badge.textContent = 'MEDIUM RISK CANCELLATION';
            badge.style.background = 'rgba(245, 158, 11, 0.2)';
            badge.style.color = '#f59e0b';
            badge.style.borderColor = '#f59e0b';
            circle.style.borderColor = '#f59e0b';
            circle.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.4)';
            desc.textContent = `Risiko pembatalan SEDANG (${score}%). Reservasi perlu dipantau secara berkala menjelang tanggal kedatangan.`;
            rec.innerHTML = `<strong><i class="fa-solid fa-lightbulb"></i> Tindakan BI Direkomendasikan:</strong>
                <ul>
                    <li>Kirimkan email konfirmasi otomatis H-14 kedatangan.</li>
                    <li>Tawarkan paket add-on diskon untuk pembayaran di awal.</li>
                </ul>`;
        } else {
            badge.textContent = 'LOW RISK (SAFE BOOKING)';
            badge.style.background = 'rgba(16, 185, 129, 0.2)';
            badge.style.color = '#10b981';
            badge.style.borderColor = '#10b981';
            circle.style.borderColor = '#10b981';
            circle.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
            desc.textContent = `Risiko pembatalan RENDAH (${score}%). Reservasi dikategorikan aman dan sangat berpeluang check-out sukses.`;
            rec.innerHTML = `<strong><i class="fa-solid fa-lightbulb"></i> Tindakan BI Direkomendasikan:</strong>
                <ul>
                    <li>Persiapkan alokasi kamar sesuai permintaan khusus tamu.</li>
                    <li>Tawarkan opsi upgrade kamar premium saat check-in.</li>
                </ul>`;
        }
    });
}

// Data Export CSV Logic
function initExportCSV() {
    const btnCSV = document.getElementById('btn-export-csv');
    const btnQuick = document.getElementById('btn-export-quick');

    const downloadCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,ID Booking,Hotel,Negara,Tgl Kedatangan,Lama Menginap,Lead Time,Tipe Kamar Dipesan,Segmen Pasar,ADR ($),Status Deposit,Status Akhir\n";

        bookingData.forEach(row => {
            csvContent += `${row.id},${row.hotel},${row.country},${row.arrivalDate},${row.stayNights},${row.leadTime},${row.reservedRoom},${row.segment},${row.adr},${row.deposit},${row.status}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "Hotel_Booking_Demand_BI_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (btnCSV) btnCSV.addEventListener('click', downloadCSV);
    if (btnQuick) btnQuick.addEventListener('click', downloadCSV);
}
