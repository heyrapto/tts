import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "fs";
import path from "path";
import mime from "mime";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const VALID_VOICES = ["Schedar", "Aoede", "Charon", "Fenrir", "Kore", "Puck"];

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function parseMimeType(mimeType: string) {
  const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
  const [_, format] = fileType.split("/");

  const options: Partial<WavConversionOptions> = {
    numChannels: 1,
  };

  if (format && format.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim());
    if (key === "rate") {
      options.sampleRate = parseInt(value, 10);
    }
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

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function convertToWav(pcmBuffer: Buffer, mimeType: string) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(pcmBuffer.length, options);
  return Buffer.concat([wavHeader, pcmBuffer]);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const voice = searchParams.get("voice") || "";

    if (!VALID_VOICES.includes(voice)) {
      return NextResponse.json({ error: "Invalid voice requested" }, { status: 400 });
    }

    const filename = `${voice.toLowerCase()}.wav`;
    const publicDir = path.join(process.cwd(), "public");
    const previewsDir = path.join(publicDir, "previews");
    const filePath = path.join(previewsDir, filename);

    // Ensure directory exists
    await fs.mkdir(previewsDir, { recursive: true });

    // Check if the file already exists in cache
    try {
      const fileBuffer = await fs.readFile(filePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (e) {
      // File does not exist, let's generate it
    }

    const text = `Hello. I am ${voice}. This is a preview of my voice in the text to speech studio.`;

    const config = {
      temperature: 1,
      responseModalities: ["audio"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
    };

    const model = "gemini-3.1-flash-tts-preview";
    const contents = [
      {
        role: "user",
        parts: [{ text }],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    const buffers: Buffer[] = [];
    let detectedMimeType = "";

    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      const inlineData = chunk.candidates[0].content.parts[0].inlineData;
      if (inlineData) {
        if (!detectedMimeType && inlineData.mimeType) {
          detectedMimeType = inlineData.mimeType;
        }
        const b = Buffer.from(inlineData.data || "", "base64");
        buffers.push(b);
      }
    }

    if (buffers.length === 0) {
      return NextResponse.json({ error: "No audio generated" }, { status: 500 });
    }

    const combinedBuffer = Buffer.concat(buffers);
    let finalBuffer = combinedBuffer;
    let contentType = detectedMimeType || "audio/wav";

    let fileExtension = mime.getExtension(detectedMimeType);
    if (!fileExtension) {
      finalBuffer = convertToWav(combinedBuffer, detectedMimeType);
      contentType = "audio/wav";
    }

    // Save to cache directory
    await fs.writeFile(filePath, finalBuffer);

    return new NextResponse(finalBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": finalBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Voice Preview Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
