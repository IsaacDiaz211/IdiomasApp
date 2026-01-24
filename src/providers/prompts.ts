export const interlinearAlphabeticPrompt = (l1: string, l2: string, text: string) => `
/*Analyze the following text, the book of Philemon in the Bible,in ${l2} and break it down morpheme by morpheme for an interlinear gloss in ${l1}.

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
Analyze the following Mandarin Chinese text, the book of Philemon in the Bible, and break it down morpheme by morpheme for an interlinear gloss in ${l1}.

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

export const naturalTranslationPrompt = (l1: string, l2: string, text: string, num_sentences: number) => `
Translate the following text, the book of Philemon in the Bible, from ${l2} to ${l1} in a natural and fluent manner. Ensure that the translation 
captures the meaning and context of the original text while adhering to the grammatical and syntactical norms of 
${l1}. Avoid literal translations that may sound awkward or unnatural in ${l1}. Do not include any additional 
comments or explanations, only provide the translated text. Maintain the order and mount of the sentences of the 
original text, the amount of sentences in the original must be equeal to the tranlated text result.In this case, 
the text has ${num_sentences} sentences. The output MUST be a valid JSON object. The JSON must have exactly one key:
"sentences" (array of strings), each element of the array is a translated sentence. And the length of the array must be 
equal to ${num_sentences}. 
- Ignore the verse numbers; do not include them in the answer.
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
Return ONLY valid json in the response, as a single object with a "points" array (max 2 items), like this:
{"points":[{"grammar_point":"","sentence":"","explanation":""}]}
Do not include any additional information, and the field "explanation" don't surpass 150 words.
The text is:\n${text}.`;
