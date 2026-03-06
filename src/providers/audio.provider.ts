import { promises as fs } from "fs";
import * as path from "path";
import { randomUUIDv7 } from "bun";

export interface AudioResult {
    mp3File: string;
    mp3Path: string;
    timestampsFile: string;
    timestampsPath: string;
    timestampsFormat: "sentence" | "character" | "unknown";
    timestamps: unknown;
}

interface CreateAudioFileOptions {
    outputDir?: string;
    baseName?: string;
    languageBoost?: string;
    model?: string;
    speed?: number;
    vol?: number;
    pitch?: number;
    pollIntervalMs?: number;
    maxPollAttempts?: number;
}

interface MinimaxBaseResp {
    status_code?: number;
    status_msg?: string;
}

interface MinimaxCreateTaskResponse {
    task_id?: string | number;
    file_id?: string | number;
    base_resp?: MinimaxBaseResp;
    [key: string]: unknown;
}

interface MinimaxQueryTaskResponse {
    task_id?: string | number;
    status?: string;
    file_id?: string | number;
    base_resp?: MinimaxBaseResp;
    [key: string]: unknown;
}

const MINIMAX_API_BASE_URL = process.env.MINIMAX_API_BASE_URL || "https://api.minimax.io";

function resolveBaseName(baseName?: string): string {
    const raw = (baseName ?? "").trim();
    if (!raw) {
        return randomUUIDv7();
    }

    const sanitized = raw.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
    return sanitized.length > 0 ? sanitized : randomUUIDv7();
}

function normalizeTaskId(value: string | number | undefined): string {
    if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }

    throw new Error("MiniMax response did not include a valid task_id.");
}

function normalizeFileId(value: string | number | undefined): string {
    if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }

    throw new Error("MiniMax response did not include a valid file_id.");
}

function assertMinimaxSuccess(context: string, payload: { base_resp?: MinimaxBaseResp }) {
    const code = payload.base_resp?.status_code;
    if (typeof code === "number" && code !== 0) {
        const msg = payload.base_resp?.status_msg || "unknown error";
        throw new Error(`MiniMax ${context} failed (${code}): ${msg}`);
    }
}

async function minimaxJsonRequest<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
        throw new Error("MINIMAX_API_KEY is not configured.");
    }

    const response = await fetch(`${MINIMAX_API_BASE_URL}${endpoint}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...(init?.headers || {})
        }
    });

    const raw = await response.text();
    if (!response.ok) {
        throw new Error(`MiniMax request failed (${response.status}): ${raw.slice(0, 400)}`);
    }

    try {
        return JSON.parse(raw) as T;
    } catch {
        throw new Error(`MiniMax returned non-JSON response: ${raw.slice(0, 400)}`);
    }
}

async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatus(value: string | undefined): string {
    return (value || "processing").toLowerCase();
}

async function createTtsTask(
    text: string,
    voiceId: string,
    options: CreateAudioFileOptions
): Promise<MinimaxCreateTaskResponse> {
    const payload = {
        model: options.model || process.env.MINIMAX_TTS_MODEL || "speech-2.8-turbo",
        text,
        language_boost: options.languageBoost || "auto",
        voice_setting: {
            voice_id: voiceId,
            speed: options.speed ?? 1,
            vol: options.vol ?? 1,
            pitch: options.pitch ?? 0
        },
        audio_setting: {
            audio_sample_rate: 44100,
            bitrate: 128000,
            format: "mp3",
            channel: 2
        }
    };

    const createResponse = await minimaxJsonRequest<MinimaxCreateTaskResponse>("/v1/t2a_async_v2", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    assertMinimaxSuccess("create task", createResponse);
    return createResponse;
}

async function waitForTask(taskId: string, options: CreateAudioFileOptions): Promise<MinimaxQueryTaskResponse> {
    const intervalMs = options.pollIntervalMs ?? Number(process.env.MINIMAX_TTS_POLL_INTERVAL_MS || 3000);
    const maxAttempts = options.maxPollAttempts ?? Number(process.env.MINIMAX_TTS_MAX_POLL_ATTEMPTS || 120);

    let lastResponse: MinimaxQueryTaskResponse | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await minimaxJsonRequest<MinimaxQueryTaskResponse>(
            `/v1/query/t2a_async_query_v2?task_id=${encodeURIComponent(taskId)}`,
            { method: "GET" }
        );

        assertMinimaxSuccess("query task", response);
        lastResponse = response;

        const status = getStatus(response.status);
        if (status === "success") {
            return response;
        }

        if (status === "failed" || status === "expired") {
            throw new Error(`MiniMax task ${taskId} finished with status: ${status}`);
        }

        await sleep(intervalMs);
    }

    throw new Error(
        `MiniMax task polling timed out for task ${taskId}. Last response: ${JSON.stringify(lastResponse)}`
    );
}

async function downloadAudioByFileId(fileId: string): Promise<Buffer> {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
        throw new Error("MINIMAX_API_KEY is not configured.");
    }

    const response = await fetch(
        `${MINIMAX_API_BASE_URL}/v1/files/retrieve_content?file_id=${encodeURIComponent(fileId)}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        }
    );

    if (!response.ok) {
        const raw = await response.text();
        throw new Error(`MiniMax retrieve failed (${response.status}): ${raw.slice(0, 400)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
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

    const outputDir = options.outputDir ? path.resolve(options.outputDir) : process.cwd();
    await fs.mkdir(outputDir, { recursive: true });

    const baseName = resolveBaseName(options.baseName);
    const mp3File = `${baseName}.mp3`;
    const timestampsFile = `${baseName}.timestamps.json`;
    const mp3Path = path.join(outputDir, mp3File);
    const timestampsPath = path.join(outputDir, timestampsFile);

    const createResponse = await createTtsTask(cleanText, voiceId, options);
    const taskId = normalizeTaskId(createResponse.task_id);

    const queryResponse = await waitForTask(taskId, options);
    const fileId = normalizeFileId(queryResponse.file_id ?? createResponse.file_id);

    const audioBuffer = await downloadAudioByFileId(fileId);
    await Bun.write(mp3Path, audioBuffer);

    const timestampsPayload = {
        provider: "minimax",
        taskId,
        fileId,
        text: cleanText,
        languageBoost: options.languageBoost || "auto",
        createResponse,
        queryResponse,
        generatedAt: new Date().toISOString()
    };
    await Bun.write(timestampsPath, JSON.stringify(timestampsPayload, null, 2));

    return {
        mp3File,
        mp3Path,
        timestampsFile,
        timestampsPath,
        timestampsFormat: "unknown",
        timestamps: timestampsPayload
    };
}
