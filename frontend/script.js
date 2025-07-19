// Variables globales
let currentUser = null;
let currentSection = 'emr';

// Función para convertir texto a formato título
String.prototype.toTitleCase = function() {
    return this.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Función de diagnóstico para debuggear problemas
async function diagnosticVolverALista() {
    console.log('🔍 === DIAGNÓSTICO VOLVER A LA LISTA ===');
    
    // 1. Verificar elementos DOM
    console.log('📋 Verificando elementos DOM...');
    const petHistoriaListContainer = document.getElementById('petHistoriaListContainer');
    const allPetsSection = document.getElementById('allPetsHistoriaSection');
    const historiaDetails = document.getElementById('historiaClinicaDetails');
    
    console.log('- petHistoriaListContainer:', !!petHistoriaListContainer);
    console.log('- allPetsSection:', !!allPetsSection);
    console.log('- historiaDetails:', !!historiaDetails);
    
    if (petHistoriaListContainer) {
        console.log('- Contenido actual del container:', petHistoriaListContainer.innerHTML.substring(0, 200));
    }
    
    // 2. Verificar datos
    console.log('📋 Verificando datos...');
    console.log('- migratedPatients.length:', migratedPatients.length);
    console.log('- migratedPatients primeros 2:', migratedPatients.slice(0, 2));
    
    // 3. Verificar API
    console.log('📋 Verificando API...');
    console.log('- api objeto:', typeof api);
    console.log('- api.token:', api?.token ? 'Presente' : 'Ausente');
    
    // 4. Intentar cargar datos
    if (migratedPatients.length === 0) {
        console.log('📋 Intentando cargar datos desde API...');
        try {
            const testData = await api.getMigratedPatients();
            console.log('✅ Datos recibidos:', testData.length);
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
        }
    }
    
    console.log('🔍 === FIN DIAGNÓSTICO ===');
}

// Función de prueba simple para verificar visualización
function testVisualizacion() {
    console.log('🧪 === PRUEBA DE VISUALIZACIÓN ===');
    
    const container = document.getElementById('petHistoriaListContainer');
    if (!container) {
        console.error('❌ No se encontró petHistoriaListContainer');
        return;
    }
    
    // Insertar contenido de prueba simple
    container.innerHTML = '<div style="background: red; padding: 20px; color: white; font-size: 20px;">PRUEBA VISUAL - ¿Puedes ver esto?</div>';
    
    // Verificar visibilidad de todos los contenedores padre
    const allPetsSection = document.getElementById('allPetsHistoriaSection');
    const historiaResults = document.getElementById('historiaResults');
    
    if (allPetsSection) {
        allPetsSection.style.display = 'block';
        allPetsSection.style.visibility = 'visible';
        console.log('✅ allPetsSection forzado a visible');
    }
    
    if (historiaResults) {
        historiaResults.style.display = 'block';
        historiaResults.style.visibility = 'visible';
        console.log('✅ historiaResults forzado a visible');
    }
    
    // Ocultar otros elementos que puedan estar tapando
    const historiaDetails = document.getElementById('historiaClinicaDetails');
    if (historiaDetails) {
        historiaDetails.style.display = 'none';
        console.log('✅ historiaDetails ocultado');
    }
    
    console.log('🧪 Prueba insertada. ¿Ves un recuadro rojo con texto blanco?');
}

// Datos que se cargarán desde la API
let medicalRecords = [];
let inventory = [];
let clients = [];
let communications = [];
let sales = [];
let pets = []; // Nueva variable global para las mascotas
let migratedPatients = []; // Variable global para los pacientes migrados
// Variables para paginación de comunicaciones
let currentCommunicationPage = 1;
let communicationsPerPage = 10;
let filteredCommunications = [];

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
    
    try {
        // Si es un objeto complejo (como los que vienen de la API), extraer el valor real
        if (typeof dateString === 'object' && dateString !== null && !(dateString instanceof Date)) {
            // Intentar extraer el valor real del objeto
            let extractedValue = null;
            
            // Buscar propiedades comunes que podrían contener la fecha (tanto camelCase como snake_case)
            if (dateString.valor !== undefined) {
                extractedValue = dateString.valor;
            } else if (dateString.value !== undefined) {
                extractedValue = dateString.value;
            } else if (dateString.date !== undefined) {
                extractedValue = dateString.date;
            } else if (dateString.createdAt !== undefined) {
                extractedValue = dateString.createdAt;
            } else if (dateString.created_at !== undefined) {
                extractedValue = dateString.created_at;
            } else if (dateString.updatedAt !== undefined) {
                extractedValue = dateString.updatedAt;
            } else if (dateString.updated_at !== undefined) {
                extractedValue = dateString.updated_at;
            } else if (dateString.nextAppointment !== undefined) {
                extractedValue = dateString.nextAppointment;
            } else if (dateString.next_appointment !== undefined) {
                extractedValue = dateString.next_appointment;
            } else if (dateString.valueOf && typeof dateString.valueOf === 'function') {
                extractedValue = dateString.valueOf();
            } else {
                // Si no encontramos un valor específico, intentar convertir el objeto completo
                extractedValue = String(dateString);
            }
            
            // Recursivamente formatear el valor extraído
            if (extractedValue !== null && extractedValue !== undefined) {
                return formatDateInArgentina(extractedValue);
            }
        }
        
        // Si es una cadena, limpiar espacios y caracteres extraños
        if (typeof dateString === 'string') {
            dateString = dateString.trim();
            
            // Si está vacío o es "null", devolver null
            if (!dateString || dateString === 'null' || dateString === 'undefined' || dateString === '[object Object]') {
                return null;
            }
        }
        
        const date = new Date(dateString);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            return null;
        }
        
        // Formatear en zona horaria de Argentina
        return date.toLocaleDateString('es-AR', {
            timeZone: ARGENTINA_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        return null;
    }
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


// Función para cargar datos desde la API (optimizada - lazy loading)
async function loadDataFromAPI() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        console.log('✅ API configurada para carga lazy');
        // Los datos se cargarán cuando se necesiten en cada sección
    } catch (error) {
        console.error('❌ Error al configurar API:', error);
    }
}

// Función para cargar datos de una sección específica
async function loadSectionData(section) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        console.log(`🔄 Cargando datos para sección: ${section}`);
        
        switch (section) {
            case 'emr':
                if (medicalRecords.length === 0) {
                    medicalRecords = await api.getMedicalRecords().catch(() => []);
                    console.log('📋 Datos EMR cargados:', medicalRecords.length);
                }
                break;
            case 'inventory':
                if (inventory.length === 0) {
                    inventory = await api.getInventory().catch(() => []);
                    console.log('📦 Datos inventario cargados:', inventory.length);
                }
                break;
            case 'clients':
                if (clients.length === 0) {
                    clients = await api.getClients().catch(() => []);
                    console.log('👥 Datos clientes cargados:', clients.length);
                }
                break;

            case 'communication':
                if (communications.length === 0) {
                    communications = await api.getCommunications().catch(() => []);
                    console.log('📞 Datos comunicaciones cargados:', communications.length);
                }
                break;
            case 'sales':
                if (sales.length === 0) {
                    sales = await api.getSales().catch(() => []);
                    console.log('💰 Datos ventas cargados:', sales.length);
                }
                break;
            case 'historia-clinica':
                console.log('🔄 Iniciando carga de datos para historia clínica...');
                if (migratedPatients.length === 0) {
                    console.log('🔄 Llamando a api.getMigratedPatients()...');
                    try {
                        migratedPatients = await api.getMigratedPatients();
                        console.log('✅ Datos mascotas migradas cargados exitosamente:', migratedPatients.length);
                    } catch (error) {
                        console.error('❌ Error al cargar mascotas migradas:', error);
                        migratedPatients = [];
                        
                        // No mostrar error aquí, se manejará en showAllPetsInHistoriaClinica
                        console.log('⚠️ Error en loadSectionData será manejado por showAllPetsInHistoriaClinica');
                    }
                } else {
                    console.log('📋 Usando datos ya cargados:', migratedPatients.length);
                }
                break;
        }
    } catch (error) {
        console.error(`❌ Error al cargar datos para ${section}:`, error);
    }
}


// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOMContentLoaded ejecutándose...');
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ Formulario encontrado, agregando listener...');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('❌ Formulario de login no encontrado');
    }
    
    // Verificar si hay sesión activa
    const savedUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');
    
    if (savedUser && authToken) {
        console.log('🔄 Sesión activa encontrada, restaurando...');
        currentUser = JSON.parse(savedUser);
        api.token = authToken;
        
        // Mostrar dashboard sin cargar datos
        showDashboard();
    } else {
        console.log('📝 No hay sesión activa');
    }
});


// Función de login
async function handleLogin(event) {
    console.log('🔄 handleLogin ejecutándose...');
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const loginButton = document.querySelector('.login-btn');
    
    console.log('📝 Datos de login:', { username, password: '***' });
    
    if (!username || !password) {
        console.error('❌ Usuario o contraseña vacíos');
        errorMessage.textContent = 'Por favor, ingresa usuario y contraseña';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Verificar que api existe
    if (!api) {
        console.error('❌ API no está disponible');
        errorMessage.textContent = 'Error: API no disponible';
        errorMessage.style.display = 'block';
        return;
    }
    
    const buttonIcon = loginButton.querySelector('i');
    const buttonText = loginButton.querySelector('.btn-text');
    
    try {
        // Mostrar estado de carga
        loginButton.disabled = true;
        loginButton.classList.add('loading');
        buttonIcon.className = 'fas fa-spinner fa-spin';
        if (buttonText) {
            buttonText.textContent = 'Iniciando sesión...';
        } else {
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        }
        
        // Ocultar mensaje de error previo
        errorMessage.style.display = 'none';
        
        console.log('🔄 Enviando petición de login...');
        
        const response = await api.login(username, password);
        
        console.log('✅ Login exitoso:', response);
        
        currentUser = response.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Actualizar botón a estado de éxito
        buttonIcon.className = 'fas fa-check';
        loginButton.innerHTML = '<i class="fas fa-check"></i> ¡Bienvenido!';
        
        // Configurar API (sin cargar datos)
        await loadDataFromAPI();
        
        console.log('🎯 Mostrando dashboard...');
        showDashboard();
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        
        // Restaurar estado del botón
        loginButton.disabled = false;
        loginButton.classList.remove('loading');
        buttonIcon.className = 'fas fa-sign-in-alt';
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        
        // Mostrar mensaje de error
        errorMessage.textContent = error.message || 'Error al iniciar sesión';
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
                    
                    <button class="nav-btn nav-btn-blue" onclick="loadSection('historia-clinica')">
                        <i class="fas fa-file-medical-alt"></i>
                        Historia Clínica
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
async function loadSection(section) {
    console.log(`🔄 loadSection llamada con: ${section}`);
    currentSection = section;
    
    // Mostrar indicador de carga
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error('❌ content-area no encontrado');
        return;
    }
    
    console.log('📋 Mostrando indicador de carga...');
    contentArea.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    
    // Cargar datos específicos de la sección
    console.log(`📋 Cargando datos para sección: ${section}`);
    await loadSectionData(section);
    
    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activar el botón correspondiente
    const activeBtn = document.querySelector(`[onclick="loadSection('${section}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
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

        case 'historia-clinica':
            console.log('📋 Renderizando contenido de Historia Clínica...');
            const historiaContent = getHistoriaClinicaContent();
            console.log('📋 Contenido generado, longitud:', historiaContent.length);
            contentArea.innerHTML = historiaContent;
            console.log('📋 Contenido insertado en DOM');
            
            // Cargar la lista inicial de mascotas después de renderizar el contenido
            console.log('📋 Programando carga de mascotas en 200ms...');
            setTimeout(async () => {
                console.log('⏰ Timeout ejecutándose, iniciando showAllPetsInHistoriaClinica...');
                try {
                    await showAllPetsInHistoriaClinica();
                    console.log('✅ showAllPetsInHistoriaClinica completado exitosamente');
                } catch (error) {
                    console.error('❌ Error al mostrar mascotas en historia clínica:', error);
                    const container = document.getElementById('petHistoriaListContainer');
                    if (container) {
                        container.innerHTML = `
                            <div class="error-message">
                                <i class="fas fa-exclamation-triangle"></i>
                                <h3>Error al cargar mascotas</h3>
                                <p>${error.message || 'Error al cargar la lista de mascotas'}</p>
                                <button class="btn btn-primary" onclick="showAllPetsInHistoriaClinica()">
                                    <i class="fas fa-refresh"></i> Reintentar
                                </button>
                            </div>
                        `;
                    }
                }
            }, 200); // Aumentar el tiempo para asegurar renderizado completo
            break;
        
        case 'communication':
            contentArea.innerHTML = getCommunicationContent();
            // Inicializar tabla de comunicaciones después de renderizar
            setTimeout(() => {
                updateCommunicationsTable();
            }, 100);
            break;
        case 'calendar':
            contentArea.innerHTML = getCalendarContent();
            refreshCalendar();
            // Debug del calendario después de cargar
            setTimeout(() => {
                console.log('🔍 DEBUG: Verificando datos del calendario después de cargar');
                debugCalendarData();
            }, 1000);
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
                
                <td>${formatDateInArgentina(record.date) || 'N/A'}</td>
                <td>${record.diagnosis}</td>
                <td>${record.treatment}</td>
                
                <td>${record.petName || record.pet_name || 'N/A'}</td>
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
                        <th>Mascota Atendida</th>
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
        const expiryDate = item.expiry_date || item.expiryDate;
        const expiryStatus = expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'status-low' : 'status-good';
        
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.stock}</td>
                
                <td class="${expiryStatus}">${expiryDate ? formatDateInArgentina(expiryDate) : 'N/A'}</td>
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
    
    const expiringItems = inventory.filter(item => {
        const expiryDate = item.expiry_date || item.expiryDate;
        return expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }).length;
    
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
                    <i class="fas fa-clock"></i>
                    <h3>${expiringItems}</h3>
                    <p>Próximos a Vencer</p>
                </div>
            </div>
            
            <!-- Sección de Carrito -->
            <div class="cart-section">
                <h3>Carrito de Ventas</h3>
                <div class="cart-actions">
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
                        <th>Fecha Vencimiento</th>
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

// Variables para paginación de clientes
let currentClientPage = 1;
let clientsPerPage = 25;
let filteredClients = [];

// Contenido de Clientes
function getClientsContent() {
    // Inicializar clientes filtrados
    filteredClients = [...clients];
    
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
            
            <div class="clients-controls">
                <button class="btn btn-success" onclick="showAddClientModal()">
                    <i class="fas fa-plus"></i>
                    Nuevo Cliente
                </button>
                
                <div class="search-container">
                    <input type="text" id="clientSearch" placeholder="Buscar clientes por nombre, email o teléfono..." onkeyup="searchClients()">
                    <i class="fas fa-search search-icon"></i>
                </div>
                
                <div class="pagination-controls">
                    <label>Mostrar:</label>
                    <select id="clientsPerPageSelect" onchange="changeClientsPerPage()">
                        <option value="25">25 por página</option>
                        <option value="50">50 por página</option>
                        <option value="100">100 por página</option>
                    </select>
                </div>
            </div>
            
            <div id="clientsTableContainer">
                ${renderClientsTable()}
            </div>
            
            <div id="clientsPagination">
                ${renderClientsPagination()}
            </div>
        </div>
    `;
}

// Renderizar tabla de clientes
// Función para obtener las mascotas de un cliente
function getClientPets(clientId) {
    return pets.filter(pet => pet.clientId === clientId);
}

// Función para formatear las mascotas como texto
function formatClientPets(clientId) {
    const clientPets = getClientPets(clientId);
    
    if (clientPets.length === 0) {
        return '<span class="no-pets">Sin mascotas</span>';
    }
    
    if (clientPets.length === 1) {
        const pet = clientPets[0];
        return `<span class="pet-info">${pet.name} (${pet.species})</span>`;
    }
    
    // Si tiene múltiples mascotas, mostrar las primeras 2 y un contador
    const firstPets = clientPets.slice(0, 2);
    const petNames = firstPets.map(pet => `${pet.name} (${pet.species})`).join(', ');
    
    if (clientPets.length > 2) {
        return `<span class="pet-info">${petNames} <span class="more-pets">+${clientPets.length - 2} más</span></span>`;
    }
    
    return `<span class="pet-info">${petNames}</span>`;
}

function renderClientsTable() {
    const startIndex = (currentClientPage - 1) * clientsPerPage;
    const endIndex = startIndex + clientsPerPage;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);
    
    const clientsHTML = paginatedClients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.email || 'N/A'}</td>
            <td>${client.phone || 'N/A'}</td>
            <td>${client.address || 'N/A'}</td>
            <td>${formatClientPets(client.id)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editClient(${client.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteClient(${client.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    return `
        <table class="table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Mascotas</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${clientsHTML}
            </tbody>
        </table>
        
        <div class="table-info">
            Mostrando ${startIndex + 1} - ${Math.min(endIndex, filteredClients.length)} de ${filteredClients.length} clientes
        </div>
    `;
}

// Renderizar paginación de clientes
function renderClientsPagination() {
    const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
    
    if (totalPages <= 1) return '';
    
    let paginationHTML = '<div class="pagination">';
    
    // Botón anterior
    if (currentClientPage > 1) {
        paginationHTML += `<button class="btn btn-outline-primary" onclick="goToClientPage(${currentClientPage - 1})">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>`;
    }
    
    // Números de página
    const startPage = Math.max(1, currentClientPage - 2);
    const endPage = Math.min(totalPages, currentClientPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button class="btn btn-outline-primary" onclick="goToClientPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentClientPage ? 'btn-primary' : 'btn-outline-primary';
        paginationHTML += `<button class="btn ${activeClass}" onclick="goToClientPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
        paginationHTML += `<button class="btn btn-outline-primary" onclick="goToClientPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Botón siguiente
    if (currentClientPage < totalPages) {
        paginationHTML += `<button class="btn btn-outline-primary" onclick="goToClientPage(${currentClientPage + 1})">
            Siguiente <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    paginationHTML += '</div>';
    
    return paginationHTML;
}

// Funciones de paginación y búsqueda de clientes
function searchClients() {
    const searchTerm = document.getElementById('clientSearch').value.toLowerCase();
    
    filteredClients = clients.filter(client => {
        return (
            client.name.toLowerCase().includes(searchTerm) ||
            (client.email && client.email.toLowerCase().includes(searchTerm)) ||
            (client.phone && client.phone.toLowerCase().includes(searchTerm))
        );
    });
    
    currentClientPage = 1; // Resetear a primera página
    updateClientsTable();
}

function changeClientsPerPage() {
    clientsPerPage = parseInt(document.getElementById('clientsPerPageSelect').value);
    currentClientPage = 1; // Resetear a primera página
    updateClientsTable();
}

function goToClientPage(page) {
    currentClientPage = page;
    updateClientsTable();
}

function updateClientsTable() {
    const tableContainer = document.getElementById('clientsTableContainer');
    const paginationContainer = document.getElementById('clientsPagination');
    
    if (tableContainer) {
        tableContainer.innerHTML = renderClientsTable();
    }
    
    if (paginationContainer) {
        paginationContainer.innerHTML = renderClientsPagination();
    }
}



// Contenido de Historia Clínica
function getHistoriaClinicaContent() {
    return `
        <div class="section active">
            <h2>Historia Clínica Completa</h2>
            <p>Busca y visualiza toda la información médica de mascotas y clientes</p>
            
            <div class="historia-clinica-search">
                <div class="search-options">
                    <label>
                        <input type="radio" name="historiaSearchType" value="pet" checked onchange="updateHistoriaSearchPlaceholder()">
                        Buscar por mascota
                    </label>
                    <label>
                        <input type="radio" name="historiaSearchType" value="owner" onchange="updateHistoriaSearchPlaceholder()">
                        Buscar por propietario
                    </label>
                </div>
                <div class="search-container-large">
                    <input type="text" id="historiaSearchInput" placeholder="Buscar por nombre de mascota..." oninput="searchPetsForHistoria()">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            
            <div id="historiaResults" class="historia-results">
                <div id="historiaSearchResults" style="display: none;">
                    <h3>Resultados de búsqueda:</h3>
                    <div id="historiaSearchResultsContainer" class="pet-list-container">
                        <!-- Resultados de búsqueda se cargarán aquí -->
                    </div>
                </div>
                <div id="allPetsHistoriaSection">
                    <h3>Todas las Mascotas:</h3>
                    <div id="petHistoriaListContainer" class="pet-list-container">
                        <div class="loading-message">
                            <i class="fas fa-spinner fa-spin"></i>
                            Cargando mascotas...
                        </div>
                    </div>
                </div>
                <p class="no-results-historia" style="display: none;">No se encontraron mascotas que coincidan con la búsqueda.</p>
            </div>
            
            <div id="historiaClinicaDetails" class="historia-clinica-details" style="display: none;">
                <!-- Aquí se mostrará la historia clínica completa -->
            </div>
        </div>
    `;
}

// Variables globales para datos migrados (ya definidas arriba)
// let migratedPatients = []; - Ahora es variable global
// let migratedClients = []; - Por definir si es necesaria

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
    showAllMigratedPets();
}

// Función para actualizar el placeholder del buscador de historia clínica
function updateHistoriaSearchPlaceholder() {
    const searchType = document.querySelector('input[name="historiaSearchType"]:checked').value;
    const searchInput = document.getElementById('historiaSearchInput');
    
    if (searchType === 'pet') {
        searchInput.placeholder = 'Buscar por nombre de mascota...';
    } else {
        searchInput.placeholder = 'Buscar por nombre del propietario...';
    }
    
    // Limpiar búsqueda actual y mostrar todas las mascotas
    searchInput.value = '';
    showAllPetsInHistoriaClinica();
}



// Función para buscar mascotas para historia clínica
async function searchPetsForHistoria() {
    console.log('🔍 searchPetsForHistoria iniciada');
    
    const searchInput = document.getElementById('historiaSearchInput');
    const searchTypeRadio = document.querySelector('input[name="historiaSearchType"]:checked');
    
    if (!searchInput) {
        console.error('❌ Input de búsqueda no encontrado');
        return;
    }
    
    if (!searchTypeRadio) {
        console.error('❌ Tipo de búsqueda no encontrado');
        return;
    }
    
    const searchTerm = searchInput.value.trim();
    const searchType = searchTypeRadio.value;
    
    console.log(`🔍 Término: "${searchTerm}", Tipo: ${searchType}`);
    
    if (searchTerm.length === 0) {
        console.log('📝 Búsqueda vacía, mostrando todas las mascotas');
        // Si no hay término de búsqueda, mostrar todas las mascotas
        document.getElementById('historiaSearchResults').style.display = 'none';
        document.getElementById('allPetsHistoriaSection').style.display = 'block';
        return;
    }
    
    if (searchTerm.length < 2) {
        console.log('📝 Término muy corto, esperando más caracteres');
        // Esperar al menos 2 caracteres para buscar
        return;
    }
    
    try {
        console.log(`🔍 Buscando: "${searchTerm}" por ${searchType}`);
        
        const results = await api.searchMigratedPatients(searchTerm, searchType);
        
        console.log('📋 Resultados de búsqueda para historia clínica:', results.length, 'encontrados');
        console.log('📋 Datos:', results);
        
        // Mostrar resultados de búsqueda
        document.getElementById('allPetsHistoriaSection').style.display = 'none';
        document.getElementById('historiaSearchResults').style.display = 'block';
        
        const searchResultsContainer = document.getElementById('historiaSearchResultsContainer');
        const noResultsMessage = document.querySelector('.no-results-historia');
        
        if (results.length === 0) {
            console.log('❌ No se encontraron resultados');
            searchResultsContainer.innerHTML = '';
            noResultsMessage.style.display = 'block';
        } else {
            console.log('✅ Mostrando', results.length, 'resultados');
            noResultsMessage.style.display = 'none';
            searchResultsContainer.innerHTML = results.map(patient => createPatientCardForHistoria(patient)).join('');
        }
        
    } catch (error) {
        console.error('❌ Error al buscar mascotas para historia clínica:', error);
        document.getElementById('historiaSearchResultsContainer').innerHTML = '<p class="error-message">Error al buscar mascotas. Por favor, intenta nuevamente.</p>';
    }
}

// Función para mostrar todas las mascotas migradas
async function showAllMigratedPets() {
    console.log('🔍 showAllMigratedPets iniciada');
    
    const petListContainer = document.getElementById('petListContainer');
    if (!petListContainer) {
        console.error('❌ Container petListContainer no encontrado');
        return;
    }

    try {
        // Cargar datos si no están cargados
        if (migratedPatients.length === 0) {
            console.log('🔄 Cargando pacientes migrados...');
            petListContainer.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando mascotas...</div>';
            migratedPatients = await api.getMigratedPatients();
            console.log('📋 Pacientes migrados cargados:', migratedPatients.length);
        } else {
            console.log('📋 Usando pacientes ya cargados:', migratedPatients.length);
        }
        
        // Mostrar todas las mascotas
        console.log('🎨 Generando HTML para', migratedPatients.length, 'pacientes');
        petListContainer.innerHTML = migratedPatients.map(patient => createPatientCard(patient)).join('');
        
        // Asegurar que la sección de todas las mascotas esté visible
        const searchResults = document.getElementById('searchResults');
        const allPetsSection = document.getElementById('allPetsSection');
        const noResults = document.querySelector('.no-results-fichas');
        const petFilesResults = document.getElementById('petFilesResults');
        
        if (searchResults) searchResults.style.display = 'none';
        if (allPetsSection) allPetsSection.style.display = 'block';
        if (noResults) noResults.style.display = 'none';
        if (petFilesResults) petFilesResults.innerHTML = '';
        
        console.log('✅ showAllMigratedPets completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar mascotas migradas:', error);
        petListContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar mascotas</h3>
                <p>${error.message || 'Error de conexión con el servidor'}</p>
                <button class="btn btn-primary" onclick="showAllMigratedPets()">
                    <i class="fas fa-refresh"></i> Reintentar
                </button>
            </div>
        `;
    }
}

// Función para mostrar todas las mascotas en la sección de historia clínica
async function showAllPetsInHistoriaClinica() {
    console.log('🔍 showAllPetsInHistoriaClinica iniciada');
    
    // Ejecutar diagnóstico
    await diagnosticVolverALista();
    
    const petHistoriaListContainer = document.getElementById('petHistoriaListContainer');
    if (!petHistoriaListContainer) {
        console.error('❌ Container petHistoriaListContainer no encontrado');
        console.log('📋 Elementos disponibles con ID que contienen "pet":', 
            Array.from(document.querySelectorAll('[id*="pet"]')).map(el => el.id));
        throw new Error('Contenedor de mascotas no encontrado');
    }

    try {
        // Mostrar indicador de carga
        console.log('🔄 Limpiando contenedor y mostrando indicador de carga...');
        petHistoriaListContainer.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando mascotas...</div>';
        console.log('🔄 Indicador de carga insertado:', petHistoriaListContainer.innerHTML);
        
        // Cargar datos si no están cargados
        if (migratedPatients.length === 0) {
            console.log('🔄 Cargando pacientes migrados desde API...');
            migratedPatients = await api.getMigratedPatients();
            console.log('📋 Pacientes migrados cargados:', migratedPatients.length);
        } else {
            console.log('📋 Usando pacientes ya cargados:', migratedPatients.length);
        }
        
        // Verificar si hay datos
        if (!migratedPatients || migratedPatients.length === 0) {
            console.log('⚠️ No hay pacientes migrados disponibles');
            petHistoriaListContainer.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-info-circle"></i>
                    <h3>No hay mascotas disponibles</h3>
                    <p>No se encontraron registros de mascotas en el sistema.</p>
                    <button class="btn btn-primary" onclick="showAllPetsInHistoriaClinica()">
                        <i class="fas fa-refresh"></i> Recargar
                    </button>
                </div>
            `;
        } else {
            // Mostrar todas las mascotas
            console.log('🎨 Generando HTML para', migratedPatients.length, 'pacientes');
            console.log('🔍 Primer paciente de muestra:', migratedPatients[0]);
            
            try {
                const patientsHTML = migratedPatients.map((patient, index) => {
                    try {
                        return createPatientCardForHistoria(patient);
                    } catch (cardError) {
                        console.error(`❌ Error al crear tarjeta para paciente ${index}:`, cardError, patient);
                        return `<div class="error-card">Error al mostrar paciente ${patient.id || index}</div>`;
                    }
                }).join('');
                
                petHistoriaListContainer.innerHTML = patientsHTML;
                
                // Forzar estilos para asegurar visibilidad
                petHistoriaListContainer.style.display = 'grid';
                petHistoriaListContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
                petHistoriaListContainer.style.gap = '20px';
                petHistoriaListContainer.style.padding = '20px';
                petHistoriaListContainer.style.minHeight = '200px';
                petHistoriaListContainer.style.width = '100%';
                
                console.log('✅ HTML generado exitosamente, longitud:', patientsHTML.length);
                console.log('🔍 Contenido insertado en container:', petHistoriaListContainer.innerHTML.substring(0, 300));
                console.log('🔍 Container visible?', petHistoriaListContainer.offsetHeight > 0);
                console.log('🔍 Container dimensions:', {
                    width: petHistoriaListContainer.offsetWidth,
                    height: petHistoriaListContainer.offsetHeight,
                    display: getComputedStyle(petHistoriaListContainer).display,
                    visibility: getComputedStyle(petHistoriaListContainer).visibility
                });
                
                // Verificar después de aplicar estilos
                setTimeout(() => {
                    console.log('🔍 Container dimensions DESPUÉS de timeout:', {
                        width: petHistoriaListContainer.offsetWidth,
                        height: petHistoriaListContainer.offsetHeight,
                        visible: petHistoriaListContainer.offsetHeight > 0
                    });
                }, 100);
            } catch (htmlError) {
                console.error('❌ Error al generar HTML de pacientes:', htmlError);
                throw new Error('Error al generar la lista de mascotas');
            }
        }
        
        // Asegurar que la sección de todas las mascotas esté visible
        const searchResults = document.getElementById('historiaSearchResults');
        const allPetsSection = document.getElementById('allPetsHistoriaSection');
        const noResults = document.querySelector('.no-results-historia');
        const historiaDetails = document.getElementById('historiaClinicaDetails');
        const historiaResults = document.getElementById('historiaResults');
        
        console.log('🎨 Verificando visibilidad de elementos...');
        console.log('- searchResults display:', searchResults?.style.display || 'default');
        console.log('- allPetsSection display:', allPetsSection?.style.display || 'default');
        console.log('- historiaDetails display:', historiaDetails?.style.display || 'default');
        console.log('- historiaResults display:', historiaResults?.style.display || 'default');
        
        if (searchResults) {
            searchResults.style.display = 'none';
            console.log('✅ Ocultando searchResults');
        }
        if (allPetsSection) {
            allPetsSection.style.display = 'block';
            allPetsSection.style.visibility = 'visible';
            console.log('✅ Mostrando allPetsSection');
        }
        if (noResults) {
            noResults.style.display = 'none';
            console.log('✅ Ocultando noResults');
        }
        if (historiaDetails) {
            historiaDetails.style.display = 'none';
            historiaDetails.style.visibility = 'hidden';
            historiaDetails.style.opacity = '0';
            historiaDetails.style.position = 'absolute';
            historiaDetails.style.left = '-9999px';
            console.log('✅ Ocultando historiaDetails AGRESIVAMENTE');
        }
        if (historiaResults) {
            historiaResults.style.display = 'block';
            historiaResults.style.visibility = 'visible';
            historiaResults.style.opacity = '1';
            historiaResults.style.minHeight = '200px'; // Forzar altura mínima
            console.log('✅ Mostrando historiaResults');
            console.log('🔍 historiaResults después de forzar:', {
                display: historiaResults.style.display,
                visibility: historiaResults.style.visibility,
                height: historiaResults.offsetHeight,
                width: historiaResults.offsetWidth
            });
        }
        
        console.log('✅ showAllPetsInHistoriaClinica completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cargar mascotas migradas:', error);
        petHistoriaListContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar mascotas</h3>
                <p>${error.message || 'Error de conexión con el servidor'}</p>
                <button class="btn btn-primary" onclick="showAllPetsInHistoriaClinica()">
                    <i class="fas fa-refresh"></i> Reintentar
                </button>
            </div>
        `;
        throw error; // Re-lanzar el error para que lo maneje el setTimeout
    }
}

// Función para mostrar la historia clínica completa de un paciente
async function displayHistoriaClinica(patientId) {
    try {
        console.log(`🔍 Cargando historia clínica completa del paciente ID: ${patientId}`);
        
        // Ocultar la lista de mascotas y mostrar el indicador de carga
        console.log('🔄 Ocultando lista y mostrando detalles...');
        document.getElementById('historiaResults').style.display = 'none';
        const detailsContainer = document.getElementById('historiaClinicaDetails');
        
        // Anular los estilos agresivos de ocultación
        detailsContainer.style.display = 'block';
        detailsContainer.style.visibility = 'visible';
        detailsContainer.style.opacity = '1';
        detailsContainer.style.position = 'static';
        detailsContainer.style.left = 'auto';
        detailsContainer.style.width = '100%';
        detailsContainer.style.height = 'auto';
        
        console.log('🔄 Elementos de vista configurados:', {
            historiaResults: document.getElementById('historiaResults').style.display,
            historiaDetails: detailsContainer.style.display,
            detailsVisible: detailsContainer.offsetHeight > 0
        });
        
        detailsContainer.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                Cargando historia clínica completa...
            </div>
        `;
        
        // Obtener todos los datos del paciente
        const patientData = await api.getPatientHistory(patientId);
        console.log('📋 Datos completos del paciente:', patientData);
        console.log('📋 History length:', patientData.history ? patientData.history.length : 'undefined');
        console.log('📋 Vaccines length:', patientData.vaccines ? patientData.vaccines.length : 'undefined');
        console.log('📋 Studies length:', patientData.studies ? patientData.studies.length : 'undefined');
        console.log('📋 Hemograms length:', patientData.hemograms ? patientData.hemograms.length : 'undefined');
        
        // Obtener datos adicionales que no están en el endpoint principal
        const [ecografias, orina, quimicaSang, rayos, electrocardio] = await Promise.all([
            api.getPatientEcografias(patientId).catch(() => []),
            api.getPatientOrina(patientId).catch(() => []),
            api.getPatientQuimicaSang(patientId).catch(() => []),
            api.getPatientRayos(patientId).catch(() => []),
            api.getPatientElectrocardio(patientId).catch(() => [])
        ]);
        
        // Combinar todos los datos
        const completeData = {
            ...patientData,
            ecografias,
            orina,
            quimicaSang,
            rayos,
            electrocardio
        };
        
        // Mostrar la historia clínica completa
        displayCompleteHistoriaClinica(completeData);
        
    } catch (error) {
        console.error('❌ Error al cargar historia clínica:', error);
        document.getElementById('historiaClinicaDetails').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                Error al cargar la historia clínica. Por favor, intenta nuevamente.
                <br><br>
                <button class="btn btn-primary" onclick="showAllPetsInHistoriaClinica()">
                    <i class="fas fa-arrow-left"></i> Volver a la lista
                </button>
            </div>
        `;
         }
}

// Función para mostrar la historia clínica completa formateada
function displayCompleteHistoriaClinica(data) {
    const { patient, history, vaccines, studies, hemograms, ecografias, orina, quimicaSang, rayos, electrocardio } = data;
    
    // Información del propietario
    const ownerName = patient.clienteNombre && patient.clienteApellido 
        ? `${patient.clienteNombre} ${patient.clienteApellido}`.trim()
        : patient.clienteRazonSocial || 'N/A';
    
    const ownerInfo = `
        <div class="owner-info">
            <h4><i class="fas fa-user"></i> Información del Propietario</h4>
            <p><strong>Nombre:</strong> ${ownerName}</p>
            <p><strong>Teléfono:</strong> ${patient.clienteTelefono || 'N/A'}</p>
            <p><strong>Email:</strong> ${patient.clienteEmail || 'N/A'}</p>
            <p><strong>Dirección:</strong> ${patient.clienteDomicilio || 'N/A'}</p>
        </div>
    `;
    
    // Información del paciente
    const patientInfo = `
        <div class="patient-info">
            <h4><i class="fas fa-paw"></i> Información del Paciente</h4>
            <p><strong>Nombre:</strong> ${patient.nombre || 'Sin nombre'}</p>
            <p><strong>Especie:</strong> ${patient.especie || 'No especificada'}</p>
            <p><strong>Raza:</strong> ${patient.raza || 'No especificada'}</p>
            <p><strong>Sexo:</strong> ${patient.sexo || 'N/A'}</p>
            <p><strong>Color:</strong> ${patient.color || 'N/A'}</p>
            <p><strong>Fecha de Nacimiento:</strong> ${patient.fechaNacimiento || 'N/A'}</p>
        </div>
    `;
    
    // Generar secciones de estudios médicos
    const historiaClinicaSection = generateHistoriaSection(history);
    const vacunasSection = generateVacunasSection(vaccines);
    const estudiosSection = generateEstudiosSection(studies);
    const hemogramasSection = generateHemogramasSection(hemograms);
    const ecografiasSection = generateEcografiasSection(ecografias || []);
    const orinaSection = generateOrinaSection(orina || []);
    const quimicaSangSection = generateQuimicaSangSection(quimicaSang || []);
    const rayosSection = generateRayosSection(rayos || []);
    const electrocardiogramaSection = generateElectrocardiogramaSection(electrocardio || []);
    
    // HTML completo
    const htmlContent = `
        <div class="historia-clinica-complete">
            <div class="historia-header">
                <h2>
                    <i class="fas fa-file-medical-alt"></i> 
                    Historia Clínica Completa: ${patient.nombre || 'Sin nombre'}
                </h2>
                <button class="btn btn-primary" onclick="showAllPetsInHistoriaClinica()">
                    <i class="fas fa-arrow-left"></i> Volver a la lista
                </button>
            </div>
            
            <div class="historia-content">
                <div class="info-grid">
                    ${patientInfo}
                    ${ownerInfo}
                </div>
                
                <div class="info-note">
                    <p><i class="fas fa-info-circle"></i> <strong>Nota:</strong> Algunos campos pueden mostrar "N/A" cuando la información no fue registrada en el sistema original. Esto es normal en registros médicos históricos.</p>
                </div>
                
                <div class="medical-sections">
                    ${historiaClinicaSection}
                    ${vacunasSection}
                    ${estudiosSection}
                    ${hemogramasSection}
                    ${ecografiasSection}
                    ${orinaSection}
                    ${quimicaSangSection}
                    ${rayosSection}
                    ${electrocardiogramaSection}
                </div>
            </div>
        </div>
    `;
    
    const detailsContainer = document.getElementById('historiaClinicaDetails');
    
    // Asegurar que el contenedor sea visible
    detailsContainer.style.display = 'block';
    detailsContainer.style.visibility = 'visible';
    detailsContainer.style.opacity = '1';
    detailsContainer.style.position = 'static';
    detailsContainer.style.left = 'auto';
    detailsContainer.style.width = '100%';
    detailsContainer.style.height = 'auto';
    
    detailsContainer.innerHTML = htmlContent;
    
    console.log('✅ Historia clínica completa mostrada, dimensiones:', {
        width: detailsContainer.offsetWidth,
        height: detailsContainer.offsetHeight,
        visible: detailsContainer.offsetHeight > 0
    });
}

// Funciones auxiliares para generar secciones de la historia clínica

function generateHistoriaSection(history) {
    if (!history || history.length === 0) {
        return `
            <div class="medical-section historia">
                <h3><i class="fas fa-notes-medical"></i> Historia Clínica</h3>
                <p class="no-data">No hay registros de historia clínica disponibles.</p>
            </div>
        `;
    }
    
    const historyItems = history.map(item => `
        <div class="history-item">
            <div class="history-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(item.fecha)}
            </div>
            <div class="history-content">
                <h4>${item.titulo || 'Sin título'}</h4>
                <p><strong>Doctor:</strong> ${item.doctor || 'N/A'}</p>
                <p><strong>Peso:</strong> ${item.peso || 'N/A'}</p>
                <p><strong>Temperatura:</strong> ${item.temperatura || 'N/A'}</p>
                <div class="history-details">
                    ${item.detalle || 'Sin detalles'}
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="medical-section historia">
            <h3><i class="fas fa-notes-medical"></i> Historia Clínica (${history.length})</h3>
            <div class="history-timeline">
                ${historyItems}
            </div>
        </div>
    `;
}

function generateVacunasSection(vaccines) {
    if (!vaccines || vaccines.length === 0) {
        return `
            <div class="medical-section vacunas">
                <h3><i class="fas fa-syringe"></i> Vacunas</h3>
                <p class="no-data">No hay registros de vacunas disponibles.</p>
            </div>
        `;
    }
    
    const vaccineItems = vaccines.map(vaccine => `
        <div class="vaccine-item">
            <div class="vaccine-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(vaccine.fechaVisita)}
            </div>
            <div class="vaccine-content">
                <h4>${vaccine.clase && vaccine.clase.trim() !== '' ? vaccine.clase : 'Vacuna'}</h4>
                <p><strong>Marca:</strong> ${vaccine.marca && vaccine.marca.trim() !== '' ? vaccine.marca : 'N/A'}</p>
                <p><strong>Doctor:</strong> ${vaccine.doctor && vaccine.doctor.trim() !== '' ? vaccine.doctor : 'N/A'}</p>
                <p><strong>Precio:</strong> ${vaccine.precio && vaccine.precio.trim() !== '' ? vaccine.precio : 'N/A'}</p>
                ${vaccine.fechaProxima && vaccine.fechaProxima.trim() !== '' ? `<p><strong>Próxima dosis:</strong> ${formatDate(vaccine.fechaProxima)}</p>` : '<p><strong>Próxima dosis:</strong> N/A</p>'}
            </div>
        </div>
    `).join('');
    
    return `
        <div class="medical-section vacunas">
            <h3><i class="fas fa-syringe"></i> Vacunas (${vaccines.length})</h3>
            <div class="vaccines-timeline">
                ${vaccineItems}
            </div>
        </div>
    `;
}

function generateEstudiosSection(studies) {
    if (!studies || studies.length === 0) {
        return `
            <div class="medical-section estudios">
                <h3><i class="fas fa-flask"></i> Estudios</h3>
                <p class="no-data">No hay estudios disponibles.</p>
            </div>
        `;
    }
    
    const studyItems = studies.map(study => `
        <div class="study-item">
            <div class="study-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(study.fecha)}
            </div>
            <div class="study-content">
                <h4>${study.titulo || 'Estudio'}</h4>
                <p><strong>Doctor:</strong> ${study.doctor || 'N/A'}</p>
                <div class="study-details">
                    ${study.detalle || 'Sin detalles'}
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="medical-section estudios">
            <h3><i class="fas fa-flask"></i> Estudios (${studies.length})</h3>
            <div class="studies-timeline">
                ${studyItems}
            </div>
        </div>
    `;
}

function generateHemogramasSection(hemograms) {
    if (!hemograms || hemograms.length === 0) {
        return `
            <div class="medical-section hemogramas">
                <h3><i class="fas fa-tint"></i> Hemogramas</h3>
                <p class="no-data">No hay hemogramas disponibles.</p>
            </div>
        `;
    }
    
    // Debug: mostrar los datos reales de hemogramas
    console.log('🔍 Datos de hemogramas recibidos:', hemograms);
    if (hemograms.length > 0) {
        console.log('🔍 Primer hemograma:', hemograms[0]);
        console.log('🔍 Campos del primer hemograma:', Object.keys(hemograms[0]));
    }
    
    const hemogramItems = hemograms.map((hemogram, index) => {
        // Debug específico para cada hemograma
        console.log(`🔍 Hemograma ${index + 1}:`, {
            fecha: hemogram.fecha,
            hematies: `"${hemogram.hematies}" (tipo: ${typeof hemogram.hematies})`,
            hemoglobina: `"${hemogram.hemoglobina}" (tipo: ${typeof hemogram.hemoglobina})`,
            hematocritos: `"${hemogram.hematocritos}" (tipo: ${typeof hemogram.hematocritos})`,
            leucocitos: `"${hemogram.leucocitos}" (tipo: ${typeof hemogram.leucocitos})`,
            observaciones: `"${hemogram.observaciones}" (tipo: ${typeof hemogram.observaciones})`
        });
        
        return `
        <div class="hemogram-item">
            <div class="hemogram-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(hemogram.fecha)}
            </div>
            <div class="hemogram-content">
                <h4>Hemograma</h4>
                <p><strong>Doctor:</strong> ${hemogram.doctor || 'N/A'}</p>
                <div class="hemogram-values">
                    <div class="value-row">
                        <span><strong>Hematíes:</strong> ${formatValue(hemogram.hematies)}</span>
                        <span><strong>Hemoglobina:</strong> ${formatValue(hemogram.hemoglobina)}</span>
                    </div>
                    <div class="value-row">
                        <span><strong>Hematocrito:</strong> ${formatValue(hemogram.hematocritos)}</span>
                        <span><strong>Leucocitos:</strong> ${formatValue(hemogram.leucocitos)}</span>
                    </div>
                    <p><strong>Observaciones:</strong> ${formatValue(hemogram.observaciones)}</p>
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    return `
        <div class="medical-section hemogramas">
            <h3><i class="fas fa-tint"></i> Hemogramas (${hemograms.length})</h3>
            <div class="hemograms-timeline">
                ${hemogramItems}
            </div>
        </div>
    `;
}

// Funciones auxiliares para otras secciones (placeholder por ahora)
function generateEcografiasSection(ecografias) {
    if (!ecografias || ecografias.length === 0) {
        return `
            <div class="medical-section ecografias">
                <h3><i class="fas fa-heartbeat ecografias"></i> Ecografías</h3>
                <p class="no-data">No hay ecografías disponibles.</p>
            </div>
        `;
    }
    
    const ecografiaItems = ecografias.map(eco => `
        <div class="ecografia-item">
            <div class="ecografia-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(eco.fecha)}
            </div>
            <div class="ecografia-content">
                <h4>${eco.titulo || 'Ecografía'}</h4>
                <p><strong>Doctor:</strong> ${eco.doctor || 'N/A'}</p>
                <div class="ecografia-details">
                    ${eco.detalle || 'Sin detalles'}
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="medical-section ecografias">
            <h3><i class="fas fa-heartbeat ecografias"></i> Ecografías (${ecografias.length})</h3>
            <div class="ecografias-timeline">
                ${ecografiaItems}
            </div>
        </div>
    `;
}

function generateOrinaSection(orina) {
    if (!orina || orina.length === 0) {
        return `
            <div class="medical-section orina">
                <h3><i class="fas fa-vial orina"></i> Análisis de Orina</h3>
                <p class="no-data">No hay análisis de orina disponibles.</p>
            </div>
        `;
    }
    
    const orinaItems = orina.map(analisis => `
        <div class="orina-item">
            <div class="orina-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(analisis.fecha)}
            </div>
            <div class="orina-content">
                <h4>Análisis de Orina</h4>
                <p><strong>Doctor:</strong> ${analisis.doctor || 'N/A'}</p>
                <div class="orina-values">
                    <div class="value-row">
                        <span><strong>Densidad:</strong> ${analisis.densidad || 'N/A'}</span>
                        <span><strong>pH:</strong> ${analisis.ph || 'N/A'}</span>
                    </div>
                    <div class="value-row">
                        <span><strong>Proteínas:</strong> ${analisis.proteinas || 'N/A'}</span>
                        <span><strong>Glucosa:</strong> ${analisis.glucosa || 'N/A'}</span>
                    </div>
                    <div class="value-row">
                        <span><strong>Cetonas:</strong> ${analisis.cetonas || 'N/A'}</span>
                        <span><strong>Sangre:</strong> ${analisis.sangre || 'N/A'}</span>
                    </div>
                    <div class="value-row">
                        <span><strong>Leucocitos:</strong> ${analisis.leucocitos || 'N/A'}</span>
                        <span><strong>Nitritos:</strong> ${analisis.nitritos || 'N/A'}</span>
                    </div>
                    ${analisis.observaciones ? `<p><strong>Observaciones:</strong> ${analisis.observaciones}</p>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="medical-section orina">
            <h3><i class="fas fa-vial orina"></i> Análisis de Orina (${orina.length})</h3>
            <div class="orina-timeline">
                ${orinaItems}
            </div>
        </div>
    `;
}

function generateQuimicaSangSection(quimicaSang) {
    if (!quimicaSang || quimicaSang.length === 0) {
        return `
            <div class="medical-section quimica-sang">
                <h3><i class="fas fa-flask quimica-sang"></i> Química Sanguínea</h3>
                <p class="no-data">No hay análisis de química sanguínea disponibles.</p>
            </div>
        `;
    }
    
    const quimicaItems = quimicaSang.map(analisis => `
        <div class="quimica-item">
            <div class="quimica-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(analisis.fecha)}
            </div>
            <div class="quimica-content">
                <h4>Química Sanguínea</h4>
                <p><strong>Doctor:</strong> ${analisis.doctor || 'N/A'}</p>
                <div class="quimica-values">
                    <div class="value-row">
                        <span><strong>Glucosa:</strong> ${analisis.glucosa || 'N/A'}</span>
                        <span><strong>Urea:</strong> ${analisis.urea || 'N/A'}</span>
                    </div>
                    <div class="value-row">
                        <span><strong>Creatinina:</strong> ${analisis.creatinina || 'N/A'}</span>
                        <span><strong>Colesterol:</strong> ${analisis.colesterol || 'N/A'}</span>
                    </div>
                    <div class="value-row">
                        <span><strong>Triglicéridos:</strong> ${analisis.trigliceridos || 'N/A'}</span>
                    </div>
                    ${analisis.observaciones ? `<p><strong>Observaciones:</strong> ${analisis.observaciones}</p>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="medical-section quimica-sang">
            <h3><i class="fas fa-flask quimica-sang"></i> Química Sanguínea (${quimicaSang.length})</h3>
            <div class="quimica-timeline">
                ${quimicaItems}
            </div>
        </div>
    `;
}

function generateRayosSection(rayos) {
    if (!rayos || rayos.length === 0) {
        return `
            <div class="medical-section rayos">
                <h3><i class="fas fa-x-ray rayos"></i> Rayos X</h3>
                <p class="no-data">No hay rayos X disponibles.</p>
            </div>
        `;
    }
    
    const rayosItems = rayos.map(rayo => `
        <div class="rayos-item">
            <div class="rayos-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(rayo.fecha)}
            </div>
            <div class="rayos-content">
                <h4>${rayo.titulo || 'Rayos X'}</h4>
                <p><strong>Doctor:</strong> ${rayo.doctor || 'N/A'}</p>
                <div class="rayos-details">
                    ${rayo.detalle || 'Sin detalles'}
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="medical-section rayos">
            <h3><i class="fas fa-x-ray rayos"></i> Rayos X (${rayos.length})</h3>
            <div class="rayos-timeline">
                ${rayosItems}
            </div>
        </div>
    `;
}

function generateElectrocardiogramaSection(electrocardio) {
    if (!electrocardio || electrocardio.length === 0) {
        return `
            <div class="medical-section electrocardio">
                <h3><i class="fas fa-heartbeat electrocardio"></i> Electrocardiograma</h3>
                <p class="no-data">No hay electrocardiogramas disponibles.</p>
            </div>
        `;
    }
    
    const electroItems = electrocardio.map(electro => `
        <div class="electro-item">
            <div class="electro-date">
                <i class="fas fa-calendar-alt"></i>
                ${formatDate(electro.fecha)}
            </div>
            <div class="electro-content">
                <h4>${electro.titulo || 'Electrocardiograma'}</h4>
                <p><strong>Doctor:</strong> ${electro.doctor || 'N/A'}</p>
                <div class="electro-details">
                    ${electro.detalle || 'Sin detalles'}
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="medical-section electrocardio">
            <h3><i class="fas fa-heartbeat electrocardio"></i> Electrocardiograma (${electrocardio.length})</h3>
            <div class="electro-timeline">
                ${electroItems}
            </div>
        </div>
    `;
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Función auxiliar para manejar valores vacíos
function formatValue(value, defaultValue = 'N/A') {
    // Verificar si el valor es null, undefined, o vacío
    if (value === null || value === undefined) {
        return defaultValue;
    }
    
    // Si es string, limpiar espacios y verificar si está vacío
    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue === '' || trimmedValue === 'null' || trimmedValue === 'undefined') {
            return defaultValue;
        }
        return trimmedValue;
    }
    
    // Para números, verificar si es 0 (que podría ser válido) o NaN
    if (typeof value === 'number') {
        if (isNaN(value)) {
            return defaultValue;
        }
        return value;
    }
    
    return value;
}



// Función para crear una tarjeta de paciente (general)
function createPatientCard(patient) {
    const clienteName = patient.clienteNombre && patient.clienteApellido 
        ? `${patient.clienteNombre} ${patient.clienteApellido}`.toTitleCase()
        : patient.clienteRazonSocial || 'Cliente no especificado';
        
    const petName = patient.nombre ? patient.nombre.toTitleCase() : 'Sin nombre';
    const breed = patient.raza ? patient.raza.toTitleCase() : 'N/A';
    
    return `
        <div class="patient-card">
            <div class="patient-info">
                <h3>${petName}</h3>
                <p><strong>Especie:</strong> ${patient.especie || 'N/A'}</p>
                <p><strong>Raza:</strong> ${breed}</p>
                <p><strong>Propietario:</strong> ${clienteName}</p>
            </div>
            <div class="patient-actions">
                <button class="btn btn-primary" onclick="showPatientFile(${patient.id})">
                    <i class="fas fa-folder-open"></i>
                    <span>Ver Ficha Completa</span>
                </button>
            </div>
        </div>
    `;
}

// Función para crear una tarjeta de paciente para historia clínica
function createPatientCardForHistoria(patient) {
    const clientName = patient.clienteNombre && patient.clienteApellido 
        ? `${patient.clienteNombre} ${patient.clienteApellido}`.trim()
        : patient.clienteRazonSocial || 'N/A';
    
    return `
        <div class="pet-card" data-pet-id="${patient.id}" onclick="displayHistoriaClinica(${patient.id})">
            <h4>${patient.nombre || 'Sin nombre'} <span class="pet-id">(ID: ${patient.id})</span></h4>
            <p><strong>Propietario:</strong> ${clientName}</p>
            <p><strong>Especie:</strong> ${patient.especie || 'Desconocida'}</p>
            <p><strong>Raza:</strong> ${patient.raza || 'Desconocida'}</p>
            <p><strong>Sexo:</strong> ${patient.sexo || 'N/A'}</p>
            <p><strong>Color:</strong> ${patient.color || 'N/A'}</p>
            <div class="historia-clinica-indicator">
                <i class="fas fa-file-medical-alt"></i>
                <span>Ver Historia Clínica Completa</span>
            </div>
        </div>
    `;
}

// Función para mostrar la ficha completa de un paciente migrado
async function displayMigratedPatientFicha(patientId) {
    try {
        console.log(`🔍 Cargando ficha del paciente ID: ${patientId}`);
        
        const patientData = await api.getPatientHistory(patientId);
        console.log('📋 Datos del paciente:', patientData);
        
        const { patient, history, vaccines, studies, hemograms } = patientData;
        
        // Crear información del propietario
        const ownerName = patient.clienteNombre && patient.clienteApellido 
            ? `${patient.clienteNombre} ${patient.clienteApellido}`.trim()
            : patient.clienteRazonSocial || 'N/A';
        
        // Crear sección de información básica
        const basicInfoHTML = `
            <div class="patient-basic-info">
                <h3>Información Básica</h3>
                <div class="info-grid">
                    <div><strong>Nombre:</strong> ${patient.nombre || 'Sin nombre'}</div>
                    <div><strong>Propietario:</strong> ${ownerName}</div>
                    <div><strong>Especie:</strong> ${patient.especie || 'Desconocida'}</div>
                    <div><strong>Raza:</strong> ${patient.raza || 'Desconocida'}</div>
                    <div><strong>Sexo:</strong> ${patient.sexo || 'N/A'}</div>
                    <div><strong>Color:</strong> ${patient.color || 'N/A'}</div>
                    <div><strong>Peso:</strong> ${patient.peso || 'N/A'}</div>
                    <div><strong>Fecha de nacimiento:</strong> ${patient.fechaNacimiento || 'N/A'}</div>
                </div>
                <div class="contact-info">
                    <h4>Información de contacto del propietario:</h4>
                    <div><strong>Teléfono:</strong> ${patient.clienteTelefono || 'N/A'}</div>
                    <div><strong>Email:</strong> ${patient.clienteEmail || 'N/A'}</div>
                    <div><strong>Domicilio:</strong> ${patient.clienteDomicilio || 'N/A'}</div>
                </div>
            </div>
        `;
        
        // Crear sección de historial médico
        const historyHTML = history.length > 0 ? `
            <div class="medical-history">
                <h3>Historial Médico</h3>
                ${history.map(record => `
                    <div class="medical-record">
                        <div class="record-header">
                            <strong>Fecha:</strong> ${record.fecha || 'N/A'}
                            ${record.doctor ? `<span class="doctor">Dr. ${record.doctor}</span>` : ''}
                        </div>
                        <div class="record-content">
                            ${record.titulo ? `<h4>${record.titulo}</h4>` : ''}
                            ${record.peso ? `<p><strong>Peso:</strong> ${record.peso}</p>` : ''}
                            ${record.temperatura ? `<p><strong>Temperatura:</strong> ${record.temperatura}</p>` : ''}
                            ${record.detalle ? `<p><strong>Detalle:</strong> ${record.detalle}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="no-records"><h3>Historial Médico</h3><p>No hay registros médicos disponibles.</p></div>';
        
        // Crear sección de vacunas
        const vaccinesHTML = vaccines.length > 0 ? `
            <div class="vaccines-history">
                <h3>Historial de Vacunas</h3>
                <div class="vaccines-grid">
                    ${vaccines.map(vaccine => `
                        <div class="vaccine-record">
                            <div><strong>Fecha:</strong> ${vaccine.fechaVisita || 'N/A'}</div>
                            <div><strong>Próxima:</strong> ${vaccine.fechaProxima || 'N/A'}</div>
                            <div><strong>Marca:</strong> ${vaccine.marca || 'N/A'}</div>
                            <div><strong>Clase:</strong> ${vaccine.clase || 'N/A'}</div>
                            <div><strong>Precio:</strong> ${vaccine.precio ? `$${vaccine.precio}` : 'N/A'}</div>
                            ${vaccine.doctor ? `<div><strong>Doctor:</strong> Dr. ${vaccine.doctor}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '<div class="no-records"><h3>Historial de Vacunas</h3><p>No hay registros de vacunas disponibles.</p></div>';
        
        // Crear sección de estudios
        const studiesHTML = studies.length > 0 ? `
            <div class="studies-history">
                <h3>Estudios Realizados</h3>
                ${studies.map(study => `
                    <div class="study-record">
                        <div class="study-header">
                            <strong>Fecha:</strong> ${study.fecha || 'N/A'}
                            ${study.doctor ? `<span class="doctor">Dr. ${study.doctor}</span>` : ''}
                        </div>
                        <div class="study-content">
                            ${study.titulo ? `<h4>${study.titulo}</h4>` : ''}
                            ${study.detalle ? `<p>${study.detalle}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="no-records"><h3>Estudios Realizados</h3><p>No hay estudios disponibles.</p></div>';
        
        // Crear sección de hemogramas
        const hemogramsHTML = hemograms.length > 0 ? `
            <div class="hemograms-history">
                <h3>Hemogramas</h3>
                ${hemograms.map(hemo => `
                    <div class="hemogram-record">
                        <div class="hemogram-header">
                            <strong>Fecha:</strong> ${hemo.fecha || 'N/A'}
                            ${hemo.doctor ? `<span class="doctor">Dr. ${hemo.doctor}</span>` : ''}
                        </div>
                        <div class="hemogram-values">
                            ${hemo.hematies ? `<div><strong>Hematíes:</strong> ${hemo.hematies}</div>` : ''}
                            ${hemo.hemoglobina ? `<div><strong>Hemoglobina:</strong> ${hemo.hemoglobina}</div>` : ''}
                            ${hemo.hematocritos ? `<div><strong>Hematocritos:</strong> ${hemo.hematocritos}</div>` : ''}
                            ${hemo.leucocitos ? `<div><strong>Leucocitos:</strong> ${hemo.leucocitos}</div>` : ''}
                            ${hemo.observaciones ? `<div><strong>Observaciones:</strong> ${hemo.observaciones}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="no-records"><h3>Hemogramas</h3><p>No hay hemogramas disponibles.</p></div>';
        
        // Mostrar toda la información en la ficha
        const fichaContent = `
            <div class="patient-ficha-complete">
                <div class="ficha-header">
                    <h2>Ficha Completa - ${patient.nombre || 'Sin nombre'}</h2>
                    <button class="btn btn-secondary" onclick="showAllMigratedPets()">
                        <i class="fas fa-arrow-left"></i> Volver a la lista
                    </button>
                </div>
                
                ${basicInfoHTML}
                ${historyHTML}
                ${vaccinesHTML}
                ${studiesHTML}
                ${hemogramsHTML}
            </div>
        `;
        
        document.getElementById('petFilesResults').innerHTML = fichaContent;
        
    } catch (error) {
        console.error('Error al cargar ficha del paciente:', error);
        document.getElementById('petFilesResults').innerHTML = `
            <div class="error-message">
                <h3>Error al cargar la ficha</h3>
                <p>No se pudo cargar la información del paciente. Por favor, intenta nuevamente.</p>
                <button class="btn btn-primary" onclick="showAllMigratedPets()">Volver a la lista</button>
            </div>
        `;
    }
}

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
                    <p><strong>Propietario:</strong> ${pet.clientName || 'N/A'}</p>
                    <p><strong>Especie:</strong> ${pet.species || 'Desconocida'}</p>
                    <p><strong>Raza:</strong> ${pet.breed || 'Desconocida'}</p>
                    <p><strong>Edad:</strong> ${pet.age !== null ? pet.age : 'N/A'} ${pet.age !== null ? 'años' : ''}</p>
                </div>
                
                <div id="petInfoEdit-${petId}" class="pet-info-edit" style="display: none;">
                    <div class="form-group">
                        <label><strong>Propietario:</strong></label>
                        <select id="editOwner-${petId}">
                            ${clients.map(client => `
                                <option value="${client.id}" ${client.id === pet.clientId ? 'selected' : ''}>
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
                    <p><strong>Propietario:</strong> ${pet.clientName || 'N/A'}</p>
                    <p><strong>Especie:</strong> ${pet.species || 'Desconocida'}</p>
                    <p><strong>Raza:</strong> ${pet.breed || 'Desconocida'}</p>
                    <p><strong>Edad:</strong> ${pet.age !== null ? pet.age : 'N/A'} ${pet.age !== null ? 'años' : ''}</p>
                </div>
                
                <div id="petInfoEdit-${petId}" class="pet-info-edit" style="display: none;">
                    <div class="form-group">
                        <label><strong>Propietario:</strong></label>
                        <select id="editOwner-${petId}">
                            ${clients.map(client => `
                                <option value="${client.id}" ${client.id === pet.clientId ? 'selected' : ''}>
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
    // Inicializar comunicaciones filtradas
    filteredCommunications = communications;
    
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
            
            <div class="communication-actions">
                <button class="btn btn-primary btn-large" onclick="showEmailModal()">
                    <i class="fas fa-envelope"></i>
                    Enviar Email
                </button>
                <button class="btn btn-primary btn-large" onclick="showSMSModal()">
                    <i class="fas fa-sms"></i>
                    Enviar SMS
                </button>
            </div>
            
            <div class="communications-controls">
                <div class="search-controls">
                    <input type="text" id="communicationSearch" placeholder="Buscar comunicaciones..." 
                           oninput="searchCommunications()" class="search-input">
                    <i class="fas fa-search search-icon"></i>
                </div>
                <div class="pagination-controls">
                    <label>Mostrar:</label>
                    <select id="communicationsPerPage" onchange="changeCommunicationsPerPage()">
                        <option value="10">10 por página</option>
                        <option value="25">25 por página</option>
                        <option value="50">50 por página</option>
                    </select>
                </div>
            </div>
            
            <h3>Historial de Comunicaciones</h3>
            <div id="communicationsTableContainer">
                <!-- La tabla se renderizará aquí -->
            </div>
            
            <div id="communicationsPagination">
                <!-- La paginación se renderizará aquí -->
            </div>
        </div>
    `;
}


// Funciones de paginación para comunicaciones
function renderCommunicationsTable() {
    const startIndex = (currentCommunicationPage - 1) * communicationsPerPage;
    const endIndex = startIndex + communicationsPerPage;
    const paginatedCommunications = filteredCommunications.slice(startIndex, endIndex);
    
    const tableHTML = `
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
                ${paginatedCommunications.map(comm => `
                    <tr>
                        <td>${comm.sentAt ? formatDateInArgentina(comm.sentAt) : 'N/A'}</td>
                        <td>${comm.clientName || 'Cliente desconocido'}</td>
                        <td><span class="badge badge-${comm.type === 'email' ? 'primary' : 'info'}">${comm.type.toUpperCase()}</span></td>
                        <td>${comm.subject || 'Sin asunto'}</td>
                        <td><span class="badge badge-success">Enviado</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('communicationsTableContainer').innerHTML = tableHTML;
}

function renderCommunicationsPagination() {
    const totalPages = Math.ceil(filteredCommunications.length / communicationsPerPage);
    const startIndex = (currentCommunicationPage - 1) * communicationsPerPage + 1;
    const endIndex = Math.min(startIndex + communicationsPerPage - 1, filteredCommunications.length);
    
    let paginationHTML = `
        <div class="pagination-info">
            Mostrando ${startIndex}-${endIndex} de ${filteredCommunications.length} comunicaciones
        </div>
        <div class="pagination-controls">
    `;
    
    // Botón anterior
    if (currentCommunicationPage > 1) {
        paginationHTML += `
            <button class="btn btn-secondary" onclick="goToCommunicationPage(${currentCommunicationPage - 1})">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
        `;
    }
    
    // Números de página
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentCommunicationPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="btn ${i === currentCommunicationPage ? 'btn-primary' : 'btn-secondary'}" 
                    onclick="goToCommunicationPage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Botón siguiente
    if (currentCommunicationPage < totalPages) {
        paginationHTML += `
            <button class="btn btn-secondary" onclick="goToCommunicationPage(${currentCommunicationPage + 1})">
                Siguiente <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    paginationHTML += `</div>`;
    
    document.getElementById('communicationsPagination').innerHTML = paginationHTML;
}

function searchCommunications() {
    const searchTerm = document.getElementById('communicationSearch').value.toLowerCase();
    
    if (searchTerm === '') {
        filteredCommunications = communications;
    } else {
        filteredCommunications = communications.filter(comm => {
            const clientName = (comm.clientName || '').toLowerCase();
            const subject = (comm.subject || '').toLowerCase();
            const type = comm.type.toLowerCase();
            
            return clientName.includes(searchTerm) || 
                   subject.includes(searchTerm) || 
                   type.includes(searchTerm);
        });
    }
    
    currentCommunicationPage = 1;
    updateCommunicationsTable();
}

function changeCommunicationsPerPage() {
    const select = document.getElementById('communicationsPerPage');
    communicationsPerPage = parseInt(select.value);
    currentCommunicationPage = 1;
    updateCommunicationsTable();
}

function goToCommunicationPage(page) {
    currentCommunicationPage = page;
    updateCommunicationsTable();
}

function updateCommunicationsTable() {
    renderCommunicationsTable();
    renderCommunicationsPagination();
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
                <button class="btn btn-info" onclick="navigateToJuly2025()" style="margin-left: 5px;">
                    <i class="fas fa-calendar-alt"></i> Jul 2025
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
    
    // Si es un objeto complejo (como los que vienen de la API), extraer el valor real
    if (typeof dateValue === 'object' && dateValue !== null && !(dateValue instanceof Date)) {
        // Intentar extraer el valor real del objeto
        let extractedValue = null;
        
        // Buscar propiedades comunes que podrían contener la fecha (tanto camelCase como snake_case)
        if (dateValue.valor !== undefined) {
            extractedValue = dateValue.valor;
        } else if (dateValue.value !== undefined) {
            extractedValue = dateValue.value;
        } else if (dateValue.date !== undefined) {
            extractedValue = dateValue.date;
        } else if (dateValue.createdAt !== undefined) {
            extractedValue = dateValue.createdAt;
        } else if (dateValue.created_at !== undefined) {
            extractedValue = dateValue.created_at;
        } else if (dateValue.updatedAt !== undefined) {
            extractedValue = dateValue.updatedAt;
        } else if (dateValue.updated_at !== undefined) {
            extractedValue = dateValue.updated_at;
        } else if (dateValue.nextAppointment !== undefined) {
            extractedValue = dateValue.nextAppointment;
        } else if (dateValue.next_appointment !== undefined) {
            extractedValue = dateValue.next_appointment;
        } else if (dateValue.valueOf && typeof dateValue.valueOf === 'function') {
            extractedValue = dateValue.valueOf();
        } else {
            // Si no encontramos un valor específico, intentar convertir el objeto completo
            extractedValue = String(dateValue);
        }
        
        // Recursivamente normalizar el valor extraído
        if (extractedValue !== null && extractedValue !== undefined) {
            return normalizeDate(extractedValue);
        }
    }
    
    // Si es una cadena, limpiar espacios y caracteres extraños
    if (typeof dateValue === 'string') {
        dateValue = dateValue.trim();
        
        // Si está vacío o es "null", devolver null
        if (!dateValue || dateValue === 'null' || dateValue === 'undefined' || dateValue === '[object Object]') {
            return null;
        }
        
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
            pet: record.petName || record.pet_name,
            owner: record.clientName || record.client_name || record.owner,
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
                title: `Cita: ${record.petName || record.pet_name}`,
                time: '10:00', // Hora por defecto
                client: record.clientName || record.client_name || record.owner,
                pet: record.petName || record.pet_name,
                diagnosis: record.diagnosis
            });
        }
        
        // También mostrar registros médicos del día (consultas realizadas)
        if (normalizedDate && normalizedDate === dateStr) {
            console.log(`✅ Encontrada consulta para ${dateStr}:`, record);
            events.push({
                type: 'medical-record',
                title: `Consulta: ${record.petName || record.pet_name}`,
                time: '14:00', // Hora por defecto
                client: record.clientName || record.client_name || record.owner,
                pet: record.petName || record.pet_name,
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
            pet: record.petName || record.pet_name,
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
                    pet: record.petName || record.pet_name,
                    client: record.clientName || record.client_name || record.owner,
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
            pet: record.petName || record.pet_name,
            owner: record.clientName || record.client_name || record.owner,
            date: record.date,
            nextAppointment: record.nextAppointment || record.next_appointment,
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
        // Mejorar el formateo de fechas
        let formattedDate = 'Fecha inválida';
        if (sale.saleDate || sale.sale_date) {
            try {
                const saleDate = new Date(sale.saleDate || sale.sale_date);
                if (!isNaN(saleDate.getTime())) {
                    formattedDate = formatDateInArgentina(saleDate) + ' ' + 
                                  saleDate.toLocaleTimeString('es-AR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                  });
                }
            } catch (e) {
                formattedDate = 'Fecha inválida';
            }
        }

        // Mejorar el nombre del veterinario
        const veterinarianName = sale.veterinarianName || sale.veterinarian_name || 'No especificado';
        
        // Mejorar el conteo de productos
        const totalItems = sale.totalItems || sale.total_items || 0;
        
        // Mejorar la lista de items
        let itemsPreview = 'Sin productos';
        if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
            const validItems = sale.items.filter(item => item && item.productName);
            if (validItems.length > 0) {
                itemsPreview = validItems.slice(0, 2).map(item => 
                    item.productName || item.product_name || 'Producto sin nombre'
                ).join(', ');
                if (validItems.length > 2) {
                    itemsPreview += ` y ${validItems.length - 2} más`;
                }
            }
        }

        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${veterinarianName}</td>
                <td>${totalItems}</td>
                <td>${itemsPreview}</td>
                <td class="status-good">${parseFloat(sale.totalAmount || sale.total_amount || 0).toFixed(2)}</td>
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
                            ${pets.map(pet => `<option data-id="${pet.id}" value="${pet.name}">${pet.name} (${pet.species}) - ${pet.clientName || 'Sin propietario'}</option>`).join('')}
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
// Funciones de código de barras eliminadas

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
                        <label>Fecha de Vencimiento:</label>
                        <input type="date" id="expiryDate" required>
                    </div>
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
            expiryDate: document.getElementById('expiryDate').value
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
            loadSection('clients'); // Esto recargará la sección con paginación
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
            
            // Actualizar clientes filtrados y recargar tabla
            filteredClients = [...clients];
            
            // Verificar si la página actual está vacía después de eliminar
            const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
            if (currentClientPage > totalPages && totalPages > 0) {
                currentClientPage = totalPages;
            }
            
            updateClientsTable();
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
                            ${pets.map(pet => `<option data-id="${pet.id}" value="${pet.name}">${pet.name} (${pet.species}) - ${pet.clientName || 'Sin propietario'}</option>`).join('')}
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