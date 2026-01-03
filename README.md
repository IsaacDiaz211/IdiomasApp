# IdiomasApp

## Resumen en Español

IdiomasApp es un backend de traducción y análisis lingüístico construido con TypeScript y el runtime de Bun. Expone un servicio HTTP con Elysia.js que usa validaciones con Zod y se integra con la API de OpenAI (modelos Qwen) para traducir, segmentar y explicar gramática en varios idiomas.

### Tecnologías principales
- **TypeScript** sobre **Bun.js** como runtime.
- **Elysia.js** para definir el servidor y las rutas.
- **Zod** y los esquemas de Elysia para validar solicitudes y respuestas.
- **OpenAI API** usando modelos **Qwen** para traducción, glosa interlineal y puntos gramaticales.

### Idiomas soportados
Los códigos ISO 639-1 aceptados se definen en `src/schemas/languages.ts`:
- Español (`es`)
- Inglés (`en`)
- Portugués (`pt`)
- Chino (`zh`)
- Vietnamita (`vi`)

### Rutas principales
- `GET /`  
  Respuesta de saludo simple para verificar que el servicio está vivo.
- `GET /languages`  
  Devuelve el listado de idiomas soportados.
- `POST /translate`  
  Traduce el texto recibido en `text` desde `l2` hacia `l1`, devuelve texto traducido, glosas morfema a morfema y puntos de gramática cuando aplican.
- `POST /translate/chinese`  
  Variante especializada cuando el idioma destino (`l2`) es chino (`zh`). Además de la traducción, devuelve segmentación en hanzi, pinyin y glosa al idioma origen (`l1`).

### Uso del script `start-backend.sh`
1. Asegúrate de tener **Bun** instalado y disponible en el `PATH`.
2. Desde la raíz del proyecto ejecuta:
   ```bash
   ./start-backend.sh
   ```
3. El script solicitará las variables de entorno necesarias si no existen:
   - `AI_KEY` (se solicita de forma oculta)
   - `AI_BASE_URL`
   - `AI_MODEL`
4. El servidor se inicia en `http://localhost:3000` y acepta solicitudes desde `http://localhost:5173` gracias a la configuración de CORS en `src/index.ts`.

### Ejemplos de petición
`POST /translate`
```json
{
  "text": "Esto es un ejemplo simple.",
  "l1": "es",
  "l2": "en"
}
```

`POST /translate/chinese`
```json
{
  "text": "你好世界",
  "l1": "es",
  "l2": "zh"
}
```

### Desarrollo rápido
- Instala dependencias (si es necesario): `bun install`
- Inicia el servidor: `bun run src/index.ts` o usa `./start-backend.sh` para que el script gestione las variables de entorno.

---

## English Overview

IdiomasApp is a translation and linguistic analysis backend built with TypeScript on the Bun runtime. It exposes an HTTP service with Elysia.js, validates inputs with Zod, and integrates with the OpenAI API (Qwen models) to translate, gloss, and extract grammar points across multiple languages.

### Key technologies
- **TypeScript** on **Bun.js** runtime.
- **Elysia.js** to define the server and routes.
- **Zod** and Elysia schemas to validate requests and responses.
- **OpenAI API** using **Qwen** models for translation, interlinear glossing, and grammar extraction.

### Supported languages
ISO 639-1 codes defined in `src/schemas/languages.ts`:
- Spanish (`es`)
- English (`en`)
- Portuguese (`pt`)
- Chinese (`zh`)
- Vietnamese (`vi`)

### Main routes
- `GET /`  
  Simple greeting to confirm the service is running.
- `GET /languages`  
  Returns the list of supported languages.
- `POST /translate`  
  Translates the `text` field from `l2` into `l1`, returning translated sentences, morpheme-by-morpheme glosses, and grammar points when available.
- `POST /translate/chinese`  
  Specialized flow when the target language (`l2`) is Chinese (`zh`). In addition to translation, it returns hanzi segmentation, pinyin, and glossed words in the source language (`l1`).

### Using `start-backend.sh`
1. Ensure **Bun** is installed and available in your `PATH`.
2. From the project root, run:
   ```bash
   ./start-backend.sh
   ```
3. The script will prompt for required environment variables if they are missing:
   - `AI_KEY` (prompted silently)
   - `AI_BASE_URL`
   - `AI_MODEL`
4. The server starts at `http://localhost:3000` and accepts requests from `http://localhost:5173` via the CORS configuration in `src/index.ts`.

### Request examples
`POST /translate`
```json
{
  "text": "This is a simple example.",
  "l1": "en",
  "l2": "es"
}
```

`POST /translate/chinese`
```json
{
  "text": "你好世界",
  "l1": "en",
  "l2": "zh"
}
```

### Quick development
- Install dependencies (if needed): `bun install`
- Start the server: `bun run src/index.ts` or use `./start-backend.sh` to handle environment variables automatically.
