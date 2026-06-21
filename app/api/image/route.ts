import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const model = 'gemini-2.5-flash-image';
    const config = {
      responseModalities: ['IMAGE', 'TEXT'],
    };
    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    const images: { data: string; mimeType: string }[] = [];
    let textContent = '';

    for await (const chunk of response) {
      if (!chunk.candidates?.[0]?.content?.parts) {
        continue;
      }
      for (const part of chunk.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push({
            data: part.inlineData.data || '',
            mimeType: part.inlineData.mimeType || 'image/png',
          });
        } else if (part.text) {
          textContent += part.text;
        }
      }
    }

    if (images.length === 0 && !textContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    return NextResponse.json({ images, text: textContent });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
