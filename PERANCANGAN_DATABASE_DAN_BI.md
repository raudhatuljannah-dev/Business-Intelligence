# Perancangan Database, Data Warehouse, Business Intelligence & Aplikasi Web (Hotel Booking Analytics)

Dokumen ini berisi perencanaan dan perancangan database relasional (OLTP), Data Warehouse (OLAP), fitur Business Intelligence (Integration Services, Analysis Services, Data Mining, Clustering Support, Reporting Services), serta rancangan Aplikasi Web berbasis **PHP & MySQL**.

---

## 1. Analisis & Pemetaan Data (Excel/CSV Data Booking Hotel)

Berdasarkan dataset `data_booking_hotel_17000.csv`, data mentah terdiri dari 31 kolom utama yang mencakup informasi reservasi hotel, profil tamu, saluran distribusi, tipe kamar, hingga status reservasi.

### Atribut Data Mentah:
1. `hotel`: Nama/tipe hotel (*Resort Hotel*, *City Hotel*)
2. `is_canceled`: Status pembatalan (0 = Tidak, 1 = Batal)
3. `lead_time`: Jumlah hari antara tanggal booking dan kedatangan
4. `arrival_date_year`, `arrival_date_month`, `arrival_date_week_number`, `arrival_date_day_of_month`: Waktu kedatangan
5. `stays_in_weekend_nights`, `stays_in_week_nights`: Durasi menginap
6. `adults`, `children`, `babies`: Jumlah tamu
7. `meal`: Jenis paket makan (*BB*, *FB*, *HB*, *SC*, *Undefined*)
8. `country`: Negara asal tamu (kode ISO)
9. `market_segment`: Segmen pasar (*Direct*, *Corporate*, *Online TA*, *Offline TA/TO*, dll)
10. `distribution_channel`: Saluran distribusi (*Direct*, *Corporate*, *TA/TO*, dll)
11. `is_repeated_guest`: Penanda tamu berulang (0/1)
12. `previous_cancellations`, `previous_bookings_not_canceled`: Riwayat reservasi tamu
13. `reserved_room_type`, `assigned_room_type`: Kode tipe kamar yang dipesan & yang dialokasikan
14. `booking_changes`: Jumlah perubahan pada pesanan
15. `deposit_type`: Tipe deposit (*No Deposit*, *Non Refund*, *Refundable*)
16. `agent`, `company`: ID agen travel & ID perusahaan penyewa
17. `days_in_waiting_list`: Jumlah hari di daftar tunggu
18. `customer_type`: Tipe pelanggan (*Transient*, *Contract*, *Group*, *Transient-Party*)
19. `adr`: *Average Daily Rate* (tarif rata-rata harian kamar)
20. `required_car_parking_spaces`: Jumlah ruang parkir yang diminta
21. `total_of_special_requests`: Jumlah permintaan khusus
22. `reservation_status`: Status akhir reservasi (*Check-Out*, *Canceled*, *No-Show*)
23. `reservation_status_date`: Tanggal update status terakhir

---

## 2. Perancangan Database Relasional (OLTP - MySQL)

Untuk kebutuhan operasional aplikasi web (PHP & MySQL), data mentah di-desentralisasi dan dinormalisasi hingga bentuk normal ketiga (**3NF**) guna menghindari redundansi data dan menjaga integritas data.

### Diagram ERD (Entitas & Relasi)

```
 [ hotels ] 1 --- N [ bookings ] N --- 1 [ room_types (reserved) ]
                        |          N --- 1 [ room_types (assigned) ]
                        |          N --- 1 [ market_segments ]
                        |          N --- 1 [ distribution_channels ]
                        |          N --- 1 [ customer_types ]
                        |          N --- 1 [ deposit_types ]
                        |          N --- 1 [ meals ]
                        |          N --- 1 [ countries ]
                        |          N --- 1 [ agents ]
                        |          N --- 1 [ companies ]
                        |
                        |--- 1 --- N [ reservation_history ]
```

### Detail Tabel Skema Database (MySQL OLTP):

#### A. Tabel Referensi / Master Data

##### 1. Tabel `hotels`
*Menyimpan daftar properti hotel.*
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `hotel_id` | INT AUTO_INCREMENT | PRIMARY KEY | ID unik hotel |
| `hotel_name` | VARCHAR(50) | NOT NULL | Nama hotel (misal: Resort Hotel, City Hotel) |

##### 2. Tabel `countries`
*Menyimpan master data negara asal tamu.*
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `country_code` | VARCHAR(5) | PRIMARY KEY | Kode negara ISO (PRT, GBR, ESP, USA, dll) |
| `country_name` | VARCHAR(100) | NULL | Nama lengkap negara |

##### 3. Tabel `room_types`
*Menyimpan master tipe kamar.*
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `room_type_code` | CHAR(2) | PRIMARY KEY | Kode kamar (A, B, C, D, E, F, G, H, L, P) |
| `description` | VARCHAR(100) | NULL | Deskripsi fasilitas kamar |

##### 4. Tabel `market_segments`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `segment_id` | INT AUTO_INCREMENT | PRIMARY KEY | ID Segmen |
| `segment_name` | VARCHAR(50) | NOT NULL, UNIQUE | Direct, Corporate, Online TA, Offline TA/TO, dll |

##### 5. Tabel `distribution_channels`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `channel_id` | INT AUTO_INCREMENT | PRIMARY KEY | ID Saluran Distribusi |
| `channel_name` | VARCHAR(50) | NOT NULL, UNIQUE | Direct, Corporate, TA/TO, GDS, Undefined |

##### 6. Tabel `customer_types`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `customer_type_id` | INT AUTO_INCREMENT | PRIMARY KEY | ID Tipe Pelanggan |
| `type_name` | VARCHAR(50) | NOT NULL | Transient, Contract, Group, Transient-Party |

##### 7. Tabel `deposit_types`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `deposit_id` | INT AUTO_INCREMENT | PRIMARY KEY | ID Jenis Deposit |
| `deposit_name` | VARCHAR(50) | NOT NULL | No Deposit, Non Refund, Refundable |

##### 8. Tabel `meals`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `meal_id` | INT AUTO_INCREMENT | PRIMARY KEY | ID Paket Makan |
| `meal_code` | VARCHAR(10) | NOT NULL | BB (Bed&Breakfast), HB (Half Board), FB, SC |
| `meal_description` | VARCHAR(100) | NULL | Deskripsi paket makan |

##### 9. Tabel `agents`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `agent_id` | INT | PRIMARY KEY | ID Agen Perjalanan (Travel Agent) |
| `agent_name` | VARCHAR(100) | NULL | Nama Agen |

##### 10. Tabel `companies`
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `company_id` | INT | PRIMARY KEY | ID Perusahaan/Korporat |
| `company_name` | VARCHAR(100) | NULL | Nama Perusahaan |

---

#### B. Tabel Transaksi Utama (Transaksi Reservasi)

##### 11. Tabel `bookings`
*Menyimpan transaksi pemesanan utama.*
| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `booking_id` | BIGINT AUTO_INCREMENT | PRIMARY KEY | ID Unik Reservasi |
| `hotel_id` | INT | FOREIGN KEY (`hotels`) | Relasi ke hotel |
| `lead_time` | INT | NOT NULL | Hari jeda dari pesan hingga check-in |
| `arrival_date` | DATE | NOT NULL | Tanggal lengkap kedatangan |
| `arrival_year` | INT | NOT NULL | Tahun kedatangan |
| `arrival_month` | VARCHAR(15) | NOT NULL | Bulan kedatangan |
| `arrival_week_number` | INT | NOT NULL | Minggu ke- berapa dalam tahun |
| `arrival_day_of_month` | INT | NOT NULL | Tanggal dalam bulan |
| `stays_in_weekend_nights` | INT | DEFAULT 0 | Jumlah malam akhir pekan |
| `stays_in_week_nights` | INT | DEFAULT 0 | Jumlah malam hari kerja |
| `adults` | INT | DEFAULT 1 | Jumlah orang dewasa |
| `children` | INT | DEFAULT 0 | Jumlah anak-anak |
| `babies` | INT | DEFAULT 0 | Jumlah bayi |
| `meal_id` | INT | FOREIGN KEY (`meals`) | Paket makan |
| `country_code` | VARCHAR(5) | FOREIGN KEY (`countries`) | Negara asal |
| `segment_id` | INT | FOREIGN KEY (`market_segments`) | Segmen pasar |
| `channel_id` | INT | FOREIGN KEY (`distribution_channels`) | Saluran distribusi |
| `is_repeated_guest` | TINYINT(1) | DEFAULT 0 | Tamu langganan (0/1) |
| `previous_cancellations` | INT | DEFAULT 0 | Histori pembatalan terdahulu |
| `previous_bookings_not_canceled` | INT | DEFAULT 0 | Histori reservasi sukses terdahulu |
| `reserved_room_type` | CHAR(2) | FOREIGN KEY (`room_types`) | Tipe kamar dipesan |
| `assigned_room_type` | CHAR(2) | FOREIGN KEY (`room_types`) | Tipe kamar didapatkan |
| `booking_changes` | INT | DEFAULT 0 | Perubahan detail reservasi |
| `deposit_id` | INT | FOREIGN KEY (`deposit_types`) | Jenis deposit |
| `agent_id` | INT | FOREIGN KEY (`agents`), NULL | Agen perjalanan |
| `company_id` | INT | FOREIGN KEY (`companies`), NULL | Perusahaan |
| `days_in_waiting_list` | INT | DEFAULT 0 | Hari di waiting list |
| `customer_type_id` | INT | FOREIGN KEY (`customer_types`) | Tipe pelanggan |
| `adr` | DECIMAL(10,2) | NOT NULL | Average Daily Rate (Harga per malam) |
| `required_car_parking_spaces` | INT | DEFAULT 0 | Kebutuhan slot parkir |
| `total_of_special_requests` | INT | DEFAULT 0 | Jumlah permintaan khusus |
| `is_canceled` | TINYINT(1) | NOT NULL DEFAULT 0 | Flag Batal (1) / Tidak (0) |
| `reservation_status` | ENUM('Check-Out','Canceled','No-Show') | NOT NULL | Status akhir reservasi |
| `reservation_status_date` | DATE | NOT NULL | Tanggal pembaruan status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu input data |

---

## 3. Perancangan Data Warehouse & OLAP (Star Schema)

Untuk analisis bisnis skala besar, agregasi cepat, dan integrasi dengan Business Intelligence tools, disiapkan skema Data Warehouse berbasis **Star Schema**.

```
                       +-------------------+
                       |    Dim_Hotel      |
                       +-------------------+
                                 |
                                 v
+-------------------+  +-------------------+  +-------------------+
|     Dim_Date      |->|   Fact_Bookings   |<-|   Dim_Customer    |
+-------------------+  +-------------------+  +-------------------+
                                 ^
                                 |
                       +-------------------+
                       |     Dim_Room      |
                       +-------------------+
```

### Detail Tabel Dimensi & Fakta (OLAP Schema)

#### 1. Fact Table: `Fact_Bookings`
*Menyimpan akumulasi transaksi dan metrik kuantitatif (Measures).*
| Kolom Metric / FK | Tipe Data | Keterangan / Formula |
| :--- | :--- | :--- |
| `booking_fact_sk` | BIGINT (PK) | Surrogate Key Fakta Reservasi |
| `date_sk` | INT (FK) | Relasi ke `Dim_Date` |
| `hotel_sk` | INT (FK) | Relasi ke `Dim_Hotel` |
| `customer_sk` | INT (FK) | Relasi ke `Dim_Customer` |
| `room_sk` | INT (FK) | Relasi ke `Dim_Room` |
| `channel_sk` | INT (FK) | Relasi ke `Dim_Channel` |
| `total_stay_nights` | INT | `stays_in_weekend_nights` + `stays_in_week_nights` |
| `total_guests` | INT | `adults` + `children` + `babies` |
| `adr` | DECIMAL(10,2) | Price per room/night |
| `total_revenue` | DECIMAL(12,2) | `adr` * `total_stay_nights` (jika tidak batal) |
| `is_canceled` | INT | Flag 1 (Canceled) / 0 (Successful) |
| `lead_time` | INT | Jeda waktu booking (hari) |
| `booking_changes` | INT | Jumlah permohonan ubah data |
| `special_requests_count` | INT | Jumlah special request |

#### 2. Dimension Tables:
- **`Dim_Date`**: `date_sk` (YYYYMMDD), `full_date`, `year`, `quarter`, `month_name`, `week_of_year`, `day_of_month`, `day_of_week_name`, `is_weekend`.
- **`Dim_Hotel`**: `hotel_sk`, `hotel_name`.
- **`Dim_Customer`**: `customer_sk`, `country_code`, `customer_type_name`, `is_repeated_guest`, `deposit_type_name`.
- **`Dim_Room`**: `room_sk`, `reserved_room_type`, `assigned_room_type`, `is_room_upgraded` (1 jika reserved != assigned).
- **`Dim_Channel`**: `channel_sk`, `market_segment_name`, `distribution_channel_name`, `agent_id`, `company_id`.

---

## 4. Perancangan Fitur Business Intelligence (BI Components)

Berikut adalah 5 pilar Business Intelligence yang diintegrasikan dalam arsitektur sistem:

### A. Integration Services (SSIS / ETL Pipeline)
Fungsi ETL (Extract, Transform, Load) bertanggung jawab memindahkan data dari file Excel/CSV atau database operasional MySQL ke Data Warehouse.

#### Tahapan ETL Pipeline:
1. **Extract (Ekstraksi)**:
   - Pengambilan file staging `data_booking_hotel_17000.csv` atau query delta harian dari tabel OLTP MySQL `bookings`.
2. **Transform (Transformasi & Cleansing Data)**:
   - **Handling Missing Values / Null**: Mengisi `agent` dan `company` NULL dengan angka `0` atau label `'Unknown'`.
   - **Data Normalization**: Mengubah nilai string bulan ('July') menjadi format integer/Date valid ('2015-07-01').
   - **Handling Outliers / Invalid Values**: Memastikan `children` tidak bernilai desimal (konversi `0.0` ke `0` integer).
   - **Calculated Fields Integration**: Menghitung `total_stay_nights` = `stays_in_weekend_nights` + `stays_in_week_nights`.
   - **Derived Flag**: Membuat kolom `is_room_upgraded` = CASE WHEN `reserved_room_type` != `assigned_room_type` THEN 1 ELSE 0 END.
3. **Load (Pemuatan Data)**:
   - Pemuatan bertahap (Incremental Load) ke tabel dimensi terlebih dahulu (`Dim_Customer`, `Dim_Room`, `Dim_Channel`) menggunakan SCD (Surrogate Key Mapping).
   - Pemuatan fakta ke `Fact_Bookings`.

---

### B. Analysis Services (SSAS / OLAP Cube & KPIs)
Membangun Data Cube multi-dimensi untuk mendukung pemrosesan query analitis cepat dan perhitungan Key Performance Indicators (KPIs).

#### Metrik Kunci & DAX / Business KPI Formula:
1. **Total Revenue (Pendapatan Kotor)**:
   $$\text{Total Revenue} = \sum (\text{Fact\_Bookings.adr} \times \text{Fact\_Bookings.total\_stay\_nights}) \quad \text{where } \text{is\_canceled} = 0$$
2. **Cancellation Rate (Tingkat Pembatalan)**:
   $$\text{Cancellation Rate} = \frac{\text{Jumlah Reservasi Batal (is\_canceled = 1)}}{\text{Total Reservasi}} \times 100\%$$
3. **Average Daily Rate (ADR)**:
   $$\text{ADR} = \frac{\text{Total Pendapatan Kamar}}{\text{Total Kamar Terjual}}$$
4. **RevPAR (Revenue Per Available Room)**:
   $$\text{RevPAR} = \text{ADR} \times \text{Occupancy Rate}$$
5. **Average Lead Time**:
   $$\text{Avg Lead Time} = \text{AVG}(\text{Fact\_Bookings.lead\_time})$$

---

### C. Data Mining (Predictive Analytics)
Modul Data Mining berfokus pada prediksi pembatalan reservasi (*Cancellation Prediction*) dan *Price Sensitivity Analysis*.

#### Modul Data Mining: Prediksi Pembatalan Reservasi (Cancellation Risk Modeling)
- **Tujuan**: Memprediksi kemungkinan pelanggan membatalkan reservasi secara dini sehingga pihak hotel dapat melakukan strategi *overbooking* terkontrol atau mengirimkan reminder/konfirmasi khusus.
- **Algoritma yang Digunakan**: Decision Tree (C4.5/CART), Random Forest, atau Logistic Regression.
- **Fitur/Variabel Input Data Mining**:
  - `lead_time` (Waktu jeda pemesanan)
  - `deposit_type` (Deposit Non-Refund biasanya menekan pembatalan)
  - `previous_cancellations` (Riwayat pembatalan sebelumnya)
  - `booking_changes` (Jumlah perubahan detail)
  - `required_car_parking_spaces`
  - `total_of_special_requests`
  - `customer_type` & `market_segment`
- **Output Data Mining**:
  - **Skor Risiko Pembatalan**: High Risk (>75%), Medium Risk (40-75%), Low Risk (<40%).

---

### D. Clustering Support (Customer & Market Segmentation)
Fungsi Clustering digunakan untuk membagi tamu dan segmen pasar ke dalam kelompok-kelompok yang homogen tanpa label awal (Unsupervised Learning).

#### Penerapan Algoritma K-Means Clustering:
1. **Variabel Klastering**:
   - `Lead Time`
   - `ADR` (Rata-rata pengeluaran per malam)
   - `Total Stay Duration` (Lama menginap)
   - `Special Requests` & `Parking Spaces`
2. **Identifikasi Profil Klaster (Contoh hasil 3 Klaster Utama)**:
   - **Cluster 1: "High-Value Vacationers" (Tamu Liburan Mewah)**
     - Characteristic: Lead time panjang, ADR tinggi, menginap lama di weekend, reservasi via Online TA, special request tinggi.
   - **Cluster 2: "Corporate & Short-Stay Business" (Tamu Bisnis)**
     - Characteristic: Lead time pendek, menginap 1-2 malam (weekday), tanpa anak/bayi, segmen Corporate/Direct.
   - **Cluster 3: "Budget & High-Risk Bookers"**
     - Characteristic: Lead time sangat panjang, ADR rendah, tanpa deposit, riwayat pembatalan ada, risiko pembatalan tinggi.

---

### E. Reporting Services (SSRS & Dashboard Executive)
Fungsi untuk menyajikan visualisasi data, laporan interaktif, dan ekspor laporan periodik.

#### Katalog Laporan Utama Dashboard:
1. **Executive Revenue & Occupancy Dashboard**:
   - Tren Pendapatan per Bulan & Tahun (Resort vs City Hotel).
   - Metrik Utama: Total Revenue, Occupancy %, RevPAR, ADR.
2. **Cancellation Analysis & Loss Revenue Report**:
   - Persentase Batal berdasarkan Lead Time Grouping & Deposit Type.
   - Estimasi Kerugian Finansial akibat pembatalan.
3. **Channel Performance & Agent Contribution Report**:
   - Kontribusi booking berdasarkan `market_segment` (Online TA, Direct, Corporate).
   - Top 10 Travel Agent dengan jumlah booking dan tingkat pembatalan terbanyak.
4. **Demographic & Customer Preference Report**:
   - Peta Distribusi Geografis Asal Tamu (`country`).
   - Preferensi Tipe Kamar (`reserved_room_type` vs `assigned_room_type`).

---

## 5. Perancangan Aplikasi Web Berbasis PHP & MySQL

Aplikasi web dirancang dengan pola **MVC (Model-View-Controller)** menggunakan bahasa pemrograman **PHP** (Native / Framework Laravel/CodeIgniter) dan **Database MySQL**.

```
[ Frontend: HTML, CSS, JavaScript, Chart.js / DataTables ]
                            |
                            v
[ Controller PHP (Routes, Business Logic, API Endpoints) ]
            |                               |
            v                               v
[ Models PHP (Query MySQL) ]     [ BI / Data Mining Services ]
            |                               |
            v                               v
[ MySQL Database (OLTP/OLAP) ]   [ Model Predictor & Analytics ]
```

### Struktur Modul Utama Aplikasi Web:

1. **Modul Dashboard & Summary Executif**:
   - Menampilkan Widget KPI (Total Booking, Total Revenue, Avg ADR, Cancellation Rate).
   - Visualisasi Grafik Interaktif (Line Chart untuk Tren Bulanan, Pie Chart untuk Market Segment, Bar Chart untuk Comparison Hotel).

2. **Modul Manajemen Reservasi & Data Booking**:
   - Fitur CRUD Data Booking Hotel (Tambah, Edit, Hapus, Detail Reservasi).
   - Datatable interaktif dengan filter berdasarkan Nama Hotel, Rentang Tanggal, Status Reservasi, dan Negara.

3. **Modul Predictive Analytics (Data Mining Pembatalan)**:
   - Form simulasi prediksi risiko pembatalan untuk input reservasi baru.
   - Menampilkan alert indikator risiko (Hijau = Aman, Kuning = Sedang, Merah = Berisiko Batal).

4. **Modul Clustering & Segmentasi Tamu**:
   - Visualisasi Scatter Plot klaster pelanggan (K-Means Result).
   - Filter rekomendasi penawaran promo sesuai klaster profil tamu.

5. **Modul Reporting & Data Export (SSRS Alternative)**:
   - Fitur Filter Laporan Kustom (Tanggal, Hotel, Segmen).
   - Ekspor Laporan ke format **PDF**, **Excel (.xlsx)**, dan **CSV**.

---

## 6. Ringkasan Keterhubungan Sistem BI & Web PHP-MySQL

1. Data mentah dari Excel/CSV diproses melalui **ETL (Integration Services)** untuk membersihkan data dan dimasukkan ke dalam **MySQL Database (OLTP & OLAP Data Warehouse)**.
2. Database MySQL menjadi sumber data tunggal (*Single Source of Truth*) yang melayani transaksi aplikasi web **PHP** dan kueri OLAP **Analysis Services**.
3. Modul **Data Mining** dan **Clustering** mengolah data fakta untuk menghasilkan prediksi pembatalan serta segmentasi tamu secara matematis.
4. Modul **Reporting Services** menampilkan hasil olahan secara visual pada **Aplikasi Web PHP**, sehingga eksekutif dan manajer hotel dapat mengambil keputusan bisnis secara akurat dan responsif.
