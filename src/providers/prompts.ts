export const interlinearAlphabeticPrompt = (l1: string, l2: string, text: string) => `Provide a translation in "Interlinear gloss" format of the following text, 
                        morpheme by morpheme, from ${l2} to ${l1}. Please do not provide additional 
                        comments or explanatory notes, only the translation. Preserve morphemic granularity 
                        as closely as possible, making any necessary adjustments. Do not clarify the languages; 
                        start with the language ${l2} separate each morpheme with "/" and separete the languages with a the symbol "#", continue with ${l1},
                        separate again each morpheme with the symbol "/", both languages have to contain the same 
                        number of morphemes; the text is:\n${text}.`;

export const interlinearChinesePrompt = "";