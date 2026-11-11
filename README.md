# 🏗️ M&C Cotizador - Sistema Oficial de Cotizaciones y Dossier de Obra

Plataforma web de ingeniería para la gestión, cálculo, emisión formal y exportación de cotizaciones y cartas de presentación institucionales de **M&C CONSTRUCCIONES CIVILES S.A.S.** (NIT: 901795226-7), desarrollada con **React 19**, **TypeScript**, **Tailwind CSS v4**, **Vite** y persistencia en la nube mediante **Google Sheets**.

---

## 🌟 Capacidades del Sistema

### 1. Documentos Institucionales con Réplica Vectorial Exacta
* **Cotización de Obra Civil:** Paginación automática A4 (`quote-paginator.ts`), desglose detallado de partidas simples y compuestas, cálculo de AIU (Administración, Imprevistos, Utilidad) e IVA sobre la utilidad según normativa tributaria colombiana.
* **Carta de Presentación Epistolar:** Réplica milimétrica del diseño oficial en azul institucional (`#234794`), tipografía Poppins, paralelogramos decorativos en `-22deg`, membrete formal y conversión determinista del valor total a letras en pesos colombianos (`numberToWordsCOP`).

### 2. Vista Dedicada "Todas las Cotizaciones", Anulación (Soft Delete) y CRUD Cloud
* **Vista Dedicada Multiplataforma (`QuoteRecoveryView.tsx`):** Navegación fluida a pantalla completa optimizada para smartphones, tablets y monitores de escritorio, eliminando limitaciones de scroll de ventanas modales.
* **Búsqueda Instantánea a 0 ms:** Búsqueda reactiva en memoria por consecutivo, cliente o proyecto sobre el catálogo sincronizado de Google Sheets.
* **Pestañas de Estado de Vigencia:** Reemplazo de filtros estáticos de cliente por pestañas segmentadas con contadores en tiempo real:
  - 🟢 **Activas (N):** Ofertas vigentes y operativas listas para seguimiento.
  - ⚫ **Inactivas (N):** Cotizaciones vencidas o anuladas que no contaminan el catálogo activo.
  - 🔵 **Todas (N):** Vista histórica consolidada sin exclusiones.
* **Anulación Lógica (*Soft Delete*) y Reactivación:** Botón directo en tarjeta para marcar ofertas como `Inactiva` o reactivarlas en Google Sheets sin eliminar filas ni romper los consecutivos correlativos (`101`, `102`, `103`, etc.).
* **Evaluación Dinámica de Vigencia:** Detección automática de ofertas caducadas (`calculateExpirationStatus`); si la fecha de vigencia expira, conmuta deterministamente a *Inactiva (Vencida)*.
* **Reseteo Enfocado en Cliente y Proyecto:** Al crear una "Nueva Cotización", la interfaz restablece el formulario en el Paso 1 y enfoca automáticamente el campo de cliente.
* **Reconstrucción Fiel en Texto Plano:** Rehidrata todas las partidas, condiciones de pago y montos directamente desde las 14 columnas nativas de Google Sheets sin archivos temporales ni bases de datos costosas.
* **Actualización Atómica In-Place:** Permite modificar precios, fechas y partidas, actualizando la fila existente en la hoja sin alterar el contador global de consecutivos (`isUpdate: true`).
* **Clonación con 1 Clic:** Opción para duplicar cualquier cotización cargada asignándole un nuevo consecutivo libre.

### 3. Códigos de Serie Oficiales y Fechas en Texto Plano Puro
* **Códigos Dinámicos Corporativos:** Sincronizados directamente desde la pestaña `ConfiguracionMYC` de Google Sheets:
  - Serie Oficial de Cotización: **`C1`** (ej. `C1 N° 102`).
  - Serie Oficial de Carta de Presentación: **`CP 1`** (ej. `CP 1 N° 102`).
* **Saneamiento Defensivo de Fechas:** Filtro estricto `cleanSimpleDate` que erradica cualquier residuo de zona horaria o formato largo (`GMT-0500 (hora estándar de Colombia)`), garantizando siempre el formato corto limpio `DD/MM/YYYY`.

### 4. Motor de Exportación Basado en Patrón Strategy
Estructurado en `src/modules/quote/services/export-strategies/` para ofrecer 4 modalidades de entrega en PDF de alta fidelidad:
* **Dossier Completo (1 solo PDF):** Une la cotización y la carta en un documento corporativo continuo (`MYC_CC[N°].pdf`).
* **Ambos como Archivos Separados (1 Clic):** Genera y descarga de forma secuencial `Cotizacion_[N°].pdf` y `Carta_de_Presentacion_[N°].pdf` con pausa asíncrona protectora.
* **Solo Cotización:** Descarga exclusivamente las hojas técnicas de presupuesto (`Cotizacion_[N°].pdf`).
* **Solo Carta de Presentación:** Descarga exclusivamente la propuesta epistolar formal (`Carta_de_Presentacion_[N°].pdf`).

### 5. Base de Datos en la Nube con Google Sheets (Cero Apagado por Inactividad)
* **Persistencia permanente sin costo ($0 USD):** A diferencia de servicios SQL tradicionales que se suspenden tras 7 o 15 días de inactividad comercial, Google Sheets **nunca se apaga ni se duerme**.
* **Consecutivo Único Atómico (101+):** Gestionado mediante `LockService.getScriptLock()` en Google Apps Script (`google-apps-script/DataBase_Services.gs`), evitando colisiones de números entre usuarios concurrentes.
* **Registro de Prospectos:** Almacena en tiempo real los datos del cliente, proyecto, ubicación, montos, anticipos y una columna de **Estado** (*Pendiente*, *Confirmada*, *Rechazada*) accesible para la gerencia desde el celular.

### 6. Normalizador de Espacios de Color Acelerado por Hardware
* Módulo especializado (`html2canvas-color-shim.ts`) que resuelve la incompatibilidad entre **Tailwind CSS v4** (que compila en `oklch` y `oklab`) y los analizadores tradicionales de canvas, convirtiendo colores en tiempo real (< 1 ms) a sRGB estándar.

### 7. Autocorrector Ortográfico Especializado y Normalizador de Unidades de Obra
* **Motor Determinista Offline en `onBlur` (`orthography-corrector.ts`):** Corrige automáticamente la ortografía, tildes y puntuación al salir del campo o cambiar de línea, sin saltos de cursor ni conflictos con teclados móviles.
* **Diccionario Especializado de Obra Civil:** Más de 500 términos de ingeniería civil colombiana acentuados con precisión (`instalación`, `adecuación`, `demolición`, `excavación`, `mampostería`, `tubería`, `eléctrico`, `hidráulico`, `hormigón`, etc.).
* **Normalización Automática de Unidades Técnicas:** Conversión instantánea de unidades como `m2`/`mt2` a **`m²`**, `m3`/`mt3` a **`m³`**, `psi` a **`PSI`**, y abreviaturas oficiales (`pulg.`, `und.`, `glb.`).
* **Blindaje de Notación de Ingeniería:** Protección absoluta para fracciones de pulgada (`1/2"`, `3/8"`), resistencias (`3000 PSI`), dosificaciones (`1:2:3`) y acrónimos protegidos (`PVC`, `AIU`, `NIT`, `S.A.S.`).
* **Protección de Nombres Propios:** Exclusión del nombre del cliente para evitar cualquier sustitución léxica involuntaria en razones sociales y marcas.

### 8. Arquitectura Responsiva Omnicanal (Mobile, Tablet, Desktop & 4K)
* **Selector Adaptativo de Modos (`< 1024px`):** En dispositivos móviles y tablets, permite alternar con un toque entre la **Consola de Obra** a pantalla completa y el visor de **Vista Previa & PDF**, manteniendo el modo dual simultáneo en computadoras de escritorio.
* **Auto-Escalado Inteligente A4 (Fit-to-Screen):** Algoritmo dinámico que escala la hoja A4 (794px) para encajar con fidelidad milimétrica en cualquier ancho de celular (desde 320px) sin desbordamiento horizontal (`overflow-x`).
* **Menú Móvil Desplegable y Teclados Nativos:** Acceso completo desde smartphones al Consecutivo N°, buscador de recuperación, sincronización con Google Sheets e inputs optimizados con `inputMode="numeric"`.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend UI** | React 19 + TypeScript | Interfaz reactiva en dos columnas con actualización instantánea. |
| **Estilos** | Tailwind CSS v4 + PostCSS | Sistema de diseño moderno, modo claro ergonómico y reglas exactas `@media print`. |
| **Generación PDF** | `html2canvas` + `jspdf` | Rasterizado de alta densidad (escala 2x A4) con renderizado en bóveda limpia 1:1. |
| **Persistencia Cloud** | Google Sheets + Apps Script | Base de datos relacional/tabular sin costos recurrentes ni suspensión por inactividad. |
| **Backend Opcional** | Express + Google Gemini SDK | Extracción asistida de tareas mediante inteligencia artificial y fallback heurístico local. |
| **Despliegue** | Vercel (Frontend Serverless) | Alojamiento en el Edge de alta velocidad con CDN global. |

---

## 📁 Estructura del Proyecto

```
MYC/
├── assets/                                   # Recursos maestros de diseño y plantillas originales
│   ├── branding/                             # Logotipos originales (jpg, svg)
│   └── templates/                            # Vectores maestros (Agente.svg, Plantilla-carta.svg)
│
├── docs/                                     # Documentación técnica y manuales de usuario
│   ├── ARQUITECTURA.md                       # Especificación de ingeniería y diagramas de flujo
│   ├── GUIA_DESPLIEGUE_VERCEL.md             # Manual paso a paso para desplegar en Vercel
│   └── GOOGLE_SHEETS_SETUP.md                # Manual para configurar la base de datos en Sheets
│
├── google-apps-script/                       # Backend en la nube de Google Drive
│   └── DataBase_Services.gs                  # Webhook con LockService, CRUD in-place y configuración corporativa
│
├── public/                                   # Assets estáticos servidos en producción
│   ├── logo-myc.png                          # Logo institucional optimizado
│   └── logo-myc.svg                          # Vector web
│
├── server/                                   # Servidor Express modular (Desarrollo y Gemini AI)
│   ├── config/env.config.ts                  # Variables de entorno
│   ├── modules/ai-agent/                     # Asistente de IA para extracción de partidas
│   └── index.ts                              # Entrypoint del servidor
│
├── src/                                      # Código fuente modular de React 19
│   ├── modules/
│   │   ├── quote/                            # Dominio principal de cotizaciones
│   │   │   ├── components/                   # QuickForm, QuoteDocument, QuoteRecoveryView...
│   │   │   ├── hooks/                        # useQuote, useQuotePdf
│   │   │   └── services/                     # quote-calculator, google-sheets.service, export-strategies...
│   │   └── mailer/                           # Dominio de correos y WhatsApp (EmailModal)
│   │
│   ├── shared/                               # Componentes y utilidades transversales
│   │   ├── components/                       # MCLogo, Toast
│   │   └── utils/                            # currency, text-formatter, orthography-corrector...
│   │
│   ├── App.tsx                               # Orquestador visual con buscador y alertas de borrador
│   ├── main.tsx                              # Punto de entrada React
│   └── index.css                             # Tailwind CSS v4 y reglas @media print
│
├── .env.example                              # Plantilla de variables de entorno
├── package.json                              # Versión 0.6.1 y dependencias
└── tsconfig.json                             # Configuración estricta TypeScript
```

---

## 🚀 Instalación y Puesta en Marcha Local

### Prerrequisitos
* **Node.js** v20 o superior.
* **npm** v10 o superior.

### Pasos
1. **Clonar e instalar dependencias:**
   ```bash
   git clone https://github.com/RuntimeStudioDevs/Myc.git
   cd MYC
   npm install
   ```

2. **Configurar variables de entorno:**
   Copiá el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Opcional: Si ya tenés tu Google Sheets configurado, agregá la URL en `VITE_GOOGLE_SHEETS_WEBHOOK_URL`).*

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abrí tu navegador en: **`http://localhost:3000`**

4. **Ejecutar pruebas unitarias:**
   ```bash
   npm run test
   ```

5. **Verificar tipado y compilar para producción:**
   ```bash
   npm run lint
   npm run build
   ```

---

## 📚 Documentación Adicional

Para más detalles operativos y técnicos, consultá los manuales dedicados:
* 🏛️ [Arquitectura Técnica y Patrones de Diseño](./docs/ARQUITECTURA.md)
* 🚀 [Guía de Despliegue en Vercel](./docs/GUIA_DESPLIEGUE_VERCEL.md)
* 📊 [Manual de Configuración de Google Sheets](./docs/GOOGLE_SHEETS_SETUP.md)

---

## ✒️ Información Corporativa y Contacto
* **Empresa:** M&C CONSTRUCCIONES CIVILES S.A.S.
* **NIT:** 901795226-7
* **Representante Legal:** Ever Becerra
* **Ubicación:** Medellín, Antioquia, Colombia
* **Teléfono Oficial:** 311 796 9848
* **Correo Electrónico:** mcobracivil@gmail.com
