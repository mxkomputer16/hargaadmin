function appData() {
    return {
        items: [],
        tanggalUpdate: 'Memuat...',
        loading: true, // Hanya true saat pertama kali load
        loadError: '',
        search: '',
        statusFilter: 'semua',
        currentPage: 1,
        rowsPerPage: 50,
        modalOpen: false,
        selectedItem: {},

        init() {
            // Load pertama kali dengan status loading aktif
            this.fetchData(true);

            // Auto-refresh setiap 30 detik di background (tanpa loading screen)
            setInterval(() => {
                this.fetchData(false);
            }, 30000);
        },

        fetchData(isFirstLoad = false) {
            if (isFirstLoad) {
                this.loading = true;
            }

            const apiUrl = window.location.pathname.toLowerCase().endsWith('.php')
                ? 'api.php'
                : '/api/stok';

            fetch(apiUrl, { credentials: 'same-origin' })
                .then(async res => {
                    const data = await res.json();
                    if (!res.ok || data.error) {
                        throw new Error(data.error || `HTTP ${res.status}`);
                    }
                    return data;
                })
                .then(data => {
                    this.items = data.items;
                    this.tanggalUpdate = data.tanggal_update;
                    this.loadError = '';
                    if (isFirstLoad) {
                        this.loading = false;
                    }

                    // 1. Jika modal sedang terbuka, update juga data di dalam modal agar ikut sinkron (real-time)
                    if (this.modalOpen && this.selectedItem) {
                        const refreshedItem = this.items.find(i => i.kode === this.selectedItem.kode);
                        if (refreshedItem) {
                            this.selectedItem = refreshedItem;
                        }
                    }

                    // 2. Pengaman: Jika total data berkurang dan halaman saat ini melebihi total halaman, geser ke halaman terakhir
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                })
                .catch(err => {
                    console.error('Gagal memuat data:', err);
                    if (isFirstLoad) {
                        this.loadError = 'Data gagal dimuat. Silakan login kembali atau coba lagi beberapa saat.';
                    }
                    if (isFirstLoad) {
                        this.loading = false;
                    }
                });
        },

        get filteredItems() {
            let result = this.items;

            if (this.statusFilter === 'ready') {
                result = result.filter(item => item.kuantitas > 0);
            } else if (this.statusFilter === 'kosong') {
                result = result.filter(item => item.kuantitas <= 0);
            }

            if (this.search) {
                let query = this.search.toLowerCase();
                result = result.filter(item => {
                    return item.kode.toLowerCase().includes(query) || 
                           item.deskripsi.toLowerCase().includes(query);
                });
            }

            return result;
        },

        get totalPages() {
            return Math.ceil(this.filteredItems.length / this.rowsPerPage) || 1;
        },

        get startIndex() {
            return (this.currentPage - 1) * this.rowsPerPage;
        },

        get paginatedItems() {
            return this.filteredItems.slice(this.startIndex, this.startIndex + this.rowsPerPage);
        },

        nextPage() {
            if (this.currentPage < this.totalPages) this.currentPage++;
        },

        prevPage() {
            if (this.currentPage > 1) this.currentPage--;
        },

        openModal(item) {
            this.selectedItem = item;
            this.modalOpen = true;
        }
    }
}

document.getElementById('logoutButton')?.addEventListener('click', async () => {
    if (window.location.pathname.toLowerCase().endsWith('.php')) {
        window.location.assign('../logout.php');
        return;
    }

    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });
        if (!response.ok) throw new Error('Logout gagal.');
        window.location.assign('/');
    } catch (error) {
        console.error('Gagal keluar:', error);
        window.alert('Gagal keluar. Silakan coba lagi.');
    }
});