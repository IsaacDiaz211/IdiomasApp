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

export const interlinearChinesePrompt = "";