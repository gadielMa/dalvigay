# 🐕 Dalvigay - Frontend Veterinario 🐱

**Sistema de gestión veterinaria - Interfaz web moderna**

---

## 🎯 **Descripción**

Frontend moderno para el sistema de gestión veterinaria Dalvigay. Interfaz web intuitiva y responsive construida con HTML, CSS y JavaScript vanilla.

---

## 🚀 **Características**

- ✅ **Interfaz moderna** y responsive
- ✅ **Gestión completa** de clientes y pacientes
- ✅ **Control de vacunaciones** y tratamientos
- ✅ **Análisis médicos** y estudios
- ✅ **Dashboard interactivo** con estadísticas
- ✅ **Búsqueda avanzada** y filtros
- ✅ **Diseño veterinario** especializado

---

## 🏗 **Estructura del Proyecto**

```
dalvigay/
├── frontend/              # 🎨 Aplicación frontend completa
│   ├── index.html        # 🏠 Página principal
│   ├── script.js         # ⚡ Lógica de la aplicación (207KB)
│   ├── style.css         # 🎨 Estilos CSS (54KB)
│   ├── api.js           # 🔗 Cliente API (23KB)
│   ├── config.js        # ⚙️ Configuración
│   ├── analytics.js     # 📊 Analytics
│   ├── demo.html        # 🎬 Demo de la aplicación
│   └── *.png           # 🖼️ Imágenes de usuarios
├── api/                  # 📡 Endpoints de conexión
├── server.js            # 🌐 Servidor de desarrollo Node.js
├── package.json         # 📦 Dependencias
├── .env                 # ⚙️ Variables de entorno (DB config)
├── .env.example         # 📋 Ejemplo de configuración
└── vercel.json          # 🚀 Configuración de deploy
```

---

## 🛠 **Instalación y Configuración**

### **Prerequisitos**
- Node.js 16+ para el servidor de desarrollo
- Backend CediapVet ejecutándose (repositorio separado)

### **1. Clonar e instalar**
```bash
# Clonar el repositorio
git clone [URL_DEL_REPO]
cd dalvigay

# Instalar dependencias
npm install
```

### **2. Configurar conexión al backend**
```bash
# El archivo .env ya contiene la configuración
# Verifica que apunte al backend correcto
cat .env
```

### **3. Ejecutar en desarrollo**
```bash
# Opción 1: Servidor Node.js (recomendado)
node server.js

# Opción 2: Servidor estático simple
npx http-server frontend/ -p 3000

# Opción 3: Abrir directamente
open frontend/index.html
```

---

## 🔗 **Conexión con Backend**

Este frontend se conecta al backend **CediapVet** (repositorio separado):
- **Backend Repo**: [cediapvet](https://github.com/gadielMa/cediapvet)
- **API Base URL**: Configurado en `.env`
- **Endpoints**: Documentados en el backend

### **Variables de Entorno**
```env
# Conexión al backend
API_BASE_URL=http://localhost:8080/api
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_NAME=dalvigay_vet
```

---

## 📱 **Funcionalidades**

### **Dashboard Principal**
- Vista general de estadísticas
- Acceso rápido a funciones principales
- Notificaciones y recordatorios

### **Gestión de Clientes**
- Registro y edición de clientes
- Historial de visitas
- Contacto y facturación

### **Gestión de Pacientes**
- Ficha completa de mascotas
- Historial médico
- Seguimiento de tratamientos

### **Control Médico**
- Vacunaciones y calendario
- Análisis de laboratorio
- Estudios por imágenes
- Tratamientos y medicación

### **Reportes y Búsqueda**
- Filtros avanzados
- Exportación de datos
- Estadísticas visuales

---

## 🎨 **Tecnologías**

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Estilos**: CSS Grid, Flexbox, Responsive Design
- **API**: Fetch API, Promise-based
- **Servidor**: Node.js (desarrollo)
- **Deploy**: Vercel-ready

---

## 📊 **API Endpoints**

El frontend consume los siguientes endpoints del backend:

```
GET    /api/clientes          # Obtener clientes
POST   /api/clientes          # Crear cliente
PUT    /api/clientes/{id}     # Actualizar cliente
DELETE /api/clientes/{id}     # Eliminar cliente

GET    /api/pacientes         # Obtener pacientes
POST   /api/pacientes         # Crear paciente
PUT    /api/pacientes/{id}    # Actualizar paciente
DELETE /api/pacientes/{id}    # Eliminar paciente

GET    /api/vacunaciones      # Obtener vacunaciones
POST   /api/vacunaciones      # Crear vacunación
... y más endpoints médicos
```

---

## 🌐 **Deploy**

### **Vercel (Recomendado)**
```bash
# Ya configurado en vercel.json
vercel --prod
```

### **Netlify**
```bash
# Build estático
npm run build
# Deploy carpeta dist/
```

### **GitHub Pages**
```bash
# Configurar GitHub Actions o deploy manual
```

---

## 🔧 **Desarrollo**

### **Estructura de Archivos**
- `frontend/` - Código fuente principal
- `script.js` - Lógica de aplicación
- `style.css` - Estilos CSS
- `api.js` - Cliente para backend

### **Agregar Nuevas Funciones**
1. Crear HTML en `frontend/index.html`
2. Añadir estilos en `frontend/style.css`
3. Implementar lógica en `frontend/script.js`
4. Conectar con API en `frontend/api.js`

---

## 🐛 **Solución de Problemas**

### **Error de conexión con backend**
```bash
# Verificar que el backend esté ejecutándose
curl http://localhost:8080/api/health

# Verificar configuración en .env
cat .env
```

### **Problemas de CORS**
```bash
# El backend ya tiene CORS configurado
# Verificar que las URLs coincidan
```

---

## 📞 **Soporte**

- **Frontend**: Este repositorio
- **Backend**: [cediapvet repo](https://github.com/gadielMa/cediapvet)
- **Demo**: Abrir `index.html` o `demo.html`

---

## 🚀 **Próximas Funcionalidades**

- [ ] Autenticación de usuarios
- [ ] Modo offline
- [ ] Notificaciones push
- [ ] Themes personalizables
- [ ] Mobile app (PWA)
- [ ] Integración con calendario
- [ ] Chat en tiempo real

---

**🎉 Frontend Dalvigay - Interfaz moderna para gestión veterinaria** 🐕🐱

*Conectado con el backend CediapVet para una experiencia completa* 