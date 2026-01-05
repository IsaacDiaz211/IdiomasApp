export const interlinearAlphabeticPrompt = (l1: string, l2: string, text: string) => `
Provide a translation in "Interlinear gloss" format of the following text, morpheme by morpheme, 
from ${l2} to ${l1}. The output MUST be a valid JSON object. The JSON must have exactly two keys:
"originalText" (array of strings) and "glossedWords" (array of strings). Both arrays MUST have 
exactly the same number of units. Please do not provide additional comments or explanatory notes, only the
translation with the schema provided. Preserve morphemic granularity as closely as possible, making
any necessary adjustments. Do not clarify the languages; start with the language ${l2} and continue
with ${l1}. Again both json keys (originalText, glossedWords) have to contain the same number of 
morphemes. Do not add punctuation marks (like '.' or ',', etc.) or markdown formatting.
**Example: langoutput: Spanish, langinput: English**
Input: "This can cause downstream parsing to fail." (English to Spanish)
Output: { "originalText": ["this", "can", "cause", "downstream", "parsing", "to", "fail"], "glossedWords": ["esto", "puede", "causar", "posterior", "análisis", "para", "fallar"] }
Both have the same length of 7 morphemes and the order of the language langinput is respected.
**Example2: langoutput: Spanish, langinput: English**
Input: "The ironic thing is that the Chinese, in general, don't have a sweet tooth. Most Western desserts are too sweet for Chinese palates.".
Output: { "originalText": ["the", "ironic", "thing", "is", "that", "the", "Chinese", "in", "general", "don't", "have", "a", "sweet", "tooth", "most", "Western", "desserts", "are",  "too", "sweet", "for", "Chinese", "palates"],
"glossedWords": ["lo", "irónico", "cosa", "es", "que", "los", "chinos", "en", "general", "no", "tienen", "un", "dulce", "diente", "la mayoría", "occidentales", "postres", "son", "muy/demasiado", "dulces", "para", "chinos", "paladares"] }
Both have the same length of 23 morphemes and the order of the language langinput is respected.
The text is:\n${text}.`;

export const interlinearChinesePrompt = (l1: string, text: string) => `
Provide a translation in "Interlinear gloss" format of the following text, morpheme by morpheme, 
from Mandarin Chinese to ${l1}. The output MUST be a valid JSON object. The JSON must have exactly three keys:
"separateWords" (array of strings) which must contains the separated words (morphemes) of the text in Hanzi, "pinyin" 
(array of strings) which must contains the pinyin of the separated words, and "glossedWords" (array of strings)
which must contains the glossed words of the text in ${l1}. All keys ("separateWords", "pinyin", "glossedWords") MUST have exactly the same number of units, for 
each morpheme their respective pinyin and glossed word. Please do not provide additional comments or explanatory 
notes, only the translation with the schema provided. Preserve morphemic granularity as closely as possible, making
any necessary adjustments. Do not clarify the languages. Again all json keys (separateWords, pinyin, glossedWords) have to contain the same number of 
morphemes. Do not add punctuation marks (like '.' or ',', '。', etc.) or markdown formatting.
**Example 1: lang_output: Spanish, lang_input: Mandarin Chinese**
Input: "12月29日，央视新闻发布一段视频画面，内容疑似为无人机从高空俯瞰台北地标建筑台北101大厦。" (Mandarin Chinese to Spanish)
Output:
{
  "separateWords": ["12月", "29日", "央视", "新闻", "发布", "一", "段", "视频", "画面", "内容", "疑似", "为", "无人机", "从", "高空", "俯瞰", "台北", "地标","建筑",
    "台北101", "大厦"],
  "pinyin": ["shíèryuè", "èrshíjiǔrì", "yāngshì", "xīnwén", "fābù", "yí", "duàn", "shìpín", "huàmiàn", "nèiróng", "yísì", "wéi", "wúrénjī",
    "cóng","gāokōng", "fǔkàn", "táiběi", "dìbiāo", "jiànzhù", "táiběiyīlíngyī", "dàshà"],
  "glossedWords": ["diciembre", "día 29", "CCTV", "noticias", "publicar", "un", "fragmento", "video", "imagen", "contenido", "presuntamente", "ser", 
  "dron", "desde", "gran altura", "observar desde arriba", "Taipéi", "hito", "edificio", "Taipéi 101", "torre"]
}
The three have the same number of morphemes, 21, and the order of the language Mandarin Chinese is respected.
**Example 2: lang_output: Spanish, lang_input: Mandarin Chinese**
Input: "圣灵立刻把耶稣催促到旷野里去。"
Good Output:
{
  "separateWords": ["圣灵", "立刻", "把", "耶稣", "催促", "到", "旷野", "里", "去"],
  "pinyin": ["shènglíng", "lìkè", "bǎ", "yēsū", "cuīcù", "dào", "kuàngyě", "lǐ", "qù"],
  "glossedWords": [ "Espíritu Santo", "inmediatamente", "agarrar", "Jesús", "impulsó", "a", "desierto", "adentro", "ir"]
}
The three have the same number of morphemes, 9, and the order of the language Mandarin Chinese is respected.
Bad Output:
{
  "separateWords": ["圣灵", "立刻", "把", "耶稣", "催促", "到", "旷野", "去"],
  "pinyin": ["shènglíng", "lìkè", "bǎ", "yēsū", "cuīcù", "dào", "kuàngyě", "qù"],
  "glossedWords": [ "Espíritu Santo", "inmediatamente", "empujar",  "a", "Jesús", "hasta", "desierto", "ir"]
}
This output is incorrectly, although the three keys have the same number of units this have several errors. Does not respect 
the original text by eliminating the character '里' in key "separateWords". Does not match the morphemes, the fourth item in
"separateWords" is "耶稣" but the fourth item in "glossedWords" is "a". The morphemes must to match in position within the keys.
****
The text is:\n${text}.`;

export const naturalTranslationPrompt = (l1: string, l2: string, text: string, num_sentences: number) => `
Translate the following text from ${l2} to ${l1} in a natural and fluent manner. Ensure that the translation 
captures the meaning and context of the original text while adhering to the grammatical and syntactical norms of 
${l1}. Avoid literal translations that may sound awkward or unnatural in ${l1}. Do not include any additional 
comments or explanations, only provide the translated text. Maintain the order and mount of the sentences of the 
original text, the amount of sentences in the original must be equeal to the tranlated text result.In this case, 
the text has ${num_sentences} sentences. The output MUST be a valid JSON object. The JSON must have exactly one key:
"sentences" (array of strings), each element of the array is a translated sentence. And the length of the array must be 
equal to ${num_sentences}.
**Example: langoutput: Spanish, langinput: English**
Input: "This is a sample text. It contains multiple sentences for translation." (English to Spanish)
Output: { "sentences": ["Este es un texto de ejemplo.", "Contiene múltiples oraciones para la traducción."] }
The text to translate is:\n${text}.`;

export const detectLanguagePrompt = (text: string) => `
Detect the language of the following text and respond with the language name in ISO 639-1 format (two-letter code), 
for example: 'en' for English, 'es' for Spanish, 'fr' for French, etc. The text:\n${text}`;

export const grammarPointPrompt = (l1: string, l2: string, text: string) => `
Identify and explain any notable grammar points, structures, or patterns present in the following text written in 
${l2}. Provide explanations in ${l1}, ensuring clarity and comprehensibility. The explanation should include the 
name of the grammar point, the sentence original, and an explanatory in ${l1}.
Return ONLY valid json in the response, as a single object with a "points" array (max 3 items), like this:
{"points":[{"grammar_point":"","sentence":"","explanation":""}]}
Do not include any additional information, and the field "explanation" don't surpass 150 words.
The text is:\n${text}.`;
