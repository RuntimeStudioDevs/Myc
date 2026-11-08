# 📊 Manual de Configuración: Base de Datos en Google Sheets

Este manual describe cómo habilitar tu propia hoja de **Google Sheets** para que funcione como la base de datos oficial en la nube de **M&C Construcciones Civiles**, con guardado automático de clientes y asignación atómica de números consecutivos.

---

## 🌟 Beneficios Clave
1. **$0 USD para siempre:** No requiere suscripciones, tarjetas de crédito ni servidores dedicados.
2. **Cero suspensión por inactividad:** A diferencia de bases de datos tradicionales en la nube (como Supabase o Render que se apagan a los 7 o 15 días sin uso), **Google Sheets nunca se suspende ni duerme**. Si pasas 2 meses sin cotizar, responderá al instante.
3. **Acceso móvil para la gerencia:** El dueño y el equipo comercial pueden abrir la aplicación de Google Sheets en sus celulares (Android o iPhone) para ver prospectos, filtrar cotizaciones por cliente y cambiar su estado.
4. **Consecutivo correlativo garantizado (101+):** Utiliza `LockService` para que nunca existan dos cotizaciones con el mismo número.

---

## 🛠️ Paso a Paso: Configuración en 3 Minutos

### Paso 1: Crear la Hoja de Cálculo
1. Entra a tu cuenta de Google en tu navegador.
2. Entra a [sheets.new](https://sheets.new) (o entra a Google Drive y crea una nueva Hoja de Cálculo).
3. Nómbrala en la esquina superior izquierda: **"Cotizaciones M&C Construcciones"**.

---

### Paso 2: Abrir el Editor de Apps Script
1. En el menú superior de la hoja, haz clic en: **Extensiones** > **Apps Script**.
2. Se abrirá una nueva pestaña con el editor de código de Google.
3. Borra cualquier código que aparezca en el editor (ej. `function myFunction() { ... }`).

---

### Paso 3: Pegar el Código Oficial
1. Abre en tu proyecto el archivo: [`google-apps-script/Code.gs`](file:///c:/Users/USUARIO/Desktop/MYC/google-apps-script/Code.gs).
2. Copia todo su contenido y pégalo dentro del editor de Google Apps Script.
3. Haz clic en el icono del **Disquete (Guardar)** o presiona `Ctrl + S`.

---

### Paso 4: Implementar como Aplicación Web
1. En la esquina superior derecha, haz clic en el botón azul **"Implementar"** (Deploy) y selecciona **"Nueva implementación"** (New deployment).
2. En la ventana que aparece, haz clic en el icono de **Engranaje** (⚙️) junto a "Seleccionar tipo" y elige **"Aplicación web"** (Web app).
3. Configura los campos exactamente así:
   - **Descripción:** `M&C Cotizador API`
   - **Ejecutar como (Execute as):** `Yo (tu_correo@gmail.com)`
   - **Quién tiene acceso (Who has access):** `Cualquiera` (Anyone)  
     *(⚠️ Es fundamental seleccionar "Cualquiera" para que el cotizador web en Vercel pueda comunicarse con la hoja sin exigir que cada cliente inicie sesión con cuenta Google).*
4. Haz clic en el botón azul **"Implementar"**.

---

### Paso 5: Autorizar Permisos de Google
Google te solicitará autorizar que el script edite tu hoja:
1. Haz clic en **"Revisar permisos"** (Review permissions).
2. Elige tu cuenta de Google.
3. Si Google muestra una pantalla que dice *"Google no ha verificado esta aplicación"*, haz clic en el enlace pequeño abajo que dice **"Configuración avanzada"** (Advanced) y luego en **"Ir a M&C Cotizador API (no seguro)"**.
4. En la siguiente pantalla, haz clic en **"Permitir"**.

---

### Paso 6: Copiar la URL del Webhook
Al finalizar la implementación, Google te mostrará una ventana con:
- **URL de la aplicación web:** Un enlace que luce así:  
  `https://script.google.com/macros/s/AKfycbz.../exec`
- Copia esta URL completa.

---

### Paso 7: Conectar en el Cotizador Web
Tienes dos formas sencillas de conectarla:

#### Opción A: Desde el propio navegador (En 1 clic)
1. Abre el cotizador web en tu navegador.
2. En la barra superior junto a *Consecutivo N°*, haz clic en el botón **"Conectar Sheets"**.
3. Pega la URL en el campo y presiona **"Probar Conexión"**.
4. Verás una confirmación en verde: *"¡Conexión exitosa! Próximo consecutivo en la nube: N° 101"*.
5. Presiona **"Guardar"**. ¡Listo! Ya estás conectado en la nube.

#### Opción B: Mediante archivo `.env` o en Vercel
En tu archivo `.env` local o en las variables de entorno de tu proyecto en Vercel, agrega:
```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/TU_ID_AQUI/exec"
```

---

## 📋 Estructura de Columnas Generada Automáticamente

Cuando se guarde la primera cotización, el script creará automáticamente la pestaña **`Cotizaciones`** con cabeceras en azul institucional (`#234794`) y letras blancas:

| Col | Encabezado | Tipo de Dato | Ejemplo |
| :---: | :--- | :---: | :--- |
| **A** | **N° Consecutivo** | Número entero correlativo | `101`, `102`, `103`... |
| **B** | **Fecha** | Texto (DD/MM/AAAA) | `08/11/2026` |
| **C** | **Cliente** | Texto en Proper Case | `Constructora Bolívar S.A.S.` |
| **D** | **Proyecto** | Texto descriptivo | `Remodelación Torre Empresarial` |
| **E** | **Ubicación** | Texto | `Medellín - El Poblado` |
| **F** | **Total Cotizado ($)** | Moneda formateada COP | `$ 38.500.000` |
| **G** | **Anticipo (%)** | Porcentaje numérico | `50` |
| **H** | **Saldo (%)** | Porcentaje numérico | `50` |
| **I** | **Estado** | Estado del negocio | `Enviada`, `Aprobada`, `Rechazada` |
| **J** | **Teléfono Contacto** | Teléfono de la empresa | `311 796 9848` |
| **K** | **Correo Contacto** | Email oficial | `mcobracivil@gmail.com` |
| **L** | **Ciudad** | Ciudad de emisión | `Medellín` |
| **M** | **N° Ítems** | Cantidad de partidas | `3` |
| **N** | **Fecha Creación (ISO)** | Timestamp de auditoría | `2026-11-08T15:30:00.000Z` |

---

## 📱 Gestión de Cotizaciones desde el Celular

Para el equipo directivo de M&C:
1. Instala la app gratuita **Google Sheets** en tu teléfono (Android o iOS).
2. Abre la hoja *"Cotizaciones M&C Construcciones"*.
3. Puedes cambiar manualmente el valor de la Columna **I (Estado)** a:
   - `Enviada` (Valor por defecto cuando el cotizador emite el PDF).
   - `Aprobada` (Cuando el cliente firma o paga el anticipo).
   - `Rechazada` (Si el cliente descarta la propuesta).
   - `En Espera` (En revisión por parte del cliente).
4. El cotizador **nunca sobreescribe** filas existentes; siempre agrega nuevas filas al final respetando el consecutivo más alto.
