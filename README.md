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
- `POST /translate/:grammar?`  
  Traduce el texto recibido en `text` desde `l2` hacia `l1`, devuelve texto traducido y glosas morfema a morfema. Cuando `:grammar` tiene cualquier valor, agrega puntos gramaticales. Si `l2` es chino (`zh`), la glosa incluye segmentacion en hanzi y pinyin.

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
- `POST /translate/:grammar?`  
  Translates the `text` field from `l2` into `l1`, returning translated sentences and morpheme-by-morpheme glosses. When `:grammar` has any value, grammar points are included. If `l2` is Chinese (`zh`), the gloss includes hanzi segmentation and pinyin.

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

### Quick development
- Install dependencies (if needed): `bun install`
- Start the server: `bun run src/index.ts` or use `./start-backend.sh` to handle environment variables automatically.

---

## API documentation (English)

### Base URL
- Local: ``

### Authentication
Protected endpoints require a short-lived access token obtained via Play Integrity attestation.

1) Call `POST /auth/attest` with a Play Integrity token.
2) Use the returned token in `Authorization: Bearer <token>` for protected routes.

Tokens expire after 15 minutes.

### Endpoints

#### `GET /`
Simple health check.

Response:
```text
Hello Language Enthusiast!
```

#### `GET /languages`
Returns the supported ISO 639-1 language codes.

Headers:
- `Authorization: Bearer <token>`

Response:
```json
{
  "languages": ["spanish", "english", "portuguese", "chinese", "vietnamese"]
}
```

#### `POST /auth/attest`
Exchanges a Play Integrity token for a short-lived API token.

Request body:
```json
{
  "integrityToken": "<PLAY_INTEGRITY_TOKEN>"
}
```

Response:
```json
{
  "token": "<JWT_TOKEN>",
  "expiresIn": 900
}
```

Error response (invalid attestation):
```json
{
  "error": "Attestation failed"
}
```

#### `POST /translate/:grammar?`
Translates from `l2` (source text language) to `l1` (student native language) and returns interlinear glosses. If `:grammar` has any value (for example `/translate/1` or `/translate/grammar`), grammar points are included. If `l2` is `zh`, the gloss includes hanzi segmentation and pinyin.

Headers:
- `Authorization: Bearer <token>`

Request body:
```json
{
  "text": "This is a simple example.",
  "l1": "en",
  "l2": "es"
}
```

Response (alphabetic languages):
```json
{
  "request_id": "0195a0f2-0a5f-7ab8-9f19-4c34f99a6f7e",
  "translatedText": ["This is a simple example."],
  "glossedText": [
    {
      "originalText": ["esto", "es", "un", "ejemplo", "simple"],
      "glossedWords": ["this", "is", "a", "example", "simple"]
    }
  ]
}
```

Error response (missing/invalid token):
```json
{
  "error": "Missing or invalid Authorization header"
}
```

Response with grammar points (`/translate/1`):
```json
{
  "request_id": "0195a0f2-0a5f-7ab8-9f19-4c34f99a6f7e",
  "translatedText": ["This is a simple example."],
  "glossedText": [
    {
      "originalText": ["esto", "es", "un", "ejemplo", "simple"],
      "glossedWords": ["this", "is", "a", "example", "simple"]
    }
  ],
  "grammarPoints": {
    "points": [
      {
        "grammar_point": "Ser vs estar",
        "sentence": "Esto es un ejemplo simple.",
        "explanation": "The verb ser is used for inherent characteristics..."
      }
    ]
  }
}
```

Response when `l2` is `zh`:
```json
{
  "request_id": "0195a0f2-0a5f-7ab8-9f19-4c34f99a6f7e",
  "translatedText": ["Hello world"],
  "glossedText": [
    {
      "separateWords": ["你好", "世界"],
      "pinyin": ["ni hao", "shi jie"],
      "glossedWords": ["hello", "world"]
    }
  ]
}
```

### Validation rules
- `text` must be between 1 and 450 characters after trimming and collapsing whitespace.
- `l1` and `l2` must be different and must match supported ISO 639-1 codes.
- The detected language of `text` must match `l2` (otherwise the request is rejected).

### Environment variables
- `AI_KEY`: API key for the LLM provider.
- `AI_BASE_URL`: Base URL for the LLM provider.
- `AI_MODEL`: Model used for glossing and grammar extraction (defaults to `qwen3-max`).
- `PLAY_INTEGRITY_PACKAGE_NAME`: Android package name used for Play Integrity validation.
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Service account JSON (stringified) with Play Integrity access.
- `ATTESTATION_JWT_SECRET`: Secret used to sign short-lived access tokens.

### OpenAPI
See the standalone spec in `openapi.yaml`.
