# 🏗️ M&C Cotizador - Generador Oficial de Cotizaciones

Sistema web interactivo y profesional para la emisión, cálculo y exportación de cotizaciones oficiales de **M&C CONSTRUCCIONES CIVILES** (NIT: 901795226-7), desarrollado con **React 19**, **Tailwind CSS v4**, **Vite** y **Express** con soporte para IA mediante **Google Gemini**.

---

## 🚀 Características Principales

- 📑 **Plantilla 1:1 Oficial:** Vista previa en tiempo real con proporción A4 exacta para impresión y descarga.
- ⚡ **Editor Rápido de Variables:** Diligenciamiento dinámico de cliente, proyecto, tareas y condiciones de pago.
- 🧮 **Cálculo Automático de AIU e IVA:** Desglose estandarizado de Administración, Imprevistos, Utilidad e IVA para obras civiles colombianas.
- 📄 **Exportación a PDF de Alta Fidelidad:** Generación de documentos vectoriales/rasterizados con `html2canvas` y `jspdf`.
- ✉️ **Integración de Envío:** Redacción preformateada lista para clientes vía correo electrónico (`mailto:`) y WhatsApp.
- 🤖 **Asistente Inteligente (Gemini AI):** Extracción y actualización asistida de variables con respaldo (*fallback*) heurístico local.

---

## 📁 Estructura del Proyecto (Arquitectura Modular)

El proyecto sigue una arquitectura **Feature-First / Modular**, agrupando la lógica de negocio, componentes y servicios por dominio:

```
MYC/
├── server/                                   # BACKEND MODULAR (Express + Vite + AI)
│   ├── config/env.config.ts                  # Variables de entorno tipadas
│   ├── modules/ai-agent/                     # Asistente de IA para extracción de datos
│   │   ├── ai-agent.controller.ts            # Controlador HTTP (/api/agent/chat)
│   │   ├── ai-agent.service.ts               # Integración con Google GenAI SDK
│   │   ├── ai-agent.fallback.ts              # Extractor heurístico local (sin API Key)
│   │   ├── ai-agent.schema.ts                # Esquema JSON y System Prompt
│   │   └── ai-agent.types.ts                 # Tipos TypeScript del módulo IA
│   ├── routes/api.routes.ts                  # Agregador de rutas API
│   └── index.ts                              # Entrypoint del servidor
│
├── src/                                      # FRONTEND MODULAR (React 19)
│   ├── shared/                               # Componentes y utilidades transversales
│   │   ├── components/ (MCLogo, Toast)       # UI corporativa compartida
│   │   ├── utils/ (currency.ts)              # Formateo de pesos colombianos ($ COP)
│   │   └── types/                            # Tipos globales
│   │
│   ├── modules/
│   │   ├── quote/                            # MÓDULO COTIZACIONES (Core de Negocio)
│   │   │   ├── components/                   # QuickForm, QuoteDocument, QuoteHeader, QuoteToolbar
│   │   │   ├── hooks/                        # useQuote, useQuotePdf
│   │   │   ├── services/                     # quote-calculator (Subtotales, AIU e IVA)
│   │   │   └── types/                        # Modelos y contratos de cotización
│   │   └── mailer/                           # MÓDULO ENVÍO Y COMPARTIR
│   │       ├── components/                   # EmailModal
│   │       └── types/                        # Contratos de correo
│   │
│   ├── App.tsx                               # Orquestador principal conciso y desacoplado
│   ├── main.tsx                              # Punto de entrada de React
│   └── index.css                             # Tailwind CSS v4
│
├── .env.example                              # Plantilla de variables de entorno
└── package.json                              # Scripts y dependencias del proyecto
```

---

## 🛠️ Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** v20 o superior
- **npm** v10 o superior

### Pasos

1. **Clonar e instalar dependencias:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd MYC
   npm install
   ```

2. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Opcional: Si dispones de una API Key de Google Gemini, agrégala en `GEMINI_API_KEY`).*

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   Abre tu navegador en: **`http://localhost:3000`**

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## ✒️ Autor y Créditos
- **Empresa:** M&C CONSTRUCCIONES CIVILES
- **Representante:** Ever Becerra
- **Contacto:** 311 796 9848 | mcobracivil@gmail.com
