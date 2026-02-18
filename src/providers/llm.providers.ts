// Definition of contract for LLM providers
import type { GlossedSentence } from '../schemas/response';
import type { GlossedChineseSentence } from '../schemas/chineseResponse';
import type { GrammarArray } from "../schemas/grammar";
import type { MorphemeData } from '../schemas/intermediate';

export interface LLMProvider {
    detectLanguage(text: string): Promise<string>;
    translateText(text: string, l1: string, l2: string): Promise<string>;
    glossText(text: string, l1: string, l2: string): Promise<GlossedSentence>;
    glossChineseText(text: string, l1: string): Promise<GlossedChineseSentence>;
    getGrammarPoints(text: string, l1: string, l2: string): Promise<GrammarArray>;
    separateMorphemes?(text: string, sourceLang: string): Promise<MorphemeData>;
    glossFromMorphemes?(
        morphemeData: MorphemeData,
        targetLang: string
    ): Promise<GlossedSentence[] | GlossedChineseSentence[]>;
}
