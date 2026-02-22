import { promises as fs } from "fs";
import * as path from "path";
import { randomUUIDv7 } from "bun";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { CharacterAlignmentResponseModel } from "@elevenlabs/elevenlabs-js/api";

export interface AlignmentData {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
}

export interface AudioResult {
    mp3File: string;
    mp3Path: string;
    timestampsFile: string;
    timestampsPath: string;
    alignment: AlignmentData | null;
}

interface CreateAudioFileOptions {
    outputDir?: string;
    baseName?: string;
}

function mapAlignmentData(alignment?: CharacterAlignmentResponseModel): AlignmentData | null {
    if (!alignment) {
        return null;
    }

    return {
        characters: alignment.characters,
        character_start_times_seconds: alignment.characterStartTimesSeconds,
        character_end_times_seconds: alignment.characterEndTimesSeconds
    };
}

function resolveBaseName(baseName?: string): string {
    const raw = (baseName ?? "").trim();
    if (!raw) {
        return randomUUIDv7();
    }

    const sanitized = raw.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
    return sanitized.length > 0 ? sanitized : randomUUIDv7();
}

export async function createAudioFileFromText(
    text: string,
    voiceId: string,
    options: CreateAudioFileOptions = {}
): Promise<AudioResult> {
    const cleanText = text.trim();
    if (!cleanText) {
        throw new Error("createAudioFileFromText requires non-empty text.");
    }

    if (!process.env.ELEVENLABS_KEY) {
        throw new Error("ELEVENLABS_KEY is not configured.");
    }

    const client = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_KEY
    });

    const outputDir = options.outputDir ? path.resolve(options.outputDir) : process.cwd();
    await fs.mkdir(outputDir, { recursive: true });

    const baseName = resolveBaseName(options.baseName);
    const mp3File = `${baseName}.mp3`;
    const timestampsFile = `${baseName}.timestamps.json`;
    const mp3Path = path.join(outputDir, mp3File);
    const timestampsPath = path.join(outputDir, timestampsFile);

    const response = await client.textToSpeech.convertWithTimestamps(voiceId, {
        modelId: "eleven_multilingual_v2",
        text: cleanText,
        outputFormat: "mp3_44100_128",
        voiceSettings: {
            stability: 0,
            similarityBoost: 0,
            useSpeakerBoost: true,
            speed: 1
        }
    });

    const audioBuffer = Buffer.from(response.audioBase64, "base64");
    await Bun.write(mp3Path, audioBuffer);

    const alignment = mapAlignmentData(response.alignment);
    const timestampPayload = {
        voiceId,
        text: cleanText,
        alignment,
        generatedAt: new Date().toISOString()
    };
    await Bun.write(timestampsPath, JSON.stringify(timestampPayload, null, 2));

    return {
        mp3File,
        mp3Path,
        timestampsFile,
        timestampsPath,
        alignment
    };
}
