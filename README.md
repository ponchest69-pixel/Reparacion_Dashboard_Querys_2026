# Panel de Reparaciones — Philo VLP

Dashboard interactivo que fusiona los archivos **RepairedByDateShiftModel.xlsx** (intake por turno) y **PhiloVLP_RepairDetail.xlsx** (detalle de fallas) por Serial Number / Unit SN. 100% estático — HTML, CSS y JavaScript puro con Chart.js — listo para publicarse en GitHub Pages.

## Estructura del proyecto

```text
Dashboard/
├── assets/
│   └── vendor/
│       └── chart.umd.min.js   ← Chart.js incluido localmente (sin CDN externo)
├── data/
│   └── datos.json             ← todos los datos del dashboard
├── index.html
├── script.js
├── style.css
└── README.md
```

No borres ni renombres ningún archivo o carpeta: `index.html` los referencia por su ruta relativa exacta.

## 1. Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (público o privado con GitHub Pages habilitado).
2. Sube el **contenido** de esta carpeta `Dashboard/` a la raíz del repositorio (no subas la carpeta comprimida ni la carpeta `Dashboard` como subcarpeta — los archivos `index.html`, `style.css`, etc. deben quedar en la raíz del repo).
3. Verifica que la estructura en GitHub quede así:

   ```text
   tu-repositorio/
   ├── assets/
   ├── data/
   ├── index.html
   ├── script.js
   ├── style.css
   └── README.md
   ```

4. Ve a **Settings → Pages → Build and deployment → Source: Deploy from a branch**, elige la rama `main` y la carpeta `/(root)`, y guarda.
5. Espera 1–2 minutos. GitHub te dará una URL pública con este formato:

   ```text
   https://tu-usuario.github.io/tu-repositorio/
   ```

6. Abre esa URL — el dashboard debe cargar automáticamente los datos y mostrar todas las gráficas, KPIs, tablas y filtros.

## 2. Actualizar los datos más adelante

Para refrescar el dashboard con datos nuevos, **solo necesitas reemplazar** el archivo:

```text
data/datos.json
```

manteniendo exactamente la misma estructura de campos (mismas llaves, mismo formato). No es necesario tocar `index.html`, `script.js` ni `style.css`. Sube el nuevo `datos.json` al repositorio (reemplazando el anterior) y la URL de GitHub Pages se actualizará sola en cuanto GitHub termine de desplegar el cambio (normalmente menos de un minuto).

### Cómo crear subcarpetas directamente en GitHub (interfaz web)

Si necesitas recrear `data/datos.json` o `assets/vendor/chart.umd.min.js` manualmente desde la web de GitHub (sin usar git en tu computadora):

1. Entra al repositorio → botón **Add file → Create new file**.
2. En el campo de nombre de archivo escribe la ruta completa, por ejemplo `data/datos.json` — GitHub crea automáticamente la carpeta `data/` al detectar el `/`.
3. Pega el contenido y confirma el commit.

## 3. Probar en tu computadora (opcional)

⚠️ **Importante:** este dashboard usa `fetch('data/datos.json')` para cargar los datos. Los navegadores bloquean `fetch()` cuando abres un archivo HTML directamente con doble clic (protocolo `file://`) — es una restricción de seguridad del navegador, **no es un error del dashboard**. Si lo abres así, verás un mensaje de error explicando exactamente esto, en vez de un dashboard vacío o roto.

Para probarlo localmente de forma correcta, sirve la carpeta con un servidor HTTP simple (cualquiera de estas opciones funciona):

```bash
# Opción A: Python (ya viene instalado en la mayoría de sistemas)
cd Dashboard
python3 -m http.server 8000
# luego abre http://localhost:8000 en tu navegador

# Opción B: Node.js
npx serve .

# Opción C: extensión "Live Server" de VS Code
```

Esto es **opcional** — para publicar en GitHub Pages no necesitas hacer nada de esto, GitHub sirve los archivos por HTTPS automáticamente.

## 4. Contenido del dashboard

- **KPIs generales**: eventos analizados, unidades únicas, aging promedio, repair count promedio, tasa de scrap, periodo analizado.
- **Fusión de archivos**: visualización del cruce por Serial Number entre ambas fuentes.
- **Tendencias**: volumen de reparaciones por mes/turno y por semana.
- **Análisis de defectos**: Pareto de defectos y comparación por turno.
- **Reincidencia vs. resultado final**: relación entre Repair Count y tasa de Scrap/Fail.
- **Estaciones de falla y reparación**: dónde se detectan y dónde se resuelven los defectos.
- **Rendimiento por número de parte**: tabla comparativa top 10.
- **Aging y equipo técnico**: tiempos de resolución por defecto y carga por técnico.
- **Unidades más problemáticas**: tabla filtrable de las unidades con mayor reincidencia (búsqueda por SN o Part Number).

## 5. Notas técnicas

- Chart.js 4.4.4 está incluido localmente en `assets/vendor/chart.umd.min.js` — no depende de ningún CDN externo, por lo que funciona igual en GitHub Pages, en una intranet o en cualquier hosting estático.
- Todas las rutas del proyecto son relativas; puedes mover la carpeta completa a cualquier ubicación o repositorio sin romper nada.
- Si `data/datos.json` no carga (por ruta incorrecta, JSON corrupto, o por abrir el archivo con `file://`), el dashboard muestra un mensaje de error claro en pantalla en vez de fallar en silencio.
