# Plan de Refactorización del Pipeline de Traducción

## 1. Objetivo

Optimizar el uso de llamadas a la API de modelos de IA para generar traducciones en formato "Interlinear Gloss". El problema actual es que la separación morfológica del texto (gloss) se recalcula para cada par de idiomas fuente→destino, cuando en realidad solo depende del idioma fuente.

## 2. Problema Actual

Cuando se generan traducciones desde un idioma fuente (ej: chino) hacia múltiples idiomas destino (inglés, español, portugués, vietnamita):

1. Para cada par (fuente→destino) se llama a la API para:
   - Separar el texto en morfemas
   - Generar el gloss interlineal
   - Generar traducción natural
   - Generar grammar points

2. **Ineficiencia**: La separación de morfemas y el gloss son idénticos para todos los destinos, solo varían las traducciones.

## 3. Flujo Propuesto

### 3.1 Diagrama General

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TEXTO FUENTE                                 │
│              (zh / es / en / pt / vi)                               │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 1: SEPARAR MORFEMAS (1 LLAMADA API)                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Chino (zh):                                                     │  │
│  │   - separateWords: ["这", "封信", "来自", ...]                  │  │
│  │   - pinyin: ["zhè", "fēngxìn", "láizì", ...]                 │  │
│  │   - glossedWords: NO se genera aquí                          │  │
│  │                                                                  │  │
│  │ Idiomas Alfabéticos (es/en/pt/vi):                             │  │
│  │   - morphems: ["Los", "autos", "rojos"]                  │  │
│  │   - pinyin: NO APLICA                                         │  │
│  │   - glossedWords: NO se genera aquí                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   IDIOMA 1      │  │   IDIOMA 2      │  │   IDIOMA N      │
│   (en/es/pt/vi)│  │   (en/es/pt/vi)│  │   (en/es/pt/vi)│
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 2: PARA CADA IDIOMA DESTINO (en paralelo o secuencia)        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 2.1 GENERAR GLOSS INTERLINEAL                                 │  │
│  │     Input: morfemas separados + idioma destino                │  │
│  │     Output: glossedWords para ese idioma                     │  │
│  │                                                                  │  │
│  │ 2.2 GENERAR TRADUCCIÓN NATURAL                                │  │
│  │     Input: texto fuente completo                              │  │
│  │     Output: traducción fluida al idioma destino               │  │
│  │                                                                  │  │
│  │ 2.3 GENERAR GRAMMAR POINTS                                    │  │
│  │     Input: texto fuente + idioma destino                      │  │
│  │     Output: puntos gramaticales explicados en destino        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASE 3: GENERAR JSONs                                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Por cada idioma destino:                                      │  │
│  │   - Combinar: morfemas base + gloss destino + traducción    │  │
│  │   - Estructura FINAL (SIN CAMBIOS respecto a actual)        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Comparación de Llamadas API

| Escenario | Antes (por cada par) | Después |
|-----------|---------------------|---------|
| Chino → [en, es, pt, vi] | 4 × (gloss + trad + grammar) = 12 llamadas | 1 (morfemas) + 4×(gloss+trad+grammar) = 13 llamadas |
| Español → [en, zh, pt, vi] | 4 × (gloss + trad + grammar) = 12 llamadas | 1 (morfemas) + 4×(gloss+trad+grammar) = 13 llamadas |

**Ahorro real**: Se elimina la redundancia de recalcular la separación morfológica N veces. Para N destinos, se ahorra (N-1) llamadas de separación + (N-1) llamadas de gloss.

## 4. Archivos a Modificar

### 4.1 Resumen de Cambios

| # | Archivo | Tipo de Cambio | Motivo |
|---|---------|----------------|--------|
| 1 | `src/schemas/intermediate.ts` | **NUEVO** | Definir estructura de datos intermedia (morfemas separados sin traducciones) |
| 2 | `src/providers/llm.providers.ts` | MODIFICAR | Agregar nuevos métodos al contrato del provider |
| 3 | `src/providers/openai.providers.ts` | MODIFICAR | Implementar nuevos métodos |
| 4 | `src/providers/prompts.ts` | MODIFICAR | Nuevos prompts que reciben morfemas separados |
| 5 | `src/pipeline/translate.ts` | Reescribir | Nuevo pipeline en fases |
| 6 | `notes/generateDocs.ts` | Reescribir | Adaptar al nuevo flujo |

### 4.2 Detalle por Archivo

---

#### 4.2.1 `src/schemas/intermediate.ts` (NUEVO)

**Propósito**: Definir la estructura de datos intermedia que contiene los morfemas separados del texto fuente, sin las traducciones.

**Contenido**:

```typescript
// Para chino: morfemas con pinyin
interface MorphemeDataChinese {
  type: 'chinese';
  sentences: {
    separateWords: string[];  // hanzis
    pinyin: string[];        // pinyin correspondiente
  }[];
}

// Para idiomas alfabéticos: morfemas sin pinyin
interface MorphemeDataAlphabetic {
  type: 'alphabetic';
  sentences: {
    separateWords: string[];  // palabras
  }[];
}

// Exportar tipo unión
type MorphemeData = MorphemeDataChinese | MorphemeDataAlphabetic;
```

**Ubicación**: Crear en `src/schemas/intermediate.ts`

---

#### 4.2.2 `src/providers/llm.providers.ts`

**Propósito**: Actualizar el contrato (interfaz) del provider para incluir los nuevos métodos.

**Cambios a realizar**:

1. Agregar método `separateMorphemes(text: string, sourceLang: string): Promise<MorphemeData>`
   - Separa el texto en morfemas (1 llamada API)
   - Devuelve estructura intermedia

2. Agregar método `glossFromMorphemes(morphemeData: MorphemeData, targetLang: string): Promise<GlossedSentence | GlossedChineseSentence>`
   - Toma los morfemas separados + idioma destino
   - Genera glossedWords (traducción de cada morfema)

3. Actualizar tipos importados para usar el nuevo schema intermedio

**Código actual**:
```typescript
export interface LLMProvider {
    detectLanguage(text: string): Promise<string>;
    translateText(text: string, l1: string, l2: string): Promise<string>;
    glossText(text: string, l1: string, l2: string): Promise<GlossedSentence>;
    glossChineseText(text: string, l1: string): Promise<GlossedChineseSentence>;
    getGrammarPoints(text: string, l1: string, l2: string): Promise<GrammarArray>;
}
```

**Código nuevo** (agregar métodos):
```typescript
import type { MorphemeData } from '../schemas/intermediate';

export interface LLMProvider {
    // Métodos existentes (mantienen su función para backward compatibility)
    detectLanguage(text: string): Promise<string>;
    translateText(text: string, l1: string, l2: string): Promise<string>;
    glossText(text: string, l1: string, l2: string): Promise<GlossedSentence>;
    glossChineseText(text: string, l1: string): Promise<GlossedChineseSentence>;
    getGrammarPoints(text: string, l1: string, l2: string): Promise<GrammarArray>;
    
    // NUEVOS MÉTODOS
    separateMorphemes(text: string, sourceLang: string): Promise<MorphemeData>;
    glossFromMorphemes(morphemeData: MorphemeData, targetLang: string): Promise<GlossedSentence | GlossedChineseSentence>;
}
```

---

#### 4.2.3 `src/providers/openai.providers.ts`

**Propósito**: Implementar los nuevos métodos definidos en la interfaz.

**Cambios a realizar**:

1. Implementar `separateMorphemes(text: string, sourceLang: string)`:
   - Si sourceLang === 'zh': usar lógica actual de separación china
   - Si sourceLang !== 'zh': usar lógica actual de separación alfabética
   - Devolver estructura intermedia (SIN glossedWords)

2. Implementar `glossFromMorphemes(morphemeData: MorphemeData, targetLang: string)`:
   - Input: morfemas separados (del paso 1)
   - Output: glossedWords para el idioma destino
   - IMPORTANTE: No recalcula la separación, usa la existente

3. Mantener métodos existentes para backward compatibility

---

#### 4.2.4 `src/providers/prompts.ts`

**Propósito**: Crear nuevos prompts que reciban los morfemas separados como entrada.

**Cambios a realizar**:

1. **Nuevo prompt**: `interlinearFromMorphemesPrompt(morphemeData, targetLang)`
   
   Para chino:
   ```
   Given the following Mandarin Chinese morphemes with their pinyin:
   - Morphemes: [这, 封信, 来自, ...]
   - Pinyin: [zhè, fēng xìn, láizì, ...]
   
   Provide the English gloss (translation) for each morpheme:
   - Output as: { morphemes: [...], glossedWords: [...] }
   ```

   Para alfabético:
   ```
   Given the following morphemes in Spanish:
   - Morphemes: [Los, autos, rojos]
   
   Provide the English gloss (translation) for each morpheme:
   - Output as: { morphemes: [...], glossedWords: [...] }
   ```

2. **Modificar prompt existente**: `interlinearChinesePrompt` y `interlinearAlphabeticPrompt`
   - Estos se seguirán usando para backwards compatibility
   - El nuevo flujo usará los prompts modificados

---

#### 4.2.5 `src/pipeline/translate.ts`

**Propósito**: Reescribir el pipeline para seguir el nuevo flujo en fases.

**Cambios a realizar**:

1. Crear función principal `runUnifiedTranslationPipeline(input: TextToTranslateRequest, targetLanguages: string[])`:
   - Recibe: texto, idioma fuente, ARRAY de idiomas destino
   - Devuelve: Map<idioma, InterlinearDoc>

2. Implementar fases internas:

   ```typescript
   async function runUnifiedTranslationPipeline(
     text: string,
     sourceLang: string,
     targetLanguages: string[]
   ): Promise<Map<string, InterlinearDoc>> {
     
     // FASE 1: Separar morfemas (UNA VEZ)
     const morphemeData = await separateMorphemes(text, sourceLang);
     
     // FASE 2: Para cada idioma destino
     const results = new Map();
     for (const targetLang of targetLanguages) {
       // Ignorar si targetLang === sourceLang
       if (targetLang === sourceLang) continue;
       
       // 2.1 Gloss desde morfemas
       const glossed = await glossFromMorphemes(morphemeData, targetLang);
       
       // 2.2 Traducción natural
       const translated = await translateText(text, sourceLang, targetLang);
       
       // 2.3 Grammar points
       const grammar = await getGrammarPoints(text, sourceLang, targetLang);
       
       // FASE 3: Combinar y crear documento
       results.set(targetLang, createInterlinearDoc(...));
     }
     
     return results;
   }
   ```

3. Mantener función `runTranslationPipeline` existente para backward compatibility

---

#### 4.2.6 `notes/generateDocs.ts`

**Propósito**: Adaptar el script de generación de documentación al nuevo flujo.

**Cambios a realizar**:

1. Modificar para usar el nuevo pipeline unificado:
   ```typescript
   async function generateDocsForBook(
     filePath: string,
     bookName: string,
     chapter: number,
     sourceLang: string,
     targetLanguages: string[]
   ) {
     // 1. Leer texto fuente
     const rawContent = fs.readFileSync(filePath, 'utf-8');
     const verses = parseVerses(rawContent);
     
     // 2. Procesar en chunks
     for (let i = 0; i < verses.length; i += CONFIG.chunkSize) {
       const chunk = verses.slice(i, i + CONFIG.chunkSize);
       const combinedText = chunk.map(v => `${v.number} ${v.text}`).join(" ");
       
       // 3. LLAMAR AL NUEVO PIPELINE (una vez, genera todos los idiomas)
       const docsByLanguage = await runUnifiedTranslationPipeline(
         combinedText,
         sourceLang,
         targetLanguages
       );
       
       // 4. Guardar un JSON por idioma
       for (const [lang, doc] of docsByLanguage) {
         const fileName = `bible.${sourceLang}.${lang}_${bookName}...json`;
         fs.writeFileSync(fileName, JSON.stringify(doc, null, 2));
       }
     }
   }
   ```

2. Actualizar CONFIG para incluir lista de idiomas destino:
   ```typescript
   const CONFIG = {
     version: "WEB",
     chunkSize: 5,
     sourceLang: "zh",
     targetLanguages: ["en", "es", "pt", "vi"]  // NUEVO
   };
   ```

---

## 5. Estructura de Datos

### 5.1 Schema Intermedio (MorphemeData)

```typescript
// Tipo discrimin unions para distinguir chino de alfabético
type MorphemeData = 
  | { type: 'chinese'; sentences: MorphemeSentenceChinese[] }
  | { type: 'alphabetic'; sentences: MorphemeSentenceAlphabetic[] };

interface MorphemeSentenceChinese {
  separateWords: string[];  // hanzi
  pinyin: string[];
}

interface MorphemeSentenceAlphabetic {
  separateWords: string[];  // palabras
}
```

### 5.2 Schema Final (SIN CAMBIOS)

Los JSONs de salida mantienen la estructura actual:

```typescript
interface InterlinearDoc {
  id: string;
  source: {
    collection: string;
    version: string;
    lang: string;
    ref: { book: string; chapter: number; verseStart: number; verseEnd: number };
  };
  motherTongue: { lang: string };
  text: string;
  translatedText: string[];
  glossedText: GlossedSentence[] | GlossedChineseSentence[];
  grammarPoints: GrammarArray;
  generatedAt: string;
  model: string;
}
```

## 6. Casos de Uso Soportados

### 6.1 Chino como fuente, múltiples destinos
- Input: texto chino
- sourceLang: "zh"
- targetLanguages: ["en", "es", "pt", "vi"]
- Output: 4 JSONs

### 6.2 Español como fuente, múltiples destinos
- Input: texto español
- sourceLang: "es"
- targetLanguages: ["en", "zh", "pt", "vi"]
- Output: 4 JSONs

### 6.3 Inglés como fuente, múltiples destinos
- Input: texto inglés
- sourceLang: "en"
- targetLanguages: ["es", "zh", "pt", "vi"]
- Output: 4 JSONs

### 6.4 No procesar idioma fuente == idioma destino
- Si sourceLang está en targetLanguages, se omite
- Evita generar traducciones identidad (es→es, zh→zh)

## 7. Consideraciones de Implementación

### 7.1 Cacheo (Opcional/Futuro)
- Los morfemas separados podrían cachearse por hash(text + sourceLang)
- Esto permitiría continuar procesos incompletos
- Queda fuera del alcance inicial

### 7.2 Paralelismo
- Las llamadas para cada idioma destino pueden paralelizarse
- Usar `Promise.all()` para ejecutar en paralelo
- Opcional: limitación de rate limiting

### 7.3 Manejo de Errores
- Si falla la separación de morfemas (Fase 1): abortar todo
- Si falla un destino específico (Fase 2): continuar con los demás
- Logging claro para identificar qué destino falló

### 7.4 Backward Compatibility
- Mantener `runTranslationPipeline` existente
- Solo el nuevo script `generateDocs` usará el pipeline optimizado
- La API REST puede seguir usando el método actual

## 8. Orden de Implementación Sugerido

1. **Crear** `src/schemas/intermediate.ts`
2. **Actualizar** `src/providers/llm.providers.ts` (interfaz)
3. **Actualizar** `src/providers/openai.providers.ts` (implementación)
4. **Actualizar** `src/providers/prompts.ts` (nuevos prompts)
5. **Reescribir** `src/pipeline/translate.ts`
6. **Reescribir** `notes/generateDocs.ts`
7. **Probar** con un caso simple (zh → en)
8. **Escalar** a múltiples idiomas

## 9. Métricas de Éxito

| Métrica | Antes | Después |
|---------|-------|---------|
| Llamadas API (zh→4 idiomas) | ~12 | ~13 |
| Llamadas API (es→4 idiomas) | ~12 | ~13 |
| Tiempo de procesamiento | Mayor | Menor |
| Costo API | Mayor | Menor |

El objetivo principal es eliminar la redundancia en la separación de morfemas, no necesariamente reducir el número total de llamadas (que se mantiene similar), sino evitar trabajo innecesario重复.

---

*Documento generado como parte del plan de refactorización del proyecto IdiomasApp*
