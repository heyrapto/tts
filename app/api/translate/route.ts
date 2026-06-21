import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string) {
  const [fileType, ...params] = mimeType.split(';').map((s) => s.trim());
  const [_, format] = fileType.split('/');

  const options: Partial<WavConversionOptions> = { numChannels: 1 };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) options.bitsPerSample = bits;
  }

  for (const param of params) {
    const [key, value] = param.split('=').map((s) => s.trim());
    if (key === 'rate') options.sampleRate = parseInt(value, 10);
  }

  options.sampleRate = options.sampleRate || 24000;
  options.bitsPerSample = options.bitsPerSample || 16;

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions) {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function convertToWav(pcmBuffer: Buffer, mimeType: string) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(pcmBuffer.length, options);
  return Buffer.concat([wavHeader, pcmBuffer]);
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  ru: 'Russian',
  nl: 'Dutch',
  tr: 'Turkish',
  pl: 'Polish',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  uk: 'Ukrainian',
  cs: 'Czech',
  ro: 'Romanian',
  hu: 'Hungarian',
  el: 'Greek',
  he: 'Hebrew',
  bn: 'Bengali',
};

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage = 'en', voice = 'Kore' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;

    // Step 1: Translate text using Gemini
    const translateResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following text to ${langName}. Return ONLY the translated text with no explanation, commentary, or additional formatting:\n\n${text}`,
    });

    const translatedText = translateResponse.text?.trim() || '';

    if (!translatedText) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    // Step 2: Generate TTS audio of the translated text
    const ttsConfig = {
      temperature: 1,
      responseModalities: ['audio'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    };

    const ttsResponse = await ai.models.generateContentStream({
      model: 'gemini-3.1-flash-tts-preview',
      config: ttsConfig,
      contents: [{ role: 'user', parts: [{ text: translatedText }] }],
    });

    const audioBuffers: Buffer[] = [];
    let detectedMimeType = '';

    for await (const chunk of ttsResponse) {
      if (!chunk.candidates?.[0]?.content?.parts) continue;
      const inlineData = chunk.candidates[0].content.parts[0].inlineData;
      if (inlineData) {
        if (!detectedMimeType && inlineData.mimeType) {
          detectedMimeType = inlineData.mimeType;
        }
        audioBuffers.push(Buffer.from(inlineData.data || '', 'base64'));
      }
    }

    let audioBase64 = '';
    if (audioBuffers.length > 0) {
      let combined = Buffer.concat(audioBuffers);
      const ext = mime.getExtension(detectedMimeType);
      if (!ext) {
        combined = convertToWav(combined, detectedMimeType);
      }
      audioBase64 = combined.toString('base64');
    }

    return NextResponse.json({
      translatedText,
      audio: audioBase64,
      mimeType: detectedMimeType || 'audio/wav',
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
