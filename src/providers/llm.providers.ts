// Definition of contract for LLM providers
import { GlossedSentence } from '../schemas/response';
import { GlossedChineseSentence } from '../schemas/chineseResponse';
import { GrammarArray } from "../schemas/grammar";

export interface LLMProvider {
    detectLanguage(text: string): Promise<string>;
    translateText(text: string, l1: string, l2: string): Promise<string>;
    glossText(text: string, l1: string, l2: string): Promise<GlossedSentence>;
    glossChineseText(text: string, l1: string): Promise<GlossedChineseSentence>;
    getGrammarPoints(text: string, l1: string, l2: string): Promise<GrammarArray>;
}