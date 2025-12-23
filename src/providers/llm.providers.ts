// Definition of contrate for LLM providers
import OpenAI from "openai";
import { GlossedText } from '../schemas/response';

export interface LLMProvider {
    openai: OpenAI;
    main(input: string): Promise<string>;
    translateText(text: string, l1: string, l2: string): Promise<string>;
    glossText?(text: string, l1: string, l2: string): Promise<GlossedText>;
}