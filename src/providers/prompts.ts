export const interlinearAlphabeticPrompt = (l1: string, l2: string, text: string) => `
Provide a translation in "Interlinear gloss" format of the following text, morpheme by morpheme, 
from ${l2} to ${l1}. The output MUST be a valid JSON object. The JSON must have exactly two keys:
"originalText" (array of strings) and "glossedWords" (array of strings). Both arrays MUST have 
exactly the same length. Please do not provide additional comments or explanatory notes, only the
translation with the schema provided. Preserve morphemic granularity as closely as possible, making
any necessary adjustments. Do not clarify the languages; start with the language ${l2} and continue
with ${l1}. Again both json keys (originalText, glossedWords) have to contain the same number of 
morphemes. Do not add punctuation marks (like '.' or ',', etc.) or markdown formatting.
**Example: l1: Spanish, l2: English**
Input: "This can cause downstream parsing to fail. Use structured output to ensure that the LLM returns a standard JSON string." (English to Spanish)
Output: { "originalText": ["this", "can", "cause", "downstream", "parsing", "to", "fail"], "glossedWords": ["esto", "puede", "causar", "posterior", "análisis", "para", "fallar"] }
Both have the same length of 7 morphemes and the order of the language l2 is respected.
**Additional Notes:**
-'l1' is the mother tongue, 'l2' is the foreign/target language.
The text is:\n${text}.`;

export const interlinearChinesePrompt = (l1: string, text: string) => `
Provide a translation in "Interlinear gloss" format of the following text, morpheme by morpheme, 
from Mandarin Chinese to ${l1}. The output MUST be a valid JSON object. The JSON must have exactly three keys:
"separateWords" (array of strings) which must contains the separated words of the text in Hanzi, "pinyin" 
(array of strings) which must contains the pinyin of the separated words, and "glossedWords" (array of strings)
which must contains the glossed words of the text in ${l1}. All arrays MUST have exactly the same length, for 
each morpheme their respective pinyin and glossed word. Please do not provide additional comments or explanatory 
notes, only the translation with the schema provided. Preserve morphemic granularity as closely as possible, making
any necessary adjustments. Do not clarify the languages; start with Mandarin Chinese and continue
with ${l1}. Again all json keys (separateWords, pinyin, glossedWords) have to contain the same number of 
morphemes. Do not add punctuation marks (like '.' or ',', '。', etc.) or markdown formatting.
**Example: l1: Spanish, l2: Mandarin Chinese**
Input: "12月29日，央视新闻发布一段视频画面，内容疑似为无人机从高空俯瞰台北地标建筑台北101大厦。" (Mandarin Chinese to Spanish)
Output: { 
{ "separateWords":[ "12", "月", "29", "日", "央视", "新闻", "发布", "一", "段", "视频", "画面", "内容", "疑似", "为", "无人机", "从", "高空", "俯瞰", "台北", "地标", "建筑", "台北", "101", "大厦" ], 
  "pinyin":[ "shí'èr", "yuè", "èrshíjiǔ", "rì", "Yāngshì", "xīnwén", "fābù", "yí", "duàn", "shìpín", "huàmiàn", "nèiróng", "yísì", "wéi", "wúrénjī", "cóng", "gāokōng", "fǔkàn", "Táiběi", "dìbiāo", "jiànzhù", "Táiběi", "yīlíngyī", "dàshà" ],
  "glossedWords":[ "12", "mes", "29", "día", "CCTV", "noticias", "publicar", "un", "tramo", "video", "imagen", "contenido", "parecer_ser", "ser", "dron", "desde", "gran_altura", "mirar_abajo", "Taipéi", "hito", "edificio", "Taipéi", "101", "rascacielos" ] }
}
The three have the same length of morphemes and the order of the language Mandarin Chinese is respected.
**Additional Notes:**
-'l1' is the mother tongue, 'l2' is the foreign/target language.
The text is:\n${text}.`;