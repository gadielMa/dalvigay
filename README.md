# CediapVet - Sistema de Gestión Veterinaria

Un sistema completo de gestión para clínicas veterinarias que incluye registros médicos electrónicos, gestión de inventario y comunicación con clientes.

## Características

### 🏥 Registros Médicos Electrónicos (EMR)
- Base de datos centralizada para historiales médicos
- Gestión de vacunas, diagnósticos y tratamientos
- Seguimiento de resultados de laboratorio
- Programación de citas futuras

### 📦 Gestión de Inventario
- Seguimiento de medicamentos, vacunas y suministros
- Alertas automáticas para reabastecimiento
- Control de fechas de vencimiento
- Evita faltantes o excesos costosos

### 💬 Comunicación con Clientes
- Sistema de mensajería integrado
- Notificaciones de citas por email y SMS
- Campañas de marketing
- Recordatorios de vacunas

## Usuarios del Sistema

### Credenciales de Acceso

**Usuario:** `daniel`  
**Contraseña:** `****`  
**Nombre:** Dr. Daniel Malagrino  
**Foto:** daniel.png  

**Usuario:** `liliana`  
**Contraseña:** `****`  
**Nombre:** Dra. Liliana Vazquez  
**Foto:** liliana.png  

## Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para iconos de Font Awesome)

### Instrucciones de Uso

1. **Iniciar la Aplicación:**
   ```bash
   # Opción 1: Abrir directamente en el navegador
   open index.html
   
   # Opción 2: Usar un servidor local simple
   python -m http.server 8000
   # Luego abrir http://localhost:8000
   ```

2. **Login:**
   - Abrir `index.html` en el navegador
   - Usar las credenciales proporcionadas arriba
   - Hacer clic en "Iniciar Sesión"

3. **Navegación:**
   - Una vez logueado, verás el dashboard principal
   - Usa los botones de navegación para cambiar entre secciones
   - Tu foto y nombre aparecerán en la esquina superior derecha

## Funcionalidades Principales

### Registros Médicos
- **Agregar Registro:** Botón "Nuevo Registro" para crear nuevos historiales
- **Ver Registros:** Tabla con todos los registros médicos
- **Estadísticas:** Tarjetas con información resumida
- **Gestión:** Editar o eliminar registros existentes

### Inventario
- **Agregar Producto:** Botón "Agregar Producto" para nuevos items
- **Monitoreo:** Alertas automáticas para stock bajo y productos por vencer
- **Categorías:** Organización por tipo (Medicamentos, Vacunas, Suministros)
- **Proveedores:** Gestión de información de proveedores

### Comunicación
- **Email:** Envío de correos electrónicos a clientes
- **SMS:** Envío de mensajes de texto
- **Historial:** Registro de todas las comunicaciones enviadas
- **Plantillas:** Mensajes predefinidos para diferentes situaciones

## Estructura de Archivos

```
CediapVet/
├── index.html          # Página principal con login
├── style.css           # Estilos de la aplicación
├── script.js           # Lógica y funcionalidad
├── daniel.png          # Foto del Dr. Daniel
├── liliana.png         # Foto de la Dra. Liliana
└── README.md           # Este archivo
```

## Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Iconos:** Font Awesome 6.0
- **Almacenamiento:** localStorage del navegador
- **Responsive:** Diseño adaptable a diferentes tamaños de pantalla

## Datos de Ejemplo

El sistema viene precargado con datos de ejemplo para facilitar la demostración:

- **Registros Médicos:** 2 registros de ejemplo
- **Inventario:** 3 productos de ejemplo con diferentes estados
- **Clientes:** 2 clientes con información de contacto

## Funcionalidades Futuras

- [ ] Integración con APIs de email/SMS reales
- [ ] Reportes y gráficos
- [ ] Backup automático de datos
- [ ] Gestión de usuarios y permisos
- [ ] Integración con sistemas de facturación
- [ ] Aplicación móvil

## Notas de Seguridad

⚠️ **Importante:** Este es un sistema de demostración. Para uso en producción:
- Implementar autenticación real
- Usar base de datos segura
- Cifrar datos sensibles
- Implementar backups regulares

## Soporte

Para cualquier problema o sugerencia, contacta al desarrollador.

---

**CediapVet v1.0** - Sistema desarrollado para la gestión integral de clínicas veterinarias. 