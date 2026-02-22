import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { CharacterAlignmentResponseModel } from '@elevenlabs/elevenlabs-js/api';
import { randomUUIDv7 } from "bun";

// 1. Definimos la interfaz exacta que devuelve el SDK para evitar conflictos manuales
interface AlignmentData {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
}

interface AudioResult {
    fileName: string;
    alignment: AlignmentData | null; 
}

function mapAlignmentData(
    alignment?: CharacterAlignmentResponseModel
): AlignmentData | null {
    if (!alignment) return null;

    return {
        characters: alignment.characters,
        character_start_times_seconds: alignment.characterStartTimesSeconds,
        character_end_times_seconds: alignment.characterEndTimesSeconds,
    };
}

export async function createAudioFileFromText(text: string, voiceId: string): Promise<AudioResult> {
    // Es buena práctica inicializar el cliente fuera de la función si es posible, 
    // pero aquí dentro está bien si el contexto cambia.
    const client = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_KEY,
    });

    try {
        const response = await client.textToSpeech.convertWithTimestamps(voiceId, {
            modelId: 'eleven_multilingual_v2',
            text,
            outputFormat: "mp3_44100_128",
            // Asegúrate que tu versión del SDK soporte estos settings dentro de convertWithTimestamps
            // Si te da error aquí, muévelos al nivel superior o revisa la doc de tu versión específica
            voiceSettings: {
                stability: 0,
                similarityBoost: 0,
                useSpeakerBoost: true,
                speed: 1.0,
            },
        });

        // El audio viene en base64, lo convertimos a Buffer
        const audioBuffer = Buffer.from(response.audioBase64, 'base64');
        
        const fileName = `${randomUUIDv7()}.mp3`;

        await Bun.write(fileName, audioBuffer);

        return {
            fileName,
            alignment: mapAlignmentData(response.alignment),
        };

    } catch (error) {
        console.error("Error en ElevenLabs:", error);
        throw error;
    }
};
