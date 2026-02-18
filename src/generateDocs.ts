import * as fs from "fs";
import * as path from "path";
import { runUnifiedTranslationPipeline } from "./pipeline/translate";
import type { GlossedChineseSentence } from "./schemas/chineseResponse";
import type { GrammarArray } from "./schemas/grammar";
import type { GlossedSentence } from "./schemas/response";

interface BibleRef {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

interface OutputSource {
  collection: "bible";
  version: string;
  lang: string;
  ref: BibleRef;
}

interface OutputTarget {
  lang: string;
}

type GlossedOutput = GlossedSentence[] | GlossedChineseSentence[];

interface InterlinearDoc {
  id: string;
  source: OutputSource;
  motherTongue: OutputTarget;
  text: string;
  translatedText: string[];
  glossedText: GlossedOutput;
  grammarPoints: GrammarArray;
  generatedAt: string;
  model: string;
}

const CONFIG = {
  version: "WEB",
  chunkSize: 5,
  sourceLang: "zh",
  targetLanguages: ["en", "es", "pt", "vi"],
  includeGrammar: true,
  detectSourceLanguage: false,
  continueOnTargetError: true
};

const pad = (num: number): string => num.toString().padStart(2, "0");

const parseVerses = (rawText: string): { number: number; text: string }[] => {
  const cleanText = rawText.trim();
  const regex = /(?:^|[\r\n]+)\s*(\d+)\s+([\s\S]*?)(?=(?:[\r\n]+\s*\d+\s+)|$)/g;

  const verses: { number: number; text: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleanText)) !== null) {
    const verseNum = parseInt(match[1], 10);
    const content = match[2].replace(/\s+/g, " ").trim();
    verses.push({ number: verseNum, text: content });
  }

  if (verses.length > 0) {
    const foundNumbers = new Set(verses.map((verse) => verse.number));
    const maxVerse = verses[verses.length - 1].number;
    const missing: number[] = [];

    for (let i = 1; i <= maxVerse; i++) {
      if (!foundNumbers.has(i)) {
        missing.push(i);
      }
    }

    if (missing.length > 0) {
      console.error(`ERROR: Found ${verses.length} verses, missing numbers: ${missing.join(", ")}.`);
    } else {
      console.log(`Validation OK: sequence from 1 to ${maxVerse}.`);
    }
  }

  return verses;
};

function buildInterlinearDoc(args: {
  sourceLang: string;
  targetLang: string;
  text: string;
  translatedText: string[];
  glossedText: GlossedOutput;
  grammarPoints: GrammarArray;
  bookName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  versionUsed: string;
  model: string;
}): InterlinearDoc {
  const id = `bible.${args.sourceLang}.${args.targetLang}_${args.bookName}.${pad(args.chapter)}.${pad(args.verseStart)}-${pad(args.verseEnd)}`;

  return {
    id,
    source: {
      collection: "bible",
      version: args.versionUsed,
      lang: args.sourceLang,
      ref: {
        book: args.bookName,
        chapter: args.chapter,
        verseStart: args.verseStart,
        verseEnd: args.verseEnd
      }
    },
    motherTongue: { lang: args.targetLang },
    text: args.text,
    translatedText: args.translatedText,
    glossedText: args.glossedText,
    grammarPoints: args.grammarPoints,
    generatedAt: new Date().toISOString().split("T")[0],
    model: args.model
  };
}

async function processBibleBook(
  filePath: string,
  bookName: string,
  chapter: number,
  sourceLang: string,
  targetLanguages: string[],
  versionUsed: string,
  model: string
) {
  try {
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const verses = parseVerses(rawContent);
    console.log(`Found ${verses.length} verses in ${bookName}.`);

    for (let i = 0; i < verses.length; i += CONFIG.chunkSize) {
      const chunk = verses.slice(i, i + CONFIG.chunkSize);
      const verseStart = chunk[0].number;
      const verseEnd = chunk[chunk.length - 1].number;
      const combinedText = chunk.map((verse) => `${verse.number} ${verse.text}`).join(" ");

      console.log(
        `Processing ${bookName} ${chapter}:${verseStart}-${verseEnd} for ${targetLanguages.join(", ")}`
      );

      const docsByLanguage = await runUnifiedTranslationPipeline(
        {
          text: combinedText,
          sourceLang,
          targetLanguages
        },
        {
          detectSourceLanguage: CONFIG.detectSourceLanguage,
          includeGrammar: CONFIG.includeGrammar,
          continueOnTargetError: CONFIG.continueOnTargetError
        }
      );

      for (const [targetLang, translatedDoc] of docsByLanguage.entries()) {
        const finalDoc = buildInterlinearDoc({
          sourceLang,
          targetLang,
          text: combinedText,
          translatedText: translatedDoc.translatedText,
          glossedText: translatedDoc.glossedText,
          grammarPoints: translatedDoc.grammarPoints ?? { points: [] },
          bookName,
          chapter,
          verseStart,
          verseEnd,
          versionUsed,
          model
        });

        const fileName = `${finalDoc.id}.json`;
        fs.writeFileSync(fileName, JSON.stringify(finalDoc, null, 2));
        console.log(`Generated file: ${fileName}`);
      }
    }
  } catch (error) {
    console.error("Error processing book:", error);
  }
}

const INPUT_FILE = path.join(
  "/home/isaac/Documentos/Proyectos/TypeScript/Bibila/",
  "FilemonZH.txt"
);

processBibleBook(
  INPUT_FILE,
  "filemon",
  1,
  CONFIG.sourceLang,
  CONFIG.targetLanguages,
  "FEB",
  "qwen"
);
