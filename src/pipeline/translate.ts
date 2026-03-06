import { randomUUIDv7 } from "bun";
import OpenAI from "openai";
import { createAudioFileFromText } from "../providers/audio.provider";
import { OpenAIProvider } from "../providers/openai.providers";
import { minimaxLanguageBoostByLang, supportedVoices } from "../schemas/voices";
import type { GlossedChineseSentence } from "../schemas/chineseResponse";
import type { GrammarArray } from "../schemas/grammar";
import type { TextToTranslateRequest } from "../schemas/request";
import type { GlossedSentence, SourceAudio, TextResponse } from "../schemas/response";

export interface UnifiedTranslationInput {
    text: string;
    sourceLang: string;
    targetLanguages: string[];
    sourceAudioText?: string;
}

export interface UnifiedTranslationOptions {
    detectSourceLanguage?: boolean;
    includeGrammar?: boolean;
    continueOnTargetError?: boolean;
    generateSourceAudio?: boolean;
    audioOutputDir?: string;
    audioBaseName?: string;
}

export interface UnifiedTranslationResult {
    translatedText: string[];
    glossedText: GlossedSentence[] | GlossedChineseSentence[];
    grammarPoints?: GrammarArray;
    sourceAudio?: SourceAudio;
}

function normalizeLanguageCode(lang: string): string {
    return lang.trim().toLowerCase();
}

function getSentences(text: string, lang: string): string[] {
    const segmenter = new Intl.Segmenter(lang, { granularity: "sentence" });
    const segments = segmenter.segment(text);
    const sentences = Array.from(segments)
        .map((segment) => segment.segment.trim())
        .filter((segment) => segment.length > 0);

    if (sentences.length > 0) {
        return sentences;
    }

    const fallback = text.trim();
    return fallback ? [fallback] : [];
}

function createOpenAIProvider(_sourceLang: string, _targetLangs: string[]): OpenAIProvider {
    const openai = new OpenAI({
        apiKey: process.env.AI_KEY,
        baseURL: process.env.AI_BASE_URL
    });

    return new OpenAIProvider(openai, process.env.AI_MODEL);
}

async function generateSourceAudio(args: {
    sourceLang: string;
    text: string;
    strict: boolean;
    outputDir?: string;
    baseName?: string;
}): Promise<SourceAudio | undefined> {
    const cleanText = args.text.trim();
    if (!cleanText) {
        if (args.strict) {
            throw new Error("Audio generation requires non-empty source text.");
        }
        return undefined;
    }

    if (!process.env.MINIMAX_API_KEY) {
        if (args.strict) {
            throw new Error("MINIMAX_API_KEY is not configured.");
        }
        return undefined;
    }

    const voiceId = supportedVoices[args.sourceLang];
    if (!voiceId) {
        if (args.strict) {
            throw new Error(`No voiceId configured for source language: ${args.sourceLang}`);
        }
        return undefined;
    }

    try {
        const languageBoost = minimaxLanguageBoostByLang[args.sourceLang] || "auto";
        const audio = await createAudioFileFromText(cleanText, voiceId, {
            outputDir: args.outputDir,
            baseName: args.baseName,
            languageBoost
        });

        return {
            mp3File: audio.mp3File,
            timestampsFile: audio.timestampsFile,
            voiceId,
            sourceLang: args.sourceLang,
            timestampsFormat: audio.timestampsFormat,
            timestamps: audio.timestamps
        };
    } catch (error) {
        if (args.strict) {
            throw error;
        }

        console.error("Audio generation failed:", error);
        return undefined;
    }
}

async function runTranslationPipeline(
    input: TextToTranslateRequest,
    detecting: boolean,
    grammar?: boolean
): Promise<TextResponse> {
    try {
        const sourceLang = normalizeLanguageCode(input.l2);
        const targetLang = normalizeLanguageCode(input.l1);
        const provider = createOpenAIProvider(sourceLang, [targetLang]);
        const sentences = getSentences(input.text, sourceLang);

        if (sentences.length === 0) {
            throw new Error("From runTranslationPipeline: No sentences found in input text.");
        }

        if (detecting) {
            const languageDetected = await provider.detectLanguage(sentences[0]);
            console.log("Detected language:", languageDetected);
            if (languageDetected.toLowerCase() !== sourceLang) {
                throw new Error("From verifyL2: Input text does not match the specified target language (l2).");
            }
        }

        const [translatedText, glossedText, sourceAudio] = await Promise.all([
            Promise.all(
                sentences.map((sentence) => provider.translateText(sentence, targetLang, sourceLang))
            ),
            sourceLang === "zh"
                ? Promise.all(sentences.map((sentence) => provider.glossChineseText(sentence, targetLang)))
                : Promise.all(sentences.map((sentence) => provider.glossText(sentence, targetLang, sourceLang))),
            generateSourceAudio({
                sourceLang,
                text: input.text,
                strict: false
            })
        ]);

        const response: TextResponse = {
            request_id: randomUUIDv7(),
            translatedText,
            glossedText
        };

        if (grammar) {
            response.grammarPoints = await provider.getGrammarPoints(input.text, targetLang, sourceLang);
        }

        if (sourceAudio) {
            response.sourceAudio = sourceAudio;
        }

        return response;
    } catch (error) {
        console.error("Error detallado:", JSON.stringify(error, null, 2));
        throw error;
    }
}

async function runUnifiedTranslationPipeline(
    input: UnifiedTranslationInput,
    options: UnifiedTranslationOptions = {}
): Promise<Map<string, UnifiedTranslationResult>> {
    const sourceLang = normalizeLanguageCode(input.sourceLang);
    const targetLanguages = Array.from(
        new Set(
            input.targetLanguages
                .map(normalizeLanguageCode)
                .filter((lang) => lang.length > 0 && lang !== sourceLang)
        )
    );

    if (targetLanguages.length === 0) {
        return new Map();
    }

    const provider = createOpenAIProvider(sourceLang, targetLanguages);
    const sentences = getSentences(input.text, sourceLang);

    if (sentences.length === 0) {
        throw new Error("From runUnifiedTranslationPipeline: No sentences found in input text.");
    }

    if (options.detectSourceLanguage) {
        const languageDetected = await provider.detectLanguage(sentences[0]);
        console.log("Detected language:", languageDetected);
        if (languageDetected.toLowerCase() !== sourceLang) {
            throw new Error("From verifySourceLang: Input text does not match sourceLang.");
        }
    }

    if (!provider.separateMorphemes || !provider.glossFromMorphemes) {
        throw new Error("From runUnifiedTranslationPipeline: Provider does not support morpheme pipeline.");
    }

    const morphemeData = await provider.separateMorphemes(input.text, sourceLang);
    const includeGrammar = Boolean(options.includeGrammar);
    const continueOnTargetError = options.continueOnTargetError !== false;

    const sourceAudio = options.generateSourceAudio
        ? await generateSourceAudio({
            sourceLang,
            text: input.sourceAudioText?.trim() || input.text,
            strict: true,
            outputDir: options.audioOutputDir,
            baseName: options.audioBaseName
        })
        : undefined;

    const resultEntries = await Promise.all(
        targetLanguages.map(async (targetLang) => {
            try {
                const [translatedText, glossedText, grammarPoints] = await Promise.all([
                    Promise.all(
                        sentences.map((sentence) => provider.translateText(sentence, targetLang, sourceLang))
                    ),
                    provider.glossFromMorphemes!(morphemeData, targetLang),
                    includeGrammar
                        ? provider.getGrammarPoints(input.text, targetLang, sourceLang)
                        : Promise.resolve(undefined)
                ]);

                const result: UnifiedTranslationResult = {
                    translatedText,
                    glossedText
                };

                if (grammarPoints) {
                    result.grammarPoints = grammarPoints;
                }

                if (sourceAudio) {
                    result.sourceAudio = sourceAudio;
                }

                return [targetLang, result] as const;
            } catch (error) {
                if (!continueOnTargetError) {
                    throw error;
                }
                console.error(`Target language failed (${targetLang}):`, error);
                return null;
            }
        })
    );

    const results = new Map<string, UnifiedTranslationResult>();
    for (const entry of resultEntries) {
        if (entry) {
            results.set(entry[0], entry[1]);
        }
    }

    return results;
}

export { runTranslationPipeline, runUnifiedTranslationPipeline };
