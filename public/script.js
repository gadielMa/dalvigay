// Variables globales
let currentUser = null;
let currentSection = 'emr';

// Datos que se cargarán desde la API
let medicalRecords = [];
let inventory = [];
let clients = [];
let communications = [];
let sales = [];
let pets = []; // Nueva variable global para las mascotas

// Configuración de zona horaria
const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

// Función para obtener la fecha actual en Argentina
function getArgentinaDate() {
    return new Date().toLocaleString('en-CA', {
        timeZone: ARGENTINA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Función para obtener la fecha y hora actual en Argentina
function getArgentinaDateTime() {
    return new Date().toLocaleString('es-AR', {
        timeZone: ARGENTINA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para formatear fecha en zona horaria de Argentina
function formatDateInArgentina(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    
    // Formatear en zona horaria de Argentina
    return date.toLocaleDateString('es-AR', {
        timeZone: ARGENTINA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Función para obtener fecha en formato YYYY-MM-DD en Argentina
function getArgentinaDateString(dateInput = null) {
    const date = dateInput ? new Date(dateInput) : new Date();
    
    // Usar Intl.DateTimeFormat para mejor control de zona horaria
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: ARGENTINA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    return formatter.format(date);
}

// Función para cargar datos desde la API
async function loadDataFromAPI() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Cargar datos en paralelo
        const [medicalData, inventoryData, clientsData, communicationsData, salesData, petsData] = await Promise.all([
            api.getMedicalRecords().catch(() => []),
            api.getInventory().catch(() => []),
            api.getClients().catch(() => []),
            api.getCommunications().catch(() => []),
            api.getSales().catch(() => []),
            api.getPets().catch(() => []) // Cargar datos de mascotas
        ]);

        medicalRecords = medicalData;
        inventory = inventoryData;
        clients = clientsData;
        communications = communicationsData;
        sales = salesData;
        pets = petsData; // Asignar datos de mascotas a la variable global

        console.log('✅ Datos cargados desde la API');
    } catch (error) {
        console.error('❌ Error al cargar datos desde la API:', error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Verificar si hay sesión activa
    const savedUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');
    
    if (savedUser && authToken) {
        currentUser = JSON.parse(savedUser);
        api.token = authToken;
        
        // Cargar datos y mostrar dashboard
        loadDataFromAPI().then(() => {
            showDashboard();
        });
    }
});

// Función de login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    console.log('Intentando login con:', username); // Debug
    
    try {
        const response = await api.login(username, password);
        
        currentUser = response.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        console.log('Login exitoso, mostrando dashboard'); // Debug
        
        // Cargar datos desde la API
        await loadDataFromAPI();
        
        showDashboard();
    } catch (error) {
        console.log('Login fallido:', error.message); // Debug
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}

// Función para mostrar el dashboard
function showDashboard() {
    console.log('Mostrando dashboard...'); // Debug
    
    // Ocultar login
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
        loginContainer.style.display = 'none';
        console.log('Login container oculto'); // Debug
    }
    
    // Crear el dashboard si no existe
    let dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) {
        console.log('Creando dashboard...'); // Debug
        createDashboard();
        dashboardContainer = document.querySelector('.dashboard-container');
    }
    
    // Mostrar dashboard
    if (dashboardContainer) {
        dashboardContainer.style.display = 'block';
        console.log('Dashboard mostrado'); // Debug
        loadSection('emr');
    } else {
        console.error('Error: No se pudo crear el dashboard'); // Debug
    }
}

// Crear el dashboard
function createDashboard() {
    console.log('Creando dashboard HTML...'); // Debug
    
    const dashboardHTML = `
        <div class="dashboard-container">
            <header class="header">
                <div class="logo">
                    <i class="fas fa-heart"></i>
                    <h1>CediapVet</h1>
                </div>
                <div class="user-info">
                    <img src="${currentUser.photo}" alt="${currentUser.name}" class="user-photo">
                    <div class="user-details">
                        <span class="user-name">${currentUser.name}</span>
                        <span class="user-role">${currentUser.role}</span>
                    </div>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Cerrar Sesión
                    </button>
                </div>
            </header>
            
            <main class="main-content">
                <nav class="dashboard-nav">
                    <button class="nav-btn nav-btn-blue active" onclick="loadSection('emr')">
                        <i class="fas fa-file-medical"></i>
                        Registros Médicos
                    </button>
                    <button class="nav-btn nav-btn-blue" onclick="loadSection('fichas')">
                        <i class="fas fa-folder-open"></i>
                        Fichas
                    </button>
                    <button class="nav-btn nav-btn-orange" onclick="loadSection('inventory')">
                        <i class="fas fa-boxes"></i>
                        Inventario
                    </button>
                    <button class="nav-btn nav-btn-orange" onclick="loadSection('sales')">
                        <i class="fas fa-cash-register"></i>
                        Ventas
                    </button>
                    <button class="nav-btn nav-btn-purple" onclick="loadSection('calendar')">
                        <i class="fas fa-calendar-alt"></i>
                        Calendario
                    </button>
                    <button class="nav-btn nav-btn-blue" onclick="loadSection('clients')">
                        <i class="fas fa-users"></i>
                        Clientes
                    </button>
                    <button class="nav-btn nav-btn-red" onclick="loadSection('communication')">
                        <i class="fas fa-comments"></i>
                        Comunicación
                    </button>
                </nav>
                
                <div id="content-area">
                    <!-- El contenido se cargará aquí -->
                </div>
            </main>
        </div>
    `;
    
    document.body.innerHTML = dashboardHTML;
    console.log('Dashboard HTML creado y añadido al body'); // Debug
}

// Función para cargar secciones
function loadSection(section) {
    currentSection = section;
    
    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activar el botón correspondiente
    const activeBtn = document.querySelector(`[onclick="loadSection('${section}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const contentArea = document.getElementById('content-area');
    
    switch (section) {
        case 'emr':
            contentArea.innerHTML = getEMRContent();
            break;
        case 'inventory':
            contentArea.innerHTML = getInventoryContent();
            break;
        case 'clients':
            contentArea.innerHTML = getClientsContent();
            break;
        case 'fichas':
            contentArea.innerHTML = getFichasContent();
            // Cargar la lista inicial de mascotas después de renderizar el contenido
            setTimeout(() => {
                showAllPetsInSearch();
                // Agregar botón temporal para insertar datos de ejemplo
                const fichasSection = document.querySelector('.fichas-search');
                if (fichasSection && pets.length === 0) {
                    const sampleDataButton = document.createElement('button');
                    sampleDataButton.className = 'btn btn-warning';
                    sampleDataButton.style.marginTop = '10px';
                    sampleDataButton.innerHTML = '<i class="fas fa-sync"></i> Sincronizar Mascotas desde EMR';
                    sampleDataButton.onclick = insertSampleData;
                    fichasSection.appendChild(sampleDataButton);
                }
            }, 100);
            break;
        case 'communication':
            contentArea.innerHTML = getCommunicationContent();
            break;
        case 'calendar':
            contentArea.innerHTML = getCalendarContent();
            refreshCalendar();
            break;
        case 'sales':
            contentArea.innerHTML = getSalesContent();
            break;
    }
}

// Contenido de EMR
function getEMRContent() {
    const recordsHTML = medicalRecords.map(record => {
        // Usar la información del cliente si está disponible, sino usar el campo owner
        const clientInfo = record.client_name ? 
            `<strong>${record.client_name}</strong><br>
             <small style="color: #666;">
                ${record.client_email || ''}<br>
                ${record.client_phone || ''}
             </small>` : 
            record.owner;
            
        return `
            <tr>
                <td>${record.pet_name || record.petName}</td>
                <td>${clientInfo}</td>
                <td>${record.date}</td>
                <td>${record.diagnosis}</td>
                <td>${record.treatment}</td>
                <td>${record.next_appointment || record.nextAppointment || 'N/A'}</td>
                <td>
                    <button class="btn btn-primary" onclick="editRecord(${record.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteRecord(${record.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    return `
        <div class="section active">
            <h2>Registros Médicos Electrónicos (EMR)</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-paw"></i>
                    <h3>${medicalRecords.length}</h3>
                    <p>Total de Registros</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-calendar-check"></i>
                    <h3>${medicalRecords.filter(r => {
                        const nextDate = r.next_appointment || r.nextAppointment;
                        return nextDate && new Date(nextDate) > new Date();
                    }).length}</h3>
                    <p>Próximas Citas</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-syringe"></i>
                    <h3>${medicalRecords.filter(r => r.diagnosis.includes('Vacun')).length}</h3>
                    <p>Vacunaciones</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <h3>${medicalRecords.filter(r => r.client_id).length}</h3>
                    <p>Con Cliente Asociado</p>
                </div>
            </div>
            
            <button class="btn btn-success" onclick="showAddRecordModal()">
                <i class="fas fa-plus"></i>
                Nuevo Registro
            </button>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Mascota</th>
                        <th>Cliente (Propietario)</th>
                        <th>Fecha</th>
                        <th>Diagnóstico</th>
                        <th>Tratamiento</th>
                        <th>Próxima Cita</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${recordsHTML}
                </tbody>
            </table>
        </div>
    `;
}

// Contenido de Inventario
function getInventoryContent() {
    const inventoryHTML = inventory.map(item => {
        const minStock = item.min_stock || item.minStock || 0;
        const stockStatus = item.stock <= minStock ? 'status-low' : 
                           item.stock <= minStock * 1.5 ? 'status-medium' : 'status-good';
        
        const expiryDate = item.expiry_date || item.expiryDate;
        const expiryStatus = expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'status-low' : 'status-good';
        
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td class="${stockStatus}">${item.stock}</td>
                <td>${minStock}</td>
                <td class="${expiryStatus}">${expiryDate || 'N/A'}</td>
                <td>${item.supplier || 'N/A'}</td>
                <td>${item.barcode || 'N/A'}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="addProductToCart(${item.id})" title="Agregar al carrito">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="editInventoryItem(${item.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteInventoryItem(${item.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    const lowStockItems = inventory.filter(item => {
        const minStock = item.min_stock || item.minStock || 0;
        return item.stock <= minStock;
    }).length;
    
    const expiringItems = inventory.filter(item => {
        const expiryDate = item.expiry_date || item.expiryDate;
        return expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }).length;
    
    const alertsHTML = `
        ${lowStockItems > 0 ? `<div class="alert alert-danger">¡Atención! ${lowStockItems} productos con stock bajo</div>` : ''}
        ${expiringItems > 0 ? `<div class="alert alert-warning">¡Atención! ${expiringItems} productos próximos a vencer</div>` : ''}
    `;
    
    return `
        <div class="section active">
            <h2>Gestión de Inventario</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-boxes"></i>
                    <h3>${inventory.length}</h3>
                    <p>Total de Productos</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${lowStockItems}</h3>
                    <p>Stock Bajo</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <h3>${expiringItems}</h3>
                    <p>Próximos a Vencer</p>
                </div>
            </div>
            
            <!-- Carteles de alerta eliminados -->
            
            <!-- Sección de Carrito y Escáner -->
            <div class="cart-scanner-section">
                <h3>Carrito de Ventas</h3>
                <div class="cart-scanner-actions">
                    <div class="barcode-scanner">
                        <input type="text" id="barcodeInput" placeholder="Escanear código de barras para agregar al carrito..." onkeypress="handleBarcodeInput(event)">
                        <button class="btn btn-success" onclick="addToCart()">
                            <i class="fas fa-shopping-cart"></i>
                            Agregar al Carrito
                        </button>
                    </div>
                    <button class="btn btn-primary cart-button" onclick="showSalesCart()" id="cartButton">
                        <i class="fas fa-shopping-cart"></i>
                        Ver Carrito (<span id="cartCount">0</span>)
                    </button>
                </div>
            </div>
            
            <!-- Sección de Búsqueda y Agregar Producto -->
            <div class="inventory-controls">
                <div class="search-container">
                    <div class="search-box">
                        <input type="text" id="productSearch" placeholder="Buscar productos..." onkeyup="searchProducts()">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
                <button class="btn btn-success" onclick="showAddInventoryModal()">
                    <i class="fas fa-plus"></i>
                    Agregar Producto
                </button>
            </div>
            
            <!-- Lista de Productos -->
            <table class="table" id="inventoryTable">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Stock Mínimo</th>
                        <th>Fecha Vencimiento</th>
                        <th>Proveedor</th>
                        <th>Código de Barras</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventoryHTML}
                </tbody>
            </table>
        </div>
    `;
}

// Contenido de Clientes
function getClientsContent() {
    const clientsHTML = clients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.email || 'N/A'}</td>
            <td>${client.phone || 'N/A'}</td>
            <td>${client.address || 'N/A'}</td>
            <td>${client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn btn-primary" onclick="editClient(${client.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteClient(${client.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    return `
        <div class="section active">
            <h2>Gestión de Clientes</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <h3>${clients.length}</h3>
                    <p>Total de Clientes</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-envelope"></i>
                    <h3>${clients.filter(c => c.email).length}</h3>
                    <p>Con Email</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-phone"></i>
                    <h3>${clients.filter(c => c.phone).length}</h3>
                    <p>Con Teléfono</p>
                </div>
            </div>
            
            <button class="btn btn-success" onclick="showAddClientModal()">
                <i class="fas fa-plus"></i>
                Nuevo Cliente
            </button>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                        <th>Fecha Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${clientsHTML}
                </tbody>
            </table>
        </div>
    `;
}

// Contenido de Fichas
function getFichasContent() {
    return `
        <div class="section active">
            <h2>Fichas de Mascotas</h2>
            <p>Selecciona el tipo de búsqueda y encuentra la mascota que necesitas</p>
            
            <div class="fichas-search">
                <div class="search-options">
                    <label>
                        <input type="radio" name="searchType" value="pet" checked onchange="updateSearchPlaceholder()">
                        Buscar por mascota
                    </label>
                    <label>
                        <input type="radio" name="searchType" value="owner" onchange="updateSearchPlaceholder()">
                        Buscar por propietario
                    </label>
                </div>
                <div class="search-container-large">
                    <input type="text" id="petSearchInput" placeholder="Buscar por nombre de mascota..." oninput="filterPetList()">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            
            <div id="petFilesResults" class="pet-files-results">
                <h3>Todas las Mascotas:</h3>
                <div id="petListContainer" class="pet-list-container">
                    <!-- Lista de mascotas se cargará aquí -->
                </div>
                <p class="no-results-fichas" style="display: none;">No se encontraron mascotas que coincidan con la búsqueda.</p>
            </div>
        </div>
    `;
}

// Función para actualizar el placeholder del buscador
function updateSearchPlaceholder() {
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const searchInput = document.getElementById('petSearchInput');
    
    if (searchType === 'pet') {
        searchInput.placeholder = 'Buscar por nombre de mascota...';
    } else {
        searchInput.placeholder = 'Buscar por nombre del propietario...';
    }
    
    // Limpiar búsqueda actual y mostrar todas las mascotas
    searchInput.value = '';
    showAllPetsInSearch();
}

// Función para filtrar la lista de mascotas al escribir en el buscador
function filterPetList() {
    const searchTerm = document.getElementById('petSearchInput').value.toLowerCase();
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const petCards = document.querySelectorAll('.pet-list-container .pet-card');
    let foundResults = false;

    petCards.forEach(card => {
        const petName = card.dataset.petName.toLowerCase();
        const ownerName = card.dataset.ownerName.toLowerCase();
        
        let matches = false;
        if (searchType === 'pet') {
            matches = petName.includes(searchTerm);
        } else {
            matches = ownerName.includes(searchTerm);
        }
        
        if (matches) {
            card.style.display = 'block';
            foundResults = true;
        } else {
            card.style.display = 'none';
        }
    });

    document.querySelector('.no-results-fichas').style.display = foundResults || searchTerm === '' ? 'none' : 'block';
}

// Función para mostrar todas las mascotas al hacer foco en el input de búsqueda
function showAllPetsInSearch() {
    const petListContainer = document.getElementById('petListContainer');
    if (!petListContainer) return;
    
    petListContainer.innerHTML = pets.map(pet => `
        <div class="pet-card" data-pet-id="${pet.id}" data-pet-name="${pet.name}" data-owner-name="${pet.client_name || ''}" onclick="displayPetFicha(${pet.id})">
            <h4>${pet.name}</h4>
            <p><strong>Propietario:</strong> ${pet.client_name || 'N/A'}</p>
            <p><strong>Especie:</strong> ${pet.species || 'Desconocida'}</p>
            <p><strong>Raza:</strong> ${pet.breed || 'Desconocida'}</p>
            <p><strong>Edad:</strong> ${pet.age !== null ? pet.age : 'N/A'} ${pet.age !== null ? 'años' : ''}</p>
        </div>
    `).join('');
    filterPetList(); // Aplicar filtro si ya hay texto
}

// Listener para cuando se carga la sección de fichas
document.addEventListener('DOMContentLoaded', () => {
    // Asegurarse de que esta lógica solo se ejecuta cuando la sección de fichas está activa
    // Esto puede requerir un mecanismo más robusto si las secciones se recargan dinámicamente
    if (document.getElementById('petSearchInput')) {
        showAllPetsInSearch();
    }
});

// Función para mostrar la ficha completa de una mascota
function displayPetFicha(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) {
        document.getElementById('petFilesResults').innerHTML = `<p class="no-results">Mascota no encontrada.</p>`;
        return;
    }

    // Filtrar registros médicos para esta mascota
    const petMedicalRecords = medicalRecords.filter(record => record.pet_id === petId);
    
    // Agrupar registros por fecha
    const groupedRecords = petMedicalRecords.reduce((acc, record) => {
        const date = formatDateInArgentina(record.date);
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(record);
        return acc;
    }, {});

    let recordsHTML = '';
    for (const date in groupedRecords) {
        recordsHTML += `<div class="ficha-section"><h3>Registros del ${date}</h3>`;
        groupedRecords[date].forEach(record => {
            const appliedMedicationsHTML = record.applied_medications && record.applied_medications.length > 0 
                ? `<h4>Medicamentos Aplicados:</h4><ul>` + record.applied_medications.map(med => `<li>${med.name}</li>`).join('') + `</ul>`
                : '';
            
            recordsHTML += `
                <div class="medical-record-item">
                    <p><strong>Diagnóstico:</strong> ${record.diagnosis}</p>
                    <p><strong>Tratamiento:</strong> ${record.treatment}</p>
                    ${record.next_appointment ? `<p><strong>Próxima Cita:</strong> ${formatDateInArgentina(record.next_appointment)}</p>` : ''}
                    ${appliedMedicationsHTML}
                </div>
            `;
        });
        recordsHTML += `</div>`;
    }

    // Filtrar próximas citas para esta mascota
    const petAppointments = medicalRecords.filter(record => 
        record.pet_id === petId && 
        record.next_appointment && 
        new Date(record.next_appointment) >= new Date()
    ).sort((a, b) => new Date(a.next_appointment) - new Date(b.next_appointment));

    let appointmentsHTML = '';
    if (petAppointments.length > 0) {
        appointmentsHTML = `
            <h3>Próximas Citas:</h3>
            <ul>
                ${petAppointments.map(app => `<li>${formatDateInArgentina(app.next_appointment)}</li>`).join('')}
            </ul>
        `;
    }

    const fichaContent = `
        <div class="pet-ficha-details">
            <div class="ficha-header">
                <h2>Ficha de ${pet.name}</h2>
                <button class="btn btn-primary" onclick="toggleEditMode(${petId})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
            
            <div class="pet-info-section">
                <div id="petInfoView-${petId}" class="pet-info-view">
                    <p><strong>Propietario:</strong> ${pet.client_name || 'N/A'}</p>
                    <p><strong>Especie:</strong> ${pet.species || 'Desconocida'}</p>
                    <p><strong>Raza:</strong> ${pet.breed || 'Desconocida'}</p>
                    <p><strong>Edad:</strong> ${pet.age !== null ? pet.age : 'N/A'} ${pet.age !== null ? 'años' : ''}</p>
                </div>
                
                <div id="petInfoEdit-${petId}" class="pet-info-edit" style="display: none;">
                    <div class="form-group">
                        <label><strong>Propietario:</strong></label>
                        <select id="editOwner-${petId}">
                            ${clients.map(client => `
                                <option value="${client.id}" ${client.id === pet.client_id ? 'selected' : ''}>
                                    ${client.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label><strong>Especie:</strong></label>
                        <input type="text" id="editSpecies-${petId}" value="${pet.species || ''}" placeholder="Ej: Perro, Gato">
                    </div>
                    <div class="form-group">
                        <label><strong>Raza:</strong></label>
                        <input type="text" id="editBreed-${petId}" value="${pet.breed || ''}" placeholder="Ej: Golden Retriever, Persa">
                    </div>
                    <div class="form-group">
                        <label><strong>Edad:</strong></label>
                        <input type="number" id="editAge-${petId}" value="${pet.age || ''}" placeholder="Edad en años" min="0" max="30">
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-success" onclick="savePetInfo(${petId})">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                        <button class="btn btn-secondary" onclick="cancelEditMode(${petId})">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
            
            <hr/>
            <h3>Historial Médico</h3>
            ${recordsHTML || '<p>No hay registros médicos para esta mascota.</p>'}
            ${appointmentsHTML}
        </div>
    `;
    document.getElementById('petFilesResults').innerHTML = fichaContent;
}

// Función para alternar el modo de edición
function toggleEditMode(petId) {
    const viewDiv = document.getElementById(`petInfoView-${petId}`);
    const editDiv = document.getElementById(`petInfoEdit-${petId}`);
    
    viewDiv.style.display = 'none';
    editDiv.style.display = 'block';
}

// Función para cancelar el modo de edición
function cancelEditMode(petId) {
    const viewDiv = document.getElementById(`petInfoView-${petId}`);
    const editDiv = document.getElementById(`petInfoEdit-${petId}`);
    
    viewDiv.style.display = 'block';
    editDiv.style.display = 'none';
}

// Función para guardar la información de la mascota
async function savePetInfo(petId) {
    try {
        const newOwnerId = document.getElementById(`editOwner-${petId}`).value;
        const newSpecies = document.getElementById(`editSpecies-${petId}`).value;
        const newBreed = document.getElementById(`editBreed-${petId}`).value;
        const newAge = document.getElementById(`editAge-${petId}`).value;
        
        const updatedPet = {
            client_id: parseInt(newOwnerId),
            species: newSpecies || null,
            breed: newBreed || null,
            age: newAge ? parseInt(newAge) : null
        };
        
        await api.updatePet(petId, updatedPet);
        showNotification('Información de mascota actualizada exitosamente', 'success');
        
        // Recargar datos y actualizar vista
        await loadDataFromAPI();
        setTimeout(() => {
            displayPetFicha(petId);
        }, 500);
        
    } catch (error) {
        console.error('Error al actualizar mascota:', error);
        showNotification('Error al actualizar mascota: ' + error.message, 'error');
    }
}

// Modificar la función searchPetFiles para que ahora solo filtre y muestre la lista, y use displayPetFicha
function searchPetFiles() {
    // Ya no es necesario, filterPetList hace el trabajo
    // La lógica de mostrar la ficha se maneja con displayPetFicha(pet.id)
}

// Listener para la sección de fichas para cargar la lista inicial de mascotas
document.addEventListener('DOMContentLoaded', () => {
    // Solo ejecutar si estamos en la sección de fichas y el input existe
    const petSearchInput = document.getElementById('petSearchInput');
    if (petSearchInput && currentSection === 'fichas') {
        showAllPetsInSearch();
    }
});

// Función para mostrar la ficha completa de una mascota
function displayPetFicha(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) {
        document.getElementById('petFilesResults').innerHTML = `<p class="no-results">Mascota no encontrada.</p>`;
        return;
    }

    // Filtrar registros médicos para esta mascota
    const petMedicalRecords = medicalRecords.filter(record => record.pet_id === petId);
    
    // Agrupar registros por fecha
    const groupedRecords = petMedicalRecords.reduce((acc, record) => {
        const date = formatDateInArgentina(record.date);
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(record);
        return acc;
    }, {});

    let recordsHTML = '';
    for (const date in groupedRecords) {
        recordsHTML += `<div class="ficha-section"><h3>Registros del ${date}</h3>`;
        groupedRecords[date].forEach(record => {
            const appliedMedicationsHTML = record.applied_medications && record.applied_medications.length > 0 
                ? `<h4>Medicamentos Aplicados:</h4><ul>` + record.applied_medications.map(med => `<li>${med.name}</li>`).join('') + `</ul>`
                : '';
            
            recordsHTML += `
                <div class="medical-record-item">
                    <p><strong>Diagnóstico:</strong> ${record.diagnosis}</p>
                    <p><strong>Tratamiento:</strong> ${record.treatment}</p>
                    ${record.next_appointment ? `<p><strong>Próxima Cita:</strong> ${formatDateInArgentina(record.next_appointment)}</p>` : ''}
                    ${appliedMedicationsHTML}
                </div>
            `;
        });
        recordsHTML += `</div>`;
    }

    // Filtrar próximas citas para esta mascota
    const petAppointments = medicalRecords.filter(record => 
        record.pet_id === petId && 
        record.next_appointment && 
        new Date(record.next_appointment) >= new Date()
    ).sort((a, b) => new Date(a.next_appointment) - new Date(b.next_appointment));

    let appointmentsHTML = '';
    if (petAppointments.length > 0) {
        appointmentsHTML = `
            <h3>Próximas Citas:</h3>
            <ul>
                ${petAppointments.map(app => `<li>${formatDateInArgentina(app.next_appointment)}</li>`).join('')}
            </ul>
        `;
    }

    const fichaContent = `
        <div class="pet-ficha-details">
            <div class="ficha-header">
                <h2>Ficha de ${pet.name}</h2>
                <button class="btn btn-primary" onclick="toggleEditMode(${petId})">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
            
            <div class="pet-info-section">
                <div id="petInfoView-${petId}" class="pet-info-view">
                    <p><strong>Propietario:</strong> ${pet.client_name || 'N/A'}</p>
                    <p><strong>Especie:</strong> ${pet.species || 'Desconocida'}</p>
                    <p><strong>Raza:</strong> ${pet.breed || 'Desconocida'}</p>
                    <p><strong>Edad:</strong> ${pet.age !== null ? pet.age : 'N/A'} ${pet.age !== null ? 'años' : ''}</p>
                </div>
                
                <div id="petInfoEdit-${petId}" class="pet-info-edit" style="display: none;">
                    <div class="form-group">
                        <label><strong>Propietario:</strong></label>
                        <select id="editOwner-${petId}">
                            ${clients.map(client => `
                                <option value="${client.id}" ${client.id === pet.client_id ? 'selected' : ''}>
                                    ${client.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label><strong>Especie:</strong></label>
                        <input type="text" id="editSpecies-${petId}" value="${pet.species || ''}" placeholder="Ej: Perro, Gato">
                    </div>
                    <div class="form-group">
                        <label><strong>Raza:</strong></label>
                        <input type="text" id="editBreed-${petId}" value="${pet.breed || ''}" placeholder="Ej: Golden Retriever, Persa">
                    </div>
                    <div class="form-group">
                        <label><strong>Edad:</strong></label>
                        <input type="number" id="editAge-${petId}" value="${pet.age || ''}" placeholder="Edad en años" min="0" max="30">
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-success" onclick="savePetInfo(${petId})">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                        <button class="btn btn-secondary" onclick="cancelEditMode(${petId})">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
            
            <hr/>
            <h3>Historial Médico</h3>
            ${recordsHTML || '<p>No hay registros médicos para esta mascota.</p>'}
            ${appointmentsHTML}
        </div>
    `;
    document.getElementById('petFilesResults').innerHTML = fichaContent;
}

// Contenido de Comunicación
function getCommunicationContent() {
    return `
        <div class="section active">
            <h2>Comunicación con Clientes</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <h3>${clients.length}</h3>
                    <p>Total de Clientes</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-envelope"></i>
                    <h3>${communications.filter(c => c.type === 'email').length}</h3>
                    <p>Emails Enviados</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-sms"></i>
                    <h3>${communications.filter(c => c.type === 'sms').length}</h3>
                    <p>SMS Enviados</p>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <button class="btn btn-primary" onclick="showEmailModal()">
                        <i class="fas fa-envelope"></i>
                        Enviar Email
                    </button>
                </div>
                <div class="form-group">
                    <button class="btn btn-primary" onclick="showSMSModal()">
                        <i class="fas fa-sms"></i>
                        Enviar SMS
                    </button>
                </div>
            </div>
            
            <h3>Historial de Comunicaciones</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Tipo</th>
                        <th>Asunto</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${communications.map(comm => `
                        <tr>
                            <td>${comm.sent_at ? new Date(comm.sent_at).toLocaleDateString() : 'N/A'}</td>
                            <td>${comm.client_name || 'Cliente desconocido'}</td>
                            <td>${comm.type.toUpperCase()}</td>
                            <td>${comm.subject}</td>
                            <td class="status-good">Enviado</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Contenido del Calendario
function getCalendarContent() {
    // Usar las variables globales del calendario
    const displayMonth = currentCalendarMonth;
    const displayYear = currentCalendarYear;
    
    return `
        <div class="section active">
            <h2>Calendario de Citas</h2>
            
            <div class="calendar-header">
                <button class="btn btn-primary" onclick="navigateMonth(-1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h3 id="calendar-month-year">${getMonthName(displayMonth)} ${displayYear}</h3>
                <button class="btn btn-primary" onclick="navigateMonth(1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="btn btn-success" onclick="navigateToToday()" style="margin-left: 10px;">
                    <i class="fas fa-calendar-day"></i> Hoy
                </button>


            </div>
            
            <div class="calendar-container">
                <div class="calendar-grid" id="calendar-grid">
                    ${generateCalendarGrid(displayMonth, displayYear)}
                </div>
            </div>
            
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #4CAF50;"></div>
                    <span>Consulta médica</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FF9800;"></div>
                    <span>Próxima cita</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #2196F3;"></div>
                    <span>Hoy</span>
                </div>
            </div>
            
            <div class="upcoming-appointments">
                <h3>Próximas Citas</h3>
                <div class="appointments-list">
                    ${getUpcomingAppointments()}
                </div>
            </div>
        </div>
    `;
}

// Variables globales para el calendario
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// Función para generar la grilla del calendario
function generateCalendarGrid(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
    
    let html = `
        <div class="calendar-weekdays">
            <div class="weekday">Dom</div>
            <div class="weekday">Lun</div>
            <div class="weekday">Mar</div>
            <div class="weekday">Mié</div>
            <div class="weekday">Jue</div>
            <div class="weekday">Vie</div>
            <div class="weekday">Sáb</div>
        </div>
        <div class="calendar-days">
    `;
    
    const current = new Date(startDate);
    while (current <= lastDay || current.getDay() !== 0) {
        const isToday = isCurrentMonth && current.getDate() === today.getDate() && current.getMonth() === today.getMonth();
        const isCurrentMonthDay = current.getMonth() === month;
        const dayEvents = getEventsForDate(current);
        
        // Crear una fecha correcta para el onclick
        const clickDate = new Date(current);
        const clickDateStr = clickDate.getFullYear() + '-' + 
                            String(clickDate.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(clickDate.getDate()).padStart(2, '0');
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${!isCurrentMonthDay ? 'other-month' : ''}" 
                 onclick="showDayEvents('${clickDateStr}')">
                <div class="day-number ${dayEvents.length > 0 ? 'has-events' : ''}">${current.getDate()}</div>
                <div class="day-events">
                    ${dayEvents.map(event => `
                        <div class="event ${event.type}" title="${event.title}">
                            ${event.title.substring(0, 20)}${event.title.length > 20 ? '...' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        current.setDate(current.getDate() + 1);
    }
    
    html += '</div>';
    return html;
}

// Función para normalizar fechas y comparar de manera robusta (con zona horaria Argentina)
function normalizeDate(dateValue) {
    if (!dateValue) return null;
    
    // Si es una cadena, limpiar espacios y caracteres extraños
    if (typeof dateValue === 'string') {
        dateValue = dateValue.trim();
        
        // Si ya está en formato YYYY-MM-DD, devolverlo
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        
        // Si es una fecha ISO completa, extraer solo la parte de la fecha
        if (dateValue.includes('T')) {
            return dateValue.split('T')[0];
        }
        
        // Intentar parsear como fecha y formatear en zona horaria Argentina
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
            return getArgentinaDateString(parsed);
        }
    }
    
    // Si es un objeto Date
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        return getArgentinaDateString(dateValue);
    }
    
    return null;
}

// Función para obtener eventos de una fecha específica (mejorada con zona horaria Argentina)
function getEventsForDate(date) {
    // Convertir la fecha a formato YYYY-MM-DD en zona horaria Argentina
    const dateStr = getArgentinaDateString(date);
    
    console.log(`🔍 Buscando eventos para: ${dateStr}`);
    console.log(`📊 Total de registros médicos: ${medicalRecords.length}`);
    
    const events = [];
    
    // Buscar citas médicas programadas (próximas citas)
    medicalRecords.forEach((record, index) => {
        const nextAppointment = record.next_appointment || record.nextAppointment;
        const normalizedNext = normalizeDate(nextAppointment);
        const normalizedDate = normalizeDate(record.date);
        
        console.log(`📋 Registro ${index + 1}:`, {
            id: record.id,
            pet: record.pet_name || record.petName,
            owner: record.client_name || record.owner,
            date: record.date,
            normalizedDate: normalizedDate,
            nextAppointment: nextAppointment,
            normalizedNext: normalizedNext,
            nextAppointmentType: typeof nextAppointment,
            dateStrType: typeof dateStr,
            comparison: normalizedNext === dateStr,
            rawComparison: nextAppointment === dateStr
        });
        
        if (normalizedNext && normalizedNext === dateStr) {
            console.log(`✅ Encontrada cita para ${dateStr}:`, record);
            events.push({
                type: 'appointment',
                title: `Cita: ${record.pet_name || record.petName}`,
                time: '10:00', // Hora por defecto
                client: record.client_name || record.owner,
                pet: record.pet_name || record.petName,
                diagnosis: record.diagnosis
            });
        }
        
        // También mostrar registros médicos del día (consultas realizadas)
        if (normalizedDate && normalizedDate === dateStr) {
            console.log(`✅ Encontrada consulta para ${dateStr}:`, record);
            events.push({
                type: 'medical-record',
                title: `Consulta: ${record.pet_name || record.petName}`,
                time: '14:00', // Hora por defecto
                client: record.client_name || record.owner,
                pet: record.pet_name || record.petName,
                diagnosis: record.diagnosis
            });
        }
    });
    
    console.log(`📅 Eventos encontrados para ${dateStr}:`, events);
    return events;
}

// Función para obtener próximas citas (con zona horaria Argentina)
function getUpcomingAppointments() {
    // Obtener la fecha actual en Argentina
    const todayArgentina = getArgentinaDate();
    const today = new Date(todayArgentina);
    today.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo fechas
    const upcomingAppointments = [];
    
    console.log(`📅 Buscando próximas citas desde: ${todayArgentina} (Argentina)`);
    console.log(`📊 Total de registros médicos para próximas citas: ${medicalRecords.length}`);
    
    medicalRecords.forEach((record, index) => {
        const nextAppointment = record.next_appointment || record.nextAppointment;
        const normalizedNext = normalizeDate(nextAppointment);
        
        console.log(`📋 Registro ${index + 1} para próximas citas:`, {
            id: record.id,
            pet: record.pet_name || record.petName,
            nextAppointment: nextAppointment,
            normalizedNext: normalizedNext
        });
        
        if (normalizedNext) {
            // Crear la fecha usando el formato normalizado (YYYY-MM-DD) sin problemas de zona horaria
            const [year, month, day] = normalizedNext.split('-').map(Number);
            const appointmentDate = new Date(year, month - 1, day); // month - 1 porque los meses son 0-indexed
            appointmentDate.setHours(0, 0, 0, 0); // Establecer a medianoche
            
            console.log(`📅 Comparando: ${appointmentDate.toISOString().split('T')[0]} >= ${today.toISOString().split('T')[0]}`);
            console.log(`📅 Fecha normalizada: ${normalizedNext}`);
            console.log(`📅 Fecha creada: ${appointmentDate.toDateString()}`);
            
            if (appointmentDate >= today) {
                console.log(`✅ Cita futura encontrada: ${normalizedNext}`);
                upcomingAppointments.push({
                    date: appointmentDate,
                    dateStr: normalizedNext,
                    pet: record.pet_name || record.petName,
                    client: record.client_name || record.owner,
                    diagnosis: record.diagnosis,
                    recordId: record.id
                });
            }
        }
    });
    
    // Ordenar por fecha
    upcomingAppointments.sort((a, b) => a.date - b.date);
    
    console.log(`📅 Total de próximas citas encontradas: ${upcomingAppointments.length}`);
    console.log(`📋 Próximas citas:`, upcomingAppointments);
    
    if (upcomingAppointments.length === 0) {
        return '<p style="text-align: center; color: #666; font-style: italic;">No hay citas programadas</p>';
    }
    
    return upcomingAppointments.slice(0, 5).map(appointment => {
        const isToday = appointment.date.toDateString() === today.toDateString();
        const daysDiff = Math.ceil((appointment.date - today) / (1000 * 60 * 60 * 24));
        
        let dateDisplay = appointment.date.toLocaleDateString('es-AR', {
            timeZone: ARGENTINA_TIMEZONE,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        if (isToday) {
            dateDisplay = `🔥 HOY - ${dateDisplay}`;
        } else if (daysDiff === 1) {
            dateDisplay = `📅 MAÑANA - ${dateDisplay}`;
        } else if (daysDiff <= 7) {
            dateDisplay = `📅 En ${daysDiff} días - ${dateDisplay}`;
        }
        
        return `
            <div class="appointment-item ${isToday ? 'today-appointment' : ''}" onclick="navigateToAppointment('${appointment.dateStr}')">
                <div class="appointment-date">
                    <strong>${dateDisplay}</strong>
                </div>
                <div class="appointment-details">
                    <div class="appointment-pet">🐾 ${appointment.pet}</div>
                    <div class="appointment-client">👤 ${appointment.client}</div>
                    <div class="appointment-reason">📋 ${appointment.diagnosis}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Función para obtener el nombre del mes
function getMonthName(month) {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
}

// Función para navegar entre meses
function navigateMonth(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    } else if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    }
    
    // Actualizar el título
    document.getElementById('calendar-month-year').textContent = 
        `${getMonthName(currentCalendarMonth)} ${currentCalendarYear}`;
    
    // Regenerar la grilla
    document.getElementById('calendar-grid').innerHTML = 
        generateCalendarGrid(currentCalendarMonth, currentCalendarYear);
}

// Función para navegar a un mes específico
function navigateToMonth(month, year) {
    currentCalendarMonth = month;
    currentCalendarYear = year;
    
    // Actualizar el título
    document.getElementById('calendar-month-year').textContent = 
        `${getMonthName(currentCalendarMonth)} ${currentCalendarYear}`;
    
    // Regenerar la grilla
    document.getElementById('calendar-grid').innerHTML = 
        generateCalendarGrid(currentCalendarMonth, currentCalendarYear);
}

// Función para navegar al mes actual
function navigateToToday() {
    const today = new Date();
    navigateToMonth(today.getMonth(), today.getFullYear());
}

// Función para navegar a una cita específica
function navigateToAppointment(dateStr) {
    const appointmentDate = new Date(dateStr);
    navigateToMonth(appointmentDate.getMonth(), appointmentDate.getFullYear());
    
    // Opcional: mostrar los eventos de ese día después de un pequeño delay
    setTimeout(() => {
        showDayEvents(dateStr);
    }, 300);
}

// Función de debug para verificar datos del calendario
function debugCalendarData() {
    console.log('=== DEBUG CALENDARIO ===');
    console.log('📊 Total registros médicos:', medicalRecords.length);
    console.log('📋 Registros médicos completos:', medicalRecords);
    
    // Inspeccionar cada registro médico en detalle
    medicalRecords.forEach((record, index) => {
        console.log(`🔍 Registro ${index + 1} - Análisis detallado:`, {
            id: record.id,
            pet_name: record.pet_name,
            petName: record.petName,
            owner: record.owner,
            client_name: record.client_name,
            date: record.date,
            next_appointment: record.next_appointment,
            nextAppointment: record.nextAppointment,
            next_appointment_type: typeof record.next_appointment,
            nextAppointment_type: typeof record.nextAppointment,
            next_appointment_value: record.next_appointment,
            nextAppointment_value: record.nextAppointment,
            diagnosis: record.diagnosis,
            treatment: record.treatment,
            allKeys: Object.keys(record)
        });
    });
    
    // Buscar específicamente registros con próximas citas
    const recordsWithAppointments = medicalRecords.filter(record => 
        record.next_appointment || record.nextAppointment
    );
    
    console.log('📅 Registros con próximas citas:', recordsWithAppointments.length);
    recordsWithAppointments.forEach((record, index) => {
        console.log(`📋 Registro ${index + 1}:`, {
            id: record.id,
            pet: record.pet_name || record.petName,
            owner: record.client_name || record.owner,
            date: record.date,
            nextAppointment: record.next_appointment || record.nextAppointment,
            diagnosis: record.diagnosis
        });
    });
    
    // Verificar específicamente el 14 de agosto
    const august14 = '2025-08-14';
    console.log(`🔍 Buscando eventos para ${august14}:`);
    
    const august14Events = medicalRecords.filter(record => {
        const nextAppointment = record.next_appointment || record.nextAppointment;
        const normalizedNext = normalizeDate(nextAppointment);
        const normalizedDate = normalizeDate(record.date);
        console.log(`🔍 Comparando: "${nextAppointment}" -> "${normalizedNext}" === "${august14}" = ${normalizedNext === august14}`);
        return normalizedNext === august14 || normalizedDate === august14;
    });
    
    console.log(`📅 Eventos encontrados para ${august14}:`, august14Events);
    
    // Probar directamente la función getEventsForDate
    const testDate = new Date(2025, 7, 14); // Agosto = 7 (0-indexed)
    console.log('🧪 Probando getEventsForDate para 14 de agosto:', testDate);
    console.log('🧪 Fecha convertida a string:', testDate.getFullYear() + '-' + 
                   String(testDate.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(testDate.getDate()).padStart(2, '0'));
    const testEvents = getEventsForDate(testDate);
    console.log('🧪 Eventos devueltos por getEventsForDate:', testEvents);
    
    // Verificar el estado actual del calendario
    console.log('📅 Estado actual del calendario:', {
        currentCalendarMonth: currentCalendarMonth,
        currentCalendarYear: currentCalendarYear,
        displayingMonth: getMonthName(currentCalendarMonth),
        displayingYear: currentCalendarYear
    });
    
    // Verificar si estamos en el mes correcto
    const isAugust2025 = currentCalendarMonth === 7 && currentCalendarYear === 2025;
    console.log('📅 ¿Estamos viendo agosto 2025?', isAugust2025);
    
    // Mostrar también el token de autenticación
    console.log('🔐 Token de autenticación:', localStorage.getItem('authToken') ? 'Presente' : 'Ausente');
    
    // Verificar si los datos están siendo cargados correctamente
    console.log('🔄 Última carga de datos:', new Date().toISOString());
    
    // Verificar zona horaria
    console.log('🌍 Zona horaria configurada:', ARGENTINA_TIMEZONE);
    console.log('🇦🇷 Fecha actual en Argentina:', getArgentinaDate());
    console.log('🇦🇷 Fecha y hora actual en Argentina:', getArgentinaDateTime());
    
    // Verificar la estructura exacta de los datos
    console.log('🔍 Primer registro médico (estructura completa):', medicalRecords[0]);
    
    alert(`Debug completado. Revisa la consola para ver los detalles.\n\nRegistros médicos: ${medicalRecords.length}\nCon próximas citas: ${recordsWithAppointments.length}\nEventos para 14 ago: ${august14Events.length}\nEventos por getEventsForDate: ${testEvents.length}`);
}

// Función para mostrar eventos de un día específico
function showDayEvents(dateStr) {
    // Crear fecha de manera más confiable
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const events = getEventsForDate(date);
    
    if (events.length === 0) {
        const formattedDate = date.toLocaleDateString('es-AR', {
            timeZone: ARGENTINA_TIMEZONE,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        alert(`No hay eventos programados para el ${formattedDate}`);
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Eventos del ${date.toLocaleDateString('es-AR', {
                timeZone: ARGENTINA_TIMEZONE,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}</h2>
            <div class="day-events-list">
                ${events.map(event => `
                    <div class="event-item ${event.type}">
                        <div class="event-time">${event.time}</div>
                        <div class="event-details">
                            <div class="event-title">${event.title}</div>
                            <div class="event-client">Cliente: ${event.client}</div>
                            <div class="event-pet">Mascota: ${event.pet}</div>
                            ${event.diagnosis ? `<div class="event-diagnosis">Diagnóstico: ${event.diagnosis}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Contenido de Ventas
function getSalesContent() {
    const totalVentas = sales.length;
    const totalIngresos = sales.reduce((total, sale) => total + parseFloat(sale.total_amount || 0), 0);
    const totalProductos = sales.reduce((total, sale) => total + parseInt(sale.total_items || 0), 0);
    const ventasHoy = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
    }).length;

    const salesHTML = sales.map(sale => {
        const saleDate = new Date(sale.sale_date);
        const formattedDate = saleDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const itemsPreview = sale.items ? sale.items.slice(0, 2).map(item => item.product_name).join(', ') : 'Sin items';
        const moreItems = sale.items && sale.items.length > 2 ? ` y ${sale.items.length - 2} más` : '';

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${sale.veterinarian_name || 'No especificado'}</td>
                <td>${sale.total_items || 0}</td>
                <td>${itemsPreview}${moreItems}</td>
                <td class="status-good">$${parseFloat(sale.total_amount || 0).toFixed(2)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="showSaleDetails(${sale.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="section active">
            <h2>Historial de Ventas</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>${totalVentas}</h3>
                    <p>Total de Ventas</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-dollar-sign"></i>
                    <h3>$${totalIngresos.toFixed(2)}</h3>
                    <p>Ingresos Totales</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-box"></i>
                    <h3>${totalProductos}</h3>
                    <p>Productos Vendidos</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-calendar-day"></i>
                    <h3>${ventasHoy}</h3>
                    <p>Ventas Hoy</p>
                </div>
            </div>
            
            <div class="sales-actions">
                <button class="btn btn-success" onclick="showNewSaleModal()">
                    <i class="fas fa-plus"></i>
                    Nueva Venta
                </button>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha y Hora</th>
                        <th>Veterinario</th>
                        <th>Productos</th>
                        <th>Items Vendidos</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${salesHTML || '<tr><td colspan="6">No hay ventas registradas</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

// Función para mostrar detalles de una venta
function showSaleDetails(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        alert('Venta no encontrada');
        return;
    }

    const saleDate = new Date(sale.sale_date);
    const formattedDate = saleDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const itemsHTML = sale.items ? sale.items.map(item => `
        <tr>
            <td>${item.product_name}</td>
            <td>${item.quantity}</td>
            <td>$${parseFloat(item.unit_price).toFixed(2)}</td>
            <td>$${parseFloat(item.total_price).toFixed(2)}</td>
        </tr>
    `).join('') : '<tr><td colspan="4">No hay items en esta venta</td></tr>';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>
                <i class="fas fa-receipt"></i>
                Detalles de Venta #${sale.id}
            </h2>
            
            <div class="sale-info">
                <div class="sale-header">
                    <div class="sale-date">
                        <strong>Fecha:</strong> ${formattedDate}
                    </div>
                    <div class="sale-veterinarian">
                        <strong>Veterinario:</strong> ${sale.veterinarian_name || 'No especificado'}
                    </div>
                </div>
                
                <div class="sale-summary">
                    <div class="summary-item">
                        <span class="label">Total de productos:</span>
                        <span class="value">${sale.total_items || 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Total de la venta:</span>
                        <span class="value total-amount">$${parseFloat(sale.total_amount || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <h3>Productos Vendidos</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            ${sale.notes ? `
                <div class="sale-notes">
                    <h3>Notas</h3>
                    <p>${sale.notes}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Funciones para manejar medicamentos en registros médicos
function setupMedicationListeners() {
    // Listener para checkboxes de medicamentos
    document.querySelectorAll('input[name="appliedMedications"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedMedicationsList);
    });
}

function searchMedications() {
    const searchTerm = document.getElementById('medicationSearch').value.toLowerCase();
    const medicationItems = document.querySelectorAll('.medication-item');
    
    medicationItems.forEach(item => {
        const medicationName = item.querySelector('.medication-name').textContent.toLowerCase();
        const medicationCategory = item.querySelector('.medication-category').textContent.toLowerCase();
        
        if (medicationName.includes(searchTerm) || medicationCategory.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function updateSelectedMedicationsList() {
    const selectedList = document.getElementById('selectedMedicationsList');
    const checkedMedications = document.querySelectorAll('input[name="appliedMedications"]:checked');
    
    if (checkedMedications.length === 0) {
        selectedList.innerHTML = '<p style="color: #666; font-style: italic;">Ningún medicamento seleccionado</p>';
        return;
    }
    
    const medicationsList = Array.from(checkedMedications).map(checkbox => {
        return `
            <div class="selected-medication">
                <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                <span>${checkbox.dataset.name}</span>
                <small>(Stock: ${checkbox.dataset.stock})</small>
            </div>
        `;
    }).join('');
    
    selectedList.innerHTML = medicationsList;
}

// Funciones para manejar medicamentos en formulario de edición
function setupEditMedicationListeners() {
    // Listener para checkboxes de medicamentos en edición
    document.querySelectorAll('input[name="editAppliedMedications"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateEditSelectedMedicationsList);
    });
    
    // Actualizar lista inicial basada en medicamentos ya seleccionados
    updateEditSelectedMedicationsList();
}

function searchEditMedications() {
    const searchTerm = document.getElementById('editMedicationSearch').value.toLowerCase();
    const medicationItems = document.querySelectorAll('#editMedicationsGrid .medication-item');
    
    medicationItems.forEach(item => {
        const medicationName = item.querySelector('.medication-name').textContent.toLowerCase();
        const medicationCategory = item.querySelector('.medication-category').textContent.toLowerCase();
        
        if (medicationName.includes(searchTerm) || medicationCategory.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function updateEditSelectedMedicationsList() {
    const selectedList = document.getElementById('editSelectedMedicationsList');
    const checkedMedications = document.querySelectorAll('input[name="editAppliedMedications"]:checked');
    
    if (checkedMedications.length === 0) {
        selectedList.innerHTML = '<p style="color: #666; font-style: italic;">Ningún medicamento seleccionado</p>';
        return;
    }
    
    const medicationsList = Array.from(checkedMedications).map(checkbox => {
        return `
            <div class="selected-medication">
                <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                <span>${checkbox.dataset.name}</span>
                <small>(Stock: ${checkbox.dataset.stock})</small>
            </div>
        `;
    }).join('');
    
    selectedList.innerHTML = medicationsList;
}

// Función para buscar fichas de mascotas
function searchPetFiles() {
    const searchTerm = document.getElementById('petSearchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('petFilesResults');
    
    if (searchTerm.length < 2) {
        resultsContainer.innerHTML = '<p class="no-results">Escribe al menos 2 caracteres para buscar</p>';
        return;
    }
    
    // Buscar registros médicos que coincidan con el nombre de la mascota
    const matchingRecords = medicalRecords.filter(record => {
        const petName = (record.pet_name || record.petName || '').toLowerCase();
        return petName.includes(searchTerm);
    });
    
    if (matchingRecords.length === 0) {
        resultsContainer.innerHTML = '<p class="no-results">No se encontraron registros para esta mascota</p>';
        return;
    }
    
    // Agrupar por mascota
    const petGroups = {};
    matchingRecords.forEach(record => {
        const petName = record.pet_name || record.petName;
        if (!petGroups[petName]) {
            petGroups[petName] = [];
        }
        petGroups[petName].push(record);
    });
    
    // Generar HTML para cada mascota
    const petsHTML = Object.keys(petGroups).map(petName => {
        const petRecords = petGroups[petName].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestRecord = petRecords[0];
        
        // Obtener información del cliente
        const clientInfo = latestRecord.client_name ? 
            `${latestRecord.client_name}` : 
            latestRecord.owner;
        
        const clientContact = latestRecord.client_email || latestRecord.client_phone ? 
            `<br><small>${latestRecord.client_email || ''} ${latestRecord.client_phone || ''}</small>` : 
            '';
        
        // Obtener próximas citas
        const upcomingAppointments = petRecords.filter(record => {
            const nextDate = record.next_appointment || record.nextAppointment;
            return nextDate && new Date(nextDate) > new Date();
        });
        
        // Generar historial de visitas
        const visitsHTML = petRecords.map(record => `
            <div class="visit-record">
                <div class="visit-date">
                    <i class="fas fa-calendar"></i>
                    ${formatDateInArgentina(record.date)}
                </div>
                <div class="visit-details">
                    <div class="visit-diagnosis">
                        <strong>Diagnóstico:</strong> ${record.diagnosis}
                    </div>
                    <div class="visit-treatment">
                        <strong>Tratamiento:</strong> ${record.treatment}
                    </div>
                    ${record.applied_medications ? `
                        <div class="visit-medications">
                            <strong>Medicamentos aplicados:</strong>
                            <ul>
                                ${record.applied_medications.map(med => `<li>${med.name}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                ${(record.next_appointment || record.nextAppointment) ? `
                    <div class="visit-next-appointment">
                        <i class="fas fa-clock"></i>
                        Próxima cita: ${formatDateInArgentina(record.next_appointment || record.nextAppointment)}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        return `
            <div class="pet-file-card">
                <div class="pet-file-header">
                    <div class="pet-info">
                        <h3>
                            <i class="fas fa-paw"></i>
                            ${petName}
                        </h3>
                        <div class="owner-info">
                            <i class="fas fa-user"></i>
                            ${clientInfo}${clientContact}
                        </div>
                    </div>
                    <div class="pet-stats">
                        <div class="stat-item">
                            <span class="stat-number">${petRecords.length}</span>
                            <span class="stat-label">Visitas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${upcomingAppointments.length}</span>
                            <span class="stat-label">Citas Pendientes</span>
                        </div>
                    </div>
                </div>
                
                <div class="pet-file-content">
                    <div class="file-section">
                        <h4>
                            <i class="fas fa-history"></i>
                            Historial de Visitas
                        </h4>
                        <div class="visits-timeline">
                            ${visitsHTML}
                        </div>
                    </div>
                    
                    ${upcomingAppointments.length > 0 ? `
                        <div class="file-section">
                            <h4>
                                <i class="fas fa-calendar-check"></i>
                                Próximas Citas
                            </h4>
                            <div class="upcoming-appointments">
                                ${upcomingAppointments.map(record => `
                                    <div class="appointment-card">
                                        <div class="appointment-date">
                                            ${formatDateInArgentina(record.next_appointment || record.nextAppointment)}
                                        </div>
                                        <div class="appointment-reason">
                                            Seguimiento: ${record.diagnosis}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    resultsContainer.innerHTML = petsHTML;
}

// Función para mostrar modal de nueva venta
function showNewSaleModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>
                <i class="fas fa-plus"></i>
                Nueva Venta
            </h2>
            
            <div class="new-sale-form">
                <div class="product-selector">
                    <h3>Seleccionar Productos</h3>
                    <div class="search-container">
                        <input type="text" id="productSearchSale" placeholder="Buscar productos..." onkeyup="searchProductsForSale()">
                    </div>
                    
                    <div class="products-grid" id="productsGrid">
                        ${inventory.map(product => `
                            <div class="product-card" data-product-id="${product.id}">
                                <div class="product-name">${product.name}</div>
                                <div class="product-details">
                                    <span class="product-category">${product.category}</span>
                                    <span class="product-stock">Stock: ${product.stock}</span>
                                    <span class="product-price">$${parseFloat(product.price || 0).toFixed(2)}</span>
                                </div>
                                <div class="product-actions">
                                    <button class="btn btn-sm btn-success" onclick="addToSaleCart(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
                                        <i class="fas fa-plus"></i>
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="sale-cart">
                    <h3>Carrito de Venta</h3>
                    <div id="saleCartItems">
                        <p>No hay productos en el carrito</p>
                    </div>
                    
                    <div class="sale-total">
                        <strong>Total: $<span id="saleTotal">0.00</span></strong>
                    </div>
                    
                    <div class="sale-notes">
                        <label>Notas (opcional):</label>
                        <textarea id="saleNotes" placeholder="Agregar notas sobre la venta..."></textarea>
                    </div>
                    
                    <div class="sale-actions">
                        <button class="btn btn-success" onclick="processSaleFromModal()" id="processSaleBtn" disabled>
                            <i class="fas fa-cash-register"></i>
                            Procesar Venta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Funciones para EMR
function showAddRecordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Crear opciones de clientes
    const clientOptions = clients.map(client => 
        `<option value="${client.id}">${client.name}</option>`
    ).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Nuevo Registro Médico</h2>
            <form id="addRecordForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre de la Mascota:</label>
                        <input type="text" id="petName" list="existingPets" required>
                        <datalist id="existingPets">
                            ${pets.map(pet => `<option data-id="${pet.id}" value="${pet.name}">${pet.name} (${pet.species}) - ${pet.client_name || 'Sin propietario'}</option>`).join('')}
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label>Propietario:</label>
                        <input type="text" id="ownerName" list="existingClients" placeholder="Escribir nombre del propietario..." required>
                        <datalist id="existingClients">
                            ${clients.map(client => `<option value="${client.name}">${client.name} - ${client.email || 'Sin email'}</option>`).join('')}
                        </datalist>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email del Propietario (opcional):</label>
                        <input type="email" id="ownerEmail" placeholder="email@ejemplo.com">
                    </div>
                    <div class="form-group">
                        <label>Teléfono del Propietario (opcional):</label>
                        <input type="tel" id="ownerPhone" placeholder="+1234567890">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" id="date" required>
                    </div>
                    <div class="form-group">
                        <label>Próxima Cita (opcional):</label>
                        <input type="date" id="nextAppointment">
                    </div>
                </div>
                <div class="form-group">
                    <label>Diagnóstico:</label>
                    <textarea id="diagnosis" rows="6" placeholder="Describe detalladamente el diagnóstico, síntomas observados, resultados de exámenes, etc. Puedes escribir tanto como necesites..." required></textarea>
                </div>
                <div class="form-group">
                    <label>Tratamiento:</label>
                    <textarea id="treatment" rows="6" placeholder="Detalla el tratamiento prescrito, medicamentos, dosis, instrucciones especiales, cuidados post-tratamiento, etc. Incluye toda la información necesaria..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Vacunas y Medicamentos Aplicados:</label>
                    <div class="medications-section">
                        <div class="medications-search">
                            <input type="text" id="medicationSearch" placeholder="Buscar vacunas/medicamentos..." onkeyup="searchMedications()">
                        </div>
                        <div class="medications-grid" id="medicationsGrid">
                            ${inventory.filter(item => item.category === 'Vacunas' || item.category === 'Medicamentos').map(item => `
                                <div class="medication-item">
                                    <label class="medication-checkbox">
                                        <input type="checkbox" name="appliedMedications" value="${item.id}" data-name="${item.name}" data-stock="${item.stock}">
                                        <span class="checkmark"></span>
                                        <div class="medication-info">
                                            <span class="medication-name">${item.name}</span>
                                            <span class="medication-stock">Stock: ${item.stock}</span>
                                            <span class="medication-category">${item.category}</span>
                                        </div>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                        <div class="applied-medications-summary" id="appliedMedicationsSummary">
                            <h4>Medicamentos Seleccionados:</h4>
                            <div id="selectedMedicationsList"></div>
                        </div>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-success">Guardar Registro</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Configurar listeners para medicamentos
    setupMedicationListeners();
    
    document.getElementById('addRecordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Recopilar medicamentos seleccionados
        const selectedMedications = [];
        const checkedMedications = document.querySelectorAll('input[name="appliedMedications"]:checked');
        checkedMedications.forEach(checkbox => {
            selectedMedications.push({
                id: parseInt(checkbox.value),
                name: checkbox.dataset.name,
                stock: parseInt(checkbox.dataset.stock)
            });
        });
        
        const newRecord = {
            petName: document.getElementById('petName').value,
            ownerName: document.getElementById('ownerName').value,
            ownerEmail: document.getElementById('ownerEmail').value || null,
            ownerPhone: document.getElementById('ownerPhone').value || null,
            date: document.getElementById('date').value,
            diagnosis: document.getElementById('diagnosis').value,
            treatment: document.getElementById('treatment').value,
            nextAppointment: document.getElementById('nextAppointment').value || null,
            appliedMedications: selectedMedications
        };
        
        // Determinar pet_id
        const petNameInput = document.getElementById('petName');
        const selectedOption = document.querySelector(`#existingPets option[value="${petNameInput.value}"]`);
        const petId = selectedOption ? parseInt(selectedOption.dataset.id) : null;
        
        newRecord.petId = petId;
        
        try {
            await api.createMedicalRecord(newRecord);
            await loadDataFromAPI(); // Recargar datos
            closeModal();
            loadSection('emr');
            refreshCalendar(); // Refrescar calendario si está abierto
            showNotification('Registro médico creado exitosamente');
        } catch (error) {
            alert('Error al crear el registro: ' + error.message);
        }
    });
}

// Función para búsqueda de productos
function searchProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const table = document.getElementById('inventoryTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let found = false;
        
        // Buscar en nombre, categoría, proveedor y código de barras
        for (let j = 0; j < cells.length - 1; j++) { // -1 para excluir la columna de acciones
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        row.style.display = found ? '' : 'none';
    }
}

// Variable global para el carrito de ventas
let salesCart = [];

// Función para manejar entrada de código de barras
function handleBarcodeInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addToCart();
    }
}

// Función para agregar producto al carrito por código de barras
async function addToCart() {
    const barcodeInput = document.getElementById('barcodeInput');
    const barcode = barcodeInput.value.trim();
    
    if (!barcode) {
        alert('Por favor, ingrese un código de barras');
        return;
    }
    
    try {
        const product = await api.getProductByBarcode(barcode);
        addProductToCart(product.id);
        barcodeInput.value = '';
    } catch (error) {
        if (error.message.includes('Producto no encontrado')) {
            alert('Producto no encontrado. Verifique el código de barras.');
        } else {
            alert('Error al buscar el producto: ' + error.message);
        }
    }
}

// Función para agregar producto al carrito por ID
function addProductToCart(productId) {
    const product = inventory.find(item => item.id === productId);
    
    if (!product) {
        alert('Producto no encontrado');
        return;
    }
    
    if (product.stock <= 0) {
        alert('Producto sin stock disponible');
        return;
    }
    
    // Verificar si el producto ya está en el carrito
    const existingItem = salesCart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
        } else {
            alert('No hay más stock disponible de este producto');
            return;
        }
    } else {
        salesCart.push({
            id: product.id,
            name: product.name,
            category: product.category,
            stock: product.stock,
            barcode: product.barcode,
            quantity: 1,
            price: 0 // Se puede agregar precio más tarde
        });
    }
    
    updateCartUI();
    showNotification(`${product.name} agregado al carrito`);
}

// Función para actualizar la interfaz del carrito
function updateCartUI() {
    const cartCount = salesCart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Función para mostrar notificación
function showNotification(message) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Función para mostrar el carrito de ventas
function showSalesCart() {
    if (salesCart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>
                <i class="fas fa-shopping-cart"></i>
                Carrito de Ventas
            </h2>
            <div class="cart-items">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock Disponible</th>
                            <th>Cantidad</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="cartItemsBody">
                        ${generateCartItemsHTML()}
                    </tbody>
                </table>
            </div>
            <div class="cart-summary">
                <div class="cart-total">
                    <strong>Total de productos: ${salesCart.reduce((total, item) => total + item.quantity, 0)}</strong>
                </div>
                <div class="cart-actions">
                    <button class="btn btn-secondary" onclick="clearCart()">
                        <i class="fas fa-trash"></i>
                        Vaciar Carrito
                    </button>
                    <button class="btn btn-success" onclick="processSale()">
                        <i class="fas fa-cash-register"></i>
                        Procesar Venta
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// Función para generar HTML de los items del carrito
function generateCartItemsHTML() {
    return salesCart.map(item => `
        <tr>
            <td>
                <strong>${item.name}</strong>
                ${item.barcode ? `<br><small>Código: ${item.barcode}</small>` : ''}
            </td>
            <td>${item.category}</td>
            <td>${item.stock} unidades</td>
            <td>
                <div class="quantity-controls">
                    <button class="btn btn-sm btn-outline-secondary" onclick="changeCartItemQuantity(${item.id}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="changeCartItemQuantity(${item.id}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función para cambiar cantidad de un item en el carrito
function changeCartItemQuantity(productId, change) {
    const item = salesCart.find(item => item.id === productId);
    
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > item.stock) {
        alert('No hay suficiente stock disponible');
        return;
    }
    
    item.quantity = newQuantity;
    
    // Actualizar la tabla del carrito
    const cartBody = document.getElementById('cartItemsBody');
    if (cartBody) {
        cartBody.innerHTML = generateCartItemsHTML();
    }
    
    // Actualizar el total
    const totalElement = document.querySelector('.cart-total strong');
    if (totalElement) {
        totalElement.textContent = `Total de productos: ${salesCart.reduce((total, item) => total + item.quantity, 0)}`;
    }
    
    updateCartUI();
}

// Función para remover item del carrito
function removeFromCart(productId) {
    const index = salesCart.findIndex(item => item.id === productId);
    
    if (index > -1) {
        salesCart.splice(index, 1);
        
        // Actualizar la tabla del carrito
        const cartBody = document.getElementById('cartItemsBody');
        if (cartBody) {
            cartBody.innerHTML = generateCartItemsHTML();
        }
        
        // Actualizar el total
        const totalElement = document.querySelector('.cart-total strong');
        if (totalElement) {
            totalElement.textContent = `Total de productos: ${salesCart.reduce((total, item) => total + item.quantity, 0)}`;
        }
        
        updateCartUI();
        
        // Si el carrito está vacío, cerrar el modal
        if (salesCart.length === 0) {
            closeModal();
        }
    }
}

// Función para vaciar el carrito
function clearCart() {
    if (confirm('¿Está seguro de que desea vaciar el carrito?')) {
        salesCart = [];
        updateCartUI();
        closeModal();
    }
}

// Función para procesar la venta
async function processSale() {
    if (salesCart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    // Mostrar confirmación
    const totalItems = salesCart.reduce((total, item) => total + item.quantity, 0);
    const itemsList = salesCart.map(item => `• ${item.name} (${item.quantity} unidades)`).join('\n');
    
    const confirmMessage = `¿Confirmar la venta?\n\nProductos a vender:\n${itemsList}\n\nTotal: ${totalItems} productos`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Mostrar indicador de carga
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i>
                Procesando venta...
            </div>
        `;
        document.querySelector('.modal-content').appendChild(loadingDiv);
        
        // Preparar items para la venta
        const saleItems = salesCart.map(item => ({
            productId: item.id,
            quantity: item.quantity
        }));
        
        // Crear la venta usando el nuevo endpoint
        const result = await api.createSale(saleItems, 'Venta desde inventario');
        
        // Mostrar resultado exitoso
        alert(`✅ VENTA PROCESADA EXITOSAMENTE\n\nID de venta: ${result.id}\nTotal: $${result.totalAmount.toFixed(2)}\nProductos: ${result.totalItems} unidades`);
        
        // Limpiar carrito
        salesCart = [];
        updateCartUI();
        closeModal();
        
        // Recargar datos
        await loadDataFromAPI();
        
        // Recargar la sección actual
        if (currentSection === 'inventory') {
            loadSection('inventory');
        } else if (currentSection === 'sales') {
            loadSection('sales');
        }
        
    } catch (error) {
        alert('Error al procesar la venta: ' + error.message);
    }
}

// Funciones para Inventario
function showAddInventoryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Agregar Producto al Inventario</h2>
            <form id="addInventoryForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre del Producto:</label>
                        <input type="text" id="productName" required>
                    </div>
                    <div class="form-group">
                        <label>Categoría:</label>
                        <select id="category" required>
                            <option value="">Seleccionar...</option>
                            <option value="Medicamentos">Medicamentos</option>
                            <option value="Vacunas">Vacunas</option>
                            <option value="Suministros">Suministros</option>
                            <option value="Alimento">Alimento</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Stock:</label>
                        <input type="number" id="stock" required>
                    </div>
                    <div class="form-group">
                        <label>Stock Mínimo:</label>
                        <input type="number" id="minStock" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha de Vencimiento:</label>
                        <input type="date" id="expiryDate" required>
                    </div>
                    <div class="form-group">
                        <label>Proveedor:</label>
                        <input type="text" id="supplier" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Código de Barras:</label>
                    <input type="text" id="barcode" placeholder="Opcional">
                </div>
                <button type="submit" class="btn btn-success">Agregar Producto</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('addInventoryForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newItem = {
            name: document.getElementById('productName').value,
            category: document.getElementById('category').value,
            stock: parseInt(document.getElementById('stock').value),
            minStock: parseInt(document.getElementById('minStock').value),
            expiryDate: document.getElementById('expiryDate').value,
            supplier: document.getElementById('supplier').value,
            barcode: document.getElementById('barcode').value || null
        };
        
        try {
            await api.createInventoryItem(newItem);
            await loadDataFromAPI(); // Recargar datos
            closeModal();
            loadSection('inventory');
        } catch (error) {
            alert('Error al agregar el producto: ' + error.message);
        }
    });
}

// Funciones para Comunicación
function showEmailModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Enviar Email</h2>
            <form id="emailForm">
                <div class="form-group">
                    <label>Cliente:</label>
                    <select id="emailClient" required>
                        <option value="">Seleccionar cliente...</option>
                        ${clients.map(client => `<option value="${client.id}">${client.name} - ${client.email || 'Sin email'}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Asunto:</label>
                    <input type="text" id="emailSubject" required>
                </div>
                <div class="form-group">
                    <label>Mensaje:</label>
                    <textarea id="emailMessage" rows="6" required></textarea>
                </div>
                <button type="submit" class="btn btn-success" id="sendEmailBtn">
                    <i class="fas fa-envelope"></i>
                    Enviar Email
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('emailForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const sendBtn = document.getElementById('sendEmailBtn');
        const originalContent = sendBtn.innerHTML;
        
        // Deshabilitar botón y mostrar indicador de carga
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        sendBtn.style.opacity = '0.7';
        
        const clientId = document.getElementById('emailClient').value;
        const subject = document.getElementById('emailSubject').value;
        const message = document.getElementById('emailMessage').value;
        
        const newCommunication = {
            clientId: parseInt(clientId),
            type: 'email',
            subject: subject,
            message: message
        };
        
        try {
            const result = await api.createCommunication(newCommunication);
            
            if (result.emailResult && result.emailResult.success) {
                alert(`✅ Email enviado exitosamente a ${result.clientName} (${result.clientEmail})`);
            } else {
                alert(`⚠️ Email guardado pero no se pudo enviar: ${result.emailResult?.message || 'Error desconocido'}`);
            }
            
            await loadDataFromAPI(); // Recargar datos
            closeModal();
            loadSection('communication');
        } catch (error) {
            alert('❌ Error al enviar email: ' + error.message);
        } finally {
            // Restaurar botón
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalContent;
            sendBtn.style.opacity = '1';
        }
    });
}

function showSMSModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Enviar SMS</h2>
            <form id="smsForm">
                <div class="form-group">
                    <label>Cliente:</label>
                    <select id="smsClient" required>
                        <option value="">Seleccionar cliente...</option>
                        ${clients.map(client => `<option value="${client.id}">${client.name} - ${client.phone || 'Sin teléfono'}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Mensaje:</label>
                    <textarea id="smsMessage" rows="4" maxlength="160" required></textarea>
                    <small>Máximo 160 caracteres</small>
                </div>
                <button type="submit" class="btn btn-success" id="sendSMSBtn">
                    <i class="fas fa-sms"></i>
                    Enviar SMS
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('smsForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const sendBtn = document.getElementById('sendSMSBtn');
        const originalContent = sendBtn.innerHTML;
        
        // Deshabilitar botón y mostrar indicador de carga
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        sendBtn.style.opacity = '0.7';
        
        const clientId = document.getElementById('smsClient').value;
        const message = document.getElementById('smsMessage').value;
        
        const newCommunication = {
            clientId: parseInt(clientId),
            type: 'sms',
            subject: 'SMS',
            message: message
        };
        
        try {
            const result = await api.createCommunication(newCommunication);
            
            if (result.smsResult && result.smsResult.success) {
                if (result.smsResult.messageId.startsWith('simulated')) {
                    alert(`⚠️ SMS simulado enviado a ${result.clientName}\n📱 Para envío real, configura Vonage en el archivo .env`);
                } else {
                    alert(`✅ SMS enviado exitosamente a ${result.clientName} (${result.clientPhone})`);
                }
            } else {
                alert(`❌ Error al enviar SMS: ${result.smsResult?.message || 'Error desconocido'}`);
            }
            
            await loadDataFromAPI(); // Recargar datos
            closeModal();
            loadSection('communication');
        } catch (error) {
            alert('❌ Error al enviar SMS: ' + error.message);
        } finally {
            // Restaurar botón
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalContent;
            sendBtn.style.opacity = '1';
        }
    });
}

// Funciones auxiliares
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function logout() {
    api.logout();
    location.reload();
}

async function deleteRecord(id) {
    if (confirm('¿Está seguro de que desea eliminar este registro?')) {
        try {
            await api.deleteMedicalRecord(id);
            await loadDataFromAPI(); // Recargar datos
            loadSection('emr');
        } catch (error) {
            alert('Error al eliminar el registro: ' + error.message);
        }
    }
}

async function deleteInventoryItem(id) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        try {
            await api.deleteInventoryItem(id);
            await loadDataFromAPI(); // Recargar datos
            loadSection('inventory');
        } catch (error) {
            alert('Error al eliminar el producto: ' + error.message);
        }
    }
}

// Funciones para gestionar clientes
function showAddClientModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Agregar Cliente</h2>
            <form id="addClientForm">
                <div class="form-group">
                    <label>Nombre:</label>
                    <input type="text" id="clientName" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="clientEmail">
                </div>
                <div class="form-group">
                    <label>Teléfono:</label>
                    <input type="tel" id="clientPhone">
                </div>
                <div class="form-group">
                    <label>Dirección:</label>
                    <textarea id="clientAddress" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-success">Agregar Cliente</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('addClientForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newClient = {
            name: document.getElementById('clientName').value,
            email: document.getElementById('clientEmail').value,
            phone: document.getElementById('clientPhone').value,
            address: document.getElementById('clientAddress').value
        };
        
        try {
            await api.createClient(newClient);
            await loadDataFromAPI(); // Recargar datos
            closeModal();
            loadSection('clients');
        } catch (error) {
            alert('Error al agregar el cliente: ' + error.message);
        }
    });
}

async function deleteClient(id) {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        try {
            await api.deleteClient(id);
            await loadDataFromAPI(); // Recargar datos
            loadSection('clients');
        } catch (error) {
            alert('Error al eliminar el cliente: ' + error.message);
        }
    }
}

function editClient(id) {
    // Encontrar el cliente por ID
    const client = clients.find(c => c.id === id);
    if (!client) {
        alert('Cliente no encontrado');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Editar Cliente</h2>
            <form id="editClientForm">
                <div class="form-group">
                    <label>Nombre:</label>
                    <input type="text" id="editClientName" value="${client.name}" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="editClientEmail" value="${client.email || ''}">
                </div>
                <div class="form-group">
                    <label>Teléfono:</label>
                    <input type="tel" id="editClientPhone" value="${client.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Dirección:</label>
                    <textarea id="editClientAddress" rows="3">${client.address || ''}</textarea>
                </div>
                <button type="submit" class="btn btn-success">Actualizar Cliente</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('editClientForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const updatedClient = {
            name: document.getElementById('editClientName').value,
            email: document.getElementById('editClientEmail').value,
            phone: document.getElementById('editClientPhone').value,
            address: document.getElementById('editClientAddress').value
        };
        
        try {
            await api.updateClient(id, updatedClient);
            await loadDataFromAPI(); // Recargar datos
            closeModal();
            loadSection('clients');
        } catch (error) {
            alert('Error al actualizar el cliente: ' + error.message);
        }
    });
}

// Funciones para editar registros médicos
function editRecord(id) {
    // Encontrar el registro por ID
    const record = medicalRecords.find(r => r.id === id);
    if (!record) {
        alert('Registro no encontrado');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Editar Registro Médico</h2>
            <form id="editRecordForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nombre de la Mascota:</label>
                        <input type="text" id="editPetName" list="existingPetsEdit" value="${record.pet_name || record.petName || ''}" required>
                        <datalist id="existingPetsEdit">
                            ${pets.map(pet => `<option data-id="${pet.id}" value="${pet.name}">${pet.name} (${pet.species}) - ${pet.client_name || 'Sin propietario'}</option>`).join('')}
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label>Propietario:</label>
                        <input type="text" id="editOwnerName" list="existingClientsEdit" value="${record.owner || ''}" placeholder="Escribir nombre del propietario..." required>
                        <datalist id="existingClientsEdit">
                            ${clients.map(client => `<option value="${client.name}">${client.name} - ${client.email || 'Sin email'}</option>`).join('')}
                        </datalist>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Email del Propietario (opcional):</label>
                        <input type="email" id="editOwnerEmail" value="${record.client_email || ''}" placeholder="email@ejemplo.com">
                    </div>
                    <div class="form-group">
                        <label>Teléfono del Propietario (opcional):</label>
                        <input type="tel" id="editOwnerPhone" value="${record.client_phone || ''}" placeholder="+1234567890">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" id="editDate" value="${record.date || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Próxima Cita (opcional):</label>
                        <input type="date" id="editNextAppointment" value="${record.next_appointment || record.nextAppointment || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Diagnóstico:</label>
                    <textarea id="editDiagnosis" rows="6" placeholder="Describe detalladamente el diagnóstico, síntomas observados, resultados de exámenes, etc. Puedes escribir tanto como necesites..." required>${record.diagnosis || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Tratamiento:</label>
                    <textarea id="editTreatment" rows="6" placeholder="Detalla el tratamiento prescrito, medicamentos, dosis, instrucciones especiales, cuidados post-tratamiento, etc. Incluye toda la información necesaria..." required>${record.treatment || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Vacunas y Medicamentos Aplicados:</label>
                    <div class="medications-section">
                        <div class="medications-search">
                            <input type="text" id="editMedicationSearch" placeholder="Buscar vacunas/medicamentos..." onkeyup="searchEditMedications()">
                        </div>
                        <div class="medications-grid" id="editMedicationsGrid">
                            ${inventory.filter(item => item.category === 'Vacunas' || item.category === 'Medicamentos').map(item => {
                                const isSelected = record.applied_medications && record.applied_medications.some(med => med.id === item.id);
                                return `
                                    <div class="medication-item">
                                        <label class="medication-checkbox">
                                            <input type="checkbox" name="editAppliedMedications" value="${item.id}" data-name="${item.name}" data-stock="${item.stock}" ${isSelected ? 'checked' : ''}>
                                            <span class="checkmark"></span>
                                            <div class="medication-info">
                                                <span class="medication-name">${item.name}</span>
                                                <span class="medication-stock">Stock: ${item.stock}</span>
                                                <span class="medication-category">${item.category}</span>
                                            </div>
                                        </label>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="applied-medications-summary" id="editAppliedMedicationsSummary">
                            <h4>Medicamentos Seleccionados:</h4>
                            <div id="editSelectedMedicationsList"></div>
                        </div>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-success">Actualizar Registro</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Configurar listeners para medicamentos en edición
    setupEditMedicationListeners();
    
    document.getElementById('editRecordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Recopilar medicamentos seleccionados
        const selectedMedications = [];
        const checkedMedications = document.querySelectorAll('input[name="editAppliedMedications"]:checked');
        checkedMedications.forEach(checkbox => {
            selectedMedications.push({
                id: parseInt(checkbox.value),
                name: checkbox.dataset.name,
                stock: parseInt(checkbox.dataset.stock)
            });
        });
        
        const updatedRecord = {
            petName: document.getElementById('editPetName').value,
            ownerName: document.getElementById('editOwnerName').value,
            ownerEmail: document.getElementById('editOwnerEmail').value || null,
            ownerPhone: document.getElementById('editOwnerPhone').value || null,
            date: document.getElementById('editDate').value,
            diagnosis: document.getElementById('editDiagnosis').value,
            treatment: document.getElementById('editTreatment').value,
            nextAppointment: document.getElementById('editNextAppointment').value || null,
            appliedMedications: selectedMedications
        };
        
        // Determinar pet_id
        const petNameInput = document.getElementById('editPetName');
        const selectedOption = document.querySelector(`#existingPetsEdit option[value="${petNameInput.value}"]`);
        const petId = selectedOption ? parseInt(selectedOption.dataset.id) : null;
        
        updatedRecord.petId = petId;
        
        try {
            await api.updateMedicalRecord(id, updatedRecord);
            await loadDataFromAPI(); // Recargar datos
            closeModal();
            loadSection('emr');
            refreshCalendar(); // Refrescar calendario si está abierto
            showNotification('Registro médico actualizado exitosamente');
        } catch (error) {
            alert('Error al actualizar el registro: ' + error.message);
        }
    });
}

function editInventoryItem(id) {
    alert('Función de edición en desarrollo');
}

// Variables para el carrito de ventas del modal
let saleCartModal = [];

// Función para buscar productos en el modal de nueva venta
function searchProductsForSale() {
    const searchTerm = document.getElementById('productSearchSale').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('.product-name').textContent.toLowerCase();
        const productCategory = card.querySelector('.product-category').textContent.toLowerCase();
        
        if (productName.includes(searchTerm) || productCategory.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Función para agregar producto al carrito del modal
function addToSaleCart(productId) {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = saleCartModal.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('No hay suficiente stock disponible');
            return;
        }
    } else {
        saleCartModal.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price || 0),
            quantity: 1,
            maxStock: product.stock
        });
    }
    
    updateSaleCartModal();
}

// Función para actualizar el carrito del modal
function updateSaleCartModal() {
    const cartContainer = document.getElementById('saleCartItems');
    const totalElement = document.getElementById('saleTotal');
    const processBtnElement = document.getElementById('processSaleBtn');
    
    if (saleCartModal.length === 0) {
        cartContainer.innerHTML = '<p>No hay productos en el carrito</p>';
        totalElement.textContent = '0.00';
        processBtnElement.disabled = true;
        return;
    }
    
    let total = 0;
    const cartHTML = saleCartModal.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="sale-cart-item">
                <div class="sale-cart-item-info">
                    <div class="sale-cart-item-name">${item.name}</div>
                    <div class="sale-cart-item-price">$${item.price.toFixed(2)} c/u</div>
                </div>
                <div class="sale-cart-item-controls">
                    <button class="btn btn-sm btn-secondary" onclick="changeSaleCartQuantity(${item.id}, -1)">-</button>
                    <span class="sale-cart-item-quantity">${item.quantity}</span>
                    <button class="btn btn-sm btn-secondary" onclick="changeSaleCartQuantity(${item.id}, 1)" ${item.quantity >= item.maxStock ? 'disabled' : ''}>+</button>
                    <button class="btn btn-sm btn-danger" onclick="removeFromSaleCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    cartContainer.innerHTML = cartHTML;
    totalElement.textContent = total.toFixed(2);
    processBtnElement.disabled = false;
}

// Función para cambiar cantidad en el carrito del modal
function changeSaleCartQuantity(productId, change) {
    const item = saleCartModal.find(item => item.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromSaleCart(productId);
    } else if (newQuantity <= item.maxStock) {
        item.quantity = newQuantity;
        updateSaleCartModal();
    }
}

// Función para remover producto del carrito del modal
function removeFromSaleCart(productId) {
    saleCartModal = saleCartModal.filter(item => item.id !== productId);
    updateSaleCartModal();
}

// Función para procesar venta desde el modal
async function processSaleFromModal() {
    if (saleCartModal.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    const notes = document.getElementById('saleNotes').value.trim();
    const total = saleCartModal.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const confirmMessage = `¿Confirmar la venta?\n\nTotal: $${total.toFixed(2)}\nProductos: ${saleCartModal.length} tipos\nCantidad total: ${saleCartModal.reduce((sum, item) => sum + item.quantity, 0)} unidades`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Preparar items para la venta
        const saleItems = saleCartModal.map(item => ({
            productId: item.id,
            quantity: item.quantity
        }));
        
        // Crear la venta
        const result = await api.createSale(saleItems, notes);
        
        // Mostrar resultado exitoso
        alert(`✅ VENTA PROCESADA EXITOSAMENTE\n\nID de venta: ${result.id}\nTotal: $${result.totalAmount.toFixed(2)}\nProductos: ${result.totalItems} unidades`);
        
        // Limpiar carrito del modal
        saleCartModal = [];
        
        // Cerrar modal
        closeModal();
        
        // Recargar datos
        await loadDataFromAPI();
        
        // Recargar la sección de ventas
        loadSection('sales');
        
    } catch (error) {
        alert('Error al procesar la venta: ' + error.message);
    }
}

// Función para refrescar el calendario
function refreshCalendar() {
    if (currentSection === 'calendar') {
        console.log('🔄 Refrescando calendario...');
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.innerHTML = getCalendarContent();
            console.log('✅ Calendario refrescado');
        }
    }
}

// Función para navegar al mes actual
function navigateToToday() {
    const today = new Date();
    navigateToMonth(today.getMonth(), today.getFullYear());
}

// Función para navegar directamente a agosto 2025 (para testing)
function navigateToAugust2025() {
    navigateToMonth(7, 2025); // Agosto = 7 (0-indexed)
    console.log('📅 Navegando a agosto 2025 para testing');
}

// Función de debug simple para inspeccionar datos
function simpleDebug() {
    console.log('=== DEBUG SIMPLE ===');
    
    if (medicalRecords.length === 0) {
        console.log('❌ No hay registros médicos cargados');
        alert('No hay registros médicos cargados. Verifica la conexión a la API.');
        return;
    }
    
    const record = medicalRecords[0];
    console.log('📋 Primer registro médico:', record);
    console.log('📋 Claves del registro:', Object.keys(record));
    
    // Verificar ambas posibles formas de la fecha
    const nextApp1 = record.next_appointment;
    const nextApp2 = record.nextAppointment;
    
    console.log('📅 next_appointment:', nextApp1, typeof nextApp1);
    console.log('📅 nextAppointment:', nextApp2, typeof nextApp2);
    
    // Probar la comparación directa
    const targetDate = '2025-08-14';
    console.log('🎯 Fecha objetivo:', targetDate);
    console.log('🇦🇷 Fecha actual Argentina:', getArgentinaDate());
    console.log('🔍 Comparación 1 (raw):', nextApp1 === targetDate);
    console.log('🔍 Comparación 2 (raw):', nextApp2 === targetDate);
    console.log('🔍 Comparación 1 (normalized):', normalizeDate(nextApp1) === targetDate);
    console.log('🔍 Comparación 2 (normalized):', normalizeDate(nextApp2) === targetDate);
    
    // Verificar si hay espacios o caracteres ocultos
    if (nextApp1) {
        console.log('📏 Longitud next_appointment:', nextApp1.length);
        console.log('📏 Caracteres:', nextApp1.split('').map(c => c.charCodeAt(0)));
    }
    
    if (nextApp2) {
        console.log('📏 Longitud nextAppointment:', nextApp2.length);
        console.log('📏 Caracteres:', nextApp2.split('').map(c => c.charCodeAt(0)));
    }
    
    alert('Debug simple completado. Revisa la consola.');
}

// Función de debug específica para fechas
function debugDateConversion() {
    console.log('=== DEBUG CONVERSIÓN DE FECHAS ===');
    
    if (medicalRecords.length === 0) {
        console.log('❌ No hay registros médicos');
        return;
    }
    
    const record = medicalRecords[0];
    const nextApp = record.next_appointment;
    
    console.log('📅 Fecha original:', nextApp);
    console.log('📅 Tipo:', typeof nextApp);
    
    // Probar diferentes conversiones
    const originalDate = new Date(nextApp);
    console.log('📅 new Date(nextApp):', originalDate);
    console.log('📅 toISOString():', originalDate.toISOString());
    console.log('📅 toDateString():', originalDate.toDateString());
    
    // Conversión a Argentina
    const argDate = getArgentinaDateString(nextApp);
    console.log('📅 getArgentinaDateString():', argDate);
    
    // Conversión normalizada
    const normalized = normalizeDate(nextApp);
    console.log('📅 normalizeDate():', normalized);
    
    // Crear fecha desde string normalizado
    const [year, month, day] = normalized.split('-').map(Number);
    const reconstructed = new Date(year, month - 1, day);
    console.log('📅 Fecha reconstruida:', reconstructed);
    console.log('📅 Fecha reconstruida string:', reconstructed.toDateString());
    
    // Comparar con fecha actual
    const todayArg = getArgentinaDate();
    const todayDate = new Date(todayArg);
    console.log('📅 Hoy en Argentina:', todayArg);
    console.log('📅 Hoy como Date:', todayDate);
    
    alert('Debug de conversión completado. Revisa la consola.');
}

// Función para insertar datos de ejemplo
async function insertSampleData() {
    try {
        const result = await api.insertSampleData();
        showNotification('Mascotas sincronizadas desde EMR exitosamente', 'success');
        
        // Recargar todos los datos
        await loadDataFromAPI();
        
        // Actualizar la vista de fichas
        setTimeout(() => {
            showAllPetsInSearch();
        }, 500);
        
    } catch (error) {
        console.error('Error al sincronizar mascotas:', error);
        showNotification('Error al sincronizar mascotas: ' + error.message, 'error');
    }
}

// Función para mostrar la ficha completa de una mascota