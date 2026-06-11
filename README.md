# WEA-ther
<img width="1271" height="546" alt="WEA_Ther_main_cut" src="https://github.com/user-attachments/assets/81b362d9-4f9b-4616-b934-f69388226201" />

WEA-ther es una aplicación web interactiva inspirada en los sistemas meteorológicos retro (como The Weather Channel, IntelliStar y WeatherScan). Ofrece pronósticos del clima en tiempo real, alertas automáticas, oleaje y mareas, calidad del aire, mapas de radar continental y local, locución por voz por medio de síntesis de texto a voz (TTS) y un reproductor de radio/música en segundo plano.

El sistema cuenta con un panel administrativo para configurar cada aspecto visual, geográfico y de funcionamiento, así como un panel de supervisor interactivo basado en consola.

---

## Características Principales

- **Pronósticos en tiempo real**: Datos de clima actualizados usando proveedores gratuitos y abiertos como `open-meteo`.
- **Estilo Retro Premium**: Diseño nostálgico que evoca las transmisiones meteorológicas clásicas por televisión, con fuentes pixeladas, gráficos temáticos y transiciones animadas.
- **Audio Integrado**: Reproducción automática de música ambiental retro desde Archive.org o transmisiones de radio en línea, además de voz en off (TTS) para anunciar los boletines meteorológicos.
- **Mapas de Radares**: Integración con Mapbox y ESRI para vistas de radar meteorológico continental y local con esquemas de color personalizables.
- **Panel Administrativo (`/admin`)**: Interfaz web segura protegida con contraseña y autenticación de dos factores (2FA / TOTP) para modificar y guardar toda la configuración en `settings.json`.
- **Consola del Supervisor (`scripts/dashboard.js`)**: Una consola en terminal interactiva que funciona como proxy inverso para monitorear el rendimiento del servidor, ver solicitudes HTTP interceptadas, gestionar el túnel web y reiniciar el servidor en modo de desarrollo o producción de forma sencilla.

---

## Requisitos Previos

- **Node.js**: Versión 18 o superior recomendada.
- **PowerShell** (Windows): Necesario para ejecutar el script de descarga de recursos multimedia. En macOS o Linux, puedes descargar y extraer los recursos en sus respectivas rutas de forma manual.

---

## Instalación y Configuración

Sigue estos pasos para poner en marcha el proyecto:

### 1. Clonar el Repositorio e Instalar Dependencias
Clona este repositorio en tu máquina local e instala los paquetes necesarios de npm:

```bash
npm install
```

### 2. Descargar Recursos Estáticos (Fuentes y Gráficos Retro)
Por motivos de peso, las fuentes personalizadas y los recursos multimedia retro (iconos de clima, radares de base, etc.) no se incluyen en el repositorio de Git. Debes ejecutar el script de descarga en PowerShell para configurarlos automáticamente:

```powershell
# En Windows (ejecutar en la raíz del proyecto):
.\download_assets.ps1
```

*Este script descargará las fuentes retro (Star3000, Star4000, StarJR), los packs de iconos de clima (`ccef`), radares (`rcrf`) y fases lunares (`moon`), y los extraerá en la carpeta `public/`.*

### 3. Configuración Inicial de Seguridad
Al iniciar el proyecto por primera vez, el archivo `settings.json` viene limpio y sin contraseñas activas. 
- Inicia el servidor (ver sección siguiente).
- Abre tu navegador en la sección de administración: [http://localhost:3000/admin](http://localhost:3000/admin).
- La aplicación detectará que es el primer inicio y te guiará para configurar tu **Contraseña Maestra** y escanear el código QR para tu **Autenticación de Dos Factores (2FA)**.
- También podrás configurar las credenciales opcionales de Gemini para habilitar generación o análisis avanzados de reportes.

---

## Ejecución del Proyecto

Puedes arrancar la aplicación de dos maneras:

### Opción A: A través de la Consola del Supervisor (Recomendado)
El supervisor proporciona un panel de control interactivo en tiempo real directamente en tu terminal. Monitorea el uso de CPU/RAM, registra solicitudes HTTP y te permite alternar configuraciones.

Ejecuta el siguiente comando:
```bash
npm run supervisor
# o directamente:
node scripts/dashboard.js
```

**Controles de la Consola:**
- `[1]` o `[2]` en el arranque: Elige arrancar en modo **Desarrollo** (`next dev`) o **Producción** (`next build & next start`).
- `[↑/↓]`: Navega entre las pestañas (Logs, Errores, Configuración actual de la Interfaz, Actualizaciones).
- `[s]`: Reinicia de manera limpia el servidor Next.js de fondo.
- `[t]`: Enciende o apaga un túnel público temporal (`localtunnel`) para compartir tu estación meteorológica retro en línea.
- `[r]`: Fuerza la recarga y comprobación de actualizaciones de paquetes en npm.
- `[q]` o `[F10]`: Apaga limpiamente el servidor Next.js, detiene el túnel y cierra el supervisor.

### Opción B: Ejecución Estándar de Next.js
Si prefieres no usar el supervisor, puedes compilar y ejecutar el servidor Next.js directamente:

**Modo de Desarrollo:**
```bash
npm run dev
```

**Modo de Producción:**
```bash
npm run build
npm run start
```

---

## Licencia y Créditos

Este proyecto se distribuye con fines educativos e informativos sobre recreación retro. Consulta el archivo `settings.json` para ver la lista completa de proveedores de datos e iconos de terceros integrados en las llamadas del sistema.
