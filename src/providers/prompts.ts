export const interlinearAlphabeticPrompt = (l1: string, l2: string, text: string) => `
/*Analyze the following text,in ${l2} and break it down morpheme by morpheme for an interlinear gloss in ${l1}.

The output must be a valid JSON object containing a "segments" array. 
Each item in the array must represent ONE morpheme and include exactly:
1. "originalText": The separate word/morpheme.
2. "glossedWords": The meaning of that morpheme in ${l1}.

**Rules:**
- Preserve morphemic granularity as closely as possible, making any necessary adjustments.
- Do not add punctuation marks as separate segments (like '.' or ',', '。', etc.) or markdown formatting.
- Ensure the "gloss" is contextually accurate.
- Ignore the verse numbers; do not include them in the answer.

**Text to analyze:**\n
${text}
`;

export const interlinearChinesePrompt = (l1: string, text: string) => `
Analyze the following Mandarin Chinese text, and break it down morpheme by morpheme for an interlinear gloss in ${l1}.

The output must be a valid JSON object containing a "segments" array. 
Each item in the array must represent ONE morpheme and include exactly:
1. "hanzi": The separate word/morpheme.
2. "pinyin": The pinyin for that morpheme.
3. "gloss": The meaning of that morpheme in ${l1}.

**Rules:**
- Preserve morphemic granularity as closely as possible, making any necessary adjustments.
- Do not add punctuation marks as separate segments (like '.' or ',', '。', etc.) or markdown formatting.
- Ensure the "gloss" is contextually accurate.
- Ignore the verse numbers; do not include them in the answer.

**Text to analyze:**\n
${text}
`;

export const naturalTranslationPrompt = (l1: string, l2: string, text: string) => `
Translate the following text, from ${l2} to ${l1} in a natural and fluent manner. Ensure that the translation 
captures the meaning and context of the original text while adhering to the grammatical and syntactical norms of 
${l1}. Avoid literal translations that may sound awkward or unnatural in ${l1}. Do not include any additional 
comments or explanations, only provide the translated text.  
- Ignore the verse numbers; do not include them in the answer.
The text to translate is:\n${text}.`;

export const detectLanguagePrompt = (text: string) => `
Detect the language of the following text and respond with the language name in ISO 639-1 format (two-letter code), 
for example: 'en' for English, 'es' for Spanish, 'fr' for French, etc. The text:\n${text}`;

export const grammarPointPrompt = (l1: string, l2: string, text: string) => `
Identify and explain any notable grammar points, structures, or patterns present in the following text written in 
${l2}. Provide explanations in ${l1}, ensuring clarity and comprehensibility. The explanation should include the 
name of the grammar point, the sentence original, and an explanatory in ${l1}.
Return ONLY valid json in the response, as a single object with a "points" array (max 2 items), like this:
{"points":[{"grammar_point":"","sentence":"","explanation":""}]}
Do not include any additional information, and the field "explanation" don't surpass 150 words.
The text is:\n${text}.`;

export const interlinearAlphabeticPromptMistral = (l1: string, l2: string, text: string) => `
Provide an interlinear gloss from ${l2} to ${l1}.
Return ONLY valid JSON with exactly one key "morphemes".
"morphemes" must be an array of objects, each with exactly two keys: "morpheme" and "gloss".
The order must follow the original text in ${l2}. Do not include punctuation as separate morphemes.
Do not include markdown, code fences, or any extra text outside the JSON object.
Example:
Input: "Hello world"
Output: {"morphemes":[{"morpheme":"hello","gloss":"hola"},{"morpheme":"world","gloss":"mundo"}]}
Text:
${text}
`;

export const interlinearChinesePromptMistral = (l1: string, text: string) => `
Provide an interlinear gloss from Mandarin Chinese to ${l1}.
Return ONLY valid JSON with exactly one key "morphemes".
"morphemes" must be an array of objects, each with exactly three keys: "hanzi", "pinyin", and "gloss".
The order must follow the original text in Chinese. Do not include punctuation as separate morphemes.
Do not include markdown, code fences, or any extra text outside the JSON object.
Example:
Input: "你好世界"
Output: {"morphemes":[{"hanzi":"你好","pinyin":"ni hao","gloss":"hello"},{"hanzi":"世界","pinyin":"shi jie","gloss":"world"}]}
Text:
${text}
`;
