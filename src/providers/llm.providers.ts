// Definition of contrate for LLM providers
import OpenAI from "openai";
import { GlossedSentence } from '../schemas/response';
import { GlossedChineseSentence } from '../schemas/chineseResponse';

export interface LLMProvider {
    openai: OpenAI;
    main(input: string): Promise<string>;
    translateText(text: string, l1: string, l2: string, num_sentences: number): Promise<string[]>;
    glossText?(text: string, l1: string, l2: string): Promise<GlossedSentence>;
    glossChineseText?(text: string, l1: string): Promise<GlossedChineseSentence>;
}