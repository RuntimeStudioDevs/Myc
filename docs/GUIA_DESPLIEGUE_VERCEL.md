# 🚀 Guía de Despliegue en Vercel (Paso a Paso)

Este documento detalla el procedimiento para desplegar el cotizador de **M&C Construcciones Civiles** en **Vercel** de manera gratuita, rápida y con soporte para producción global.

---

## 1. Prerrequisitos

1. Una cuenta activa en [Vercel](https://vercel.com/) (puedes iniciar sesión con GitHub o tu correo).
2. El código del proyecto subido a un repositorio en **GitHub** o **GitLab**.
3. (Opcional pero recomendado) La URL de la aplicación web de Google Sheets generada siguiendo la [Guía de Google Sheets](./GOOGLE_SHEETS_SETUP.md).

---

## 2. Método Recomendado: Despliegue desde GitHub

### Paso 1: Importar el Repositorio en Vercel
1. Entra a tu panel de control en [vercel.com/dashboard](https://vercel.com/dashboard).
2. Haz clic en el botón azul **"Add New..."** > **"Project"**.
3. Selecciona tu proveedor (ej. GitHub) y busca el repositorio `MYC` (o el nombre que le diste a tu proyecto).
4. Haz clic en **"Import"**.

---

### Paso 2: Configuración del Proyecto (Build and Output Settings)
Vercel detectará automáticamente que el proyecto utiliza **Vite**. Asegúrate de que los campos coincidan con la siguiente configuración:

| Campo | Valor Recomendado |
| :--- | :--- |
| **Framework Preset** | `Vite` |
| **Root Directory** | `./` *(raíz del proyecto)* |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

### Paso 3: Configurar Variables de Entorno (Environment Variables)
En la sección **"Environment Variables"**, despliega el acordeón y agrega:

| Nombre de la Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `VITE_GOOGLE_SHEETS_WEBHOOK_URL` | `https://script.google.com/macros/s/.../exec` | La URL de tu Google Apps Script para guardar clientes y consecutivos automáticamente. |

> [!TIP]
> Si aún no has creado tu hoja de Google Sheets, puedes dejar este campo vacío por ahora. El cotizador funcionará perfectamente en **Modo Local** e iniciará en el consecutivo `101`. Podrás agregar la URL en cualquier momento desde los ajustes de Vercel o directamente desde el botón **"Conectar Sheets"** en la barra superior de la aplicación.

---

### Paso 4: Desplegar
1. Haz clic en el botón azul **"Deploy"**.
2. Espera aproximadamente 1 minuto mientras Vercel instala las dependencias y compila con Vite.
3. Al finalizar, verás una pantalla de felicitación con un dominio asignado (ej. `https://myc-cotizador.vercel.app`).

---

## 3. Método Alternativo: Despliegue mediante Vercel CLI (Línea de Comandos)

Si prefieres desplegar directamente desde tu terminal local de PowerShell:

1. **Instalar Vercel CLI globalmente:**
   ```powershell
   npm install -g vercel
   ```

2. **Iniciar sesión en Vercel:**
   ```powershell
   vercel login
   ```

3. **Ejecutar el comando de despliegue:**
   ```powershell
   vercel
   ```
   *Responde a las preguntas interactivas presionando `Enter` para aceptar los valores por defecto (Link to existing project: No, Project name: myc, Output: dist).*

4. **Para desplegar a producción final:**
   ```powershell
   vercel --prod
   ```

---

## 4. Configuración de Redirecciones SPA (`vercel.json`)

Para garantizar que las rutas de React y la recarga en el navegador funcionen sin errores 404, el proyecto puede incluir un archivo `vercel.json` en la raíz (opcional para SPAs simples con Vite). Si lo necesitas:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 5. Lista de Verificación Post-Despliegue (Checklist)

Una vez desplegada tu aplicación:
- [ ] Entra a la URL de Vercel desde tu celular y desde la computadora.
- [ ] Verifica que el consecutivo inicial muestre **`101`** (o el consecutivo actual de tu Google Sheets).
- [ ] Haz clic en **"Cargar Ejemplo"** y luego en **"Descargar Dossier (PDF)"**.
- [ ] Confirma que el PDF se descargue con el nombre oficial `MYC_CC101.pdf`.
- [ ] Si conectaste Google Sheets, abre tu hoja en Google Drive y comprueba que la fila con la cotización se haya insertado instantáneamente.
