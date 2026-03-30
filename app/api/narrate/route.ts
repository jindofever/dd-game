import { NextResponse } from "next/server";
import { NARRATION_SYSTEM_PROMPT, sanitizeNarrationResponse } from "@/lib/ai/prompt";
import { createMockNarration } from "@/lib/ai/mock-narration";
import type { RunResult } from "@/lib/game/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { result?: RunResult; payload?: unknown };
    if (!body.result) {
      return NextResponse.json({ error: "Missing result payload" }, { status: 400 });
    }

    const result = body.result;
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;

    if (!apiKey || !model) {
      return NextResponse.json(createMockNarration(result));
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: NARRATION_SYSTEM_PROMPT }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: JSON.stringify(body.payload ?? body.result, null, 2) }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "quest_narration",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                decisions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      label: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["id", "label", "description"],
                  },
                },
              },
              required: ["summary", "decisions"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(createMockNarration(result));
    }

    const json = (await response.json()) as {
      output_text?: string;
    };
    const parsed = json.output_text ? sanitizeNarrationResponse(JSON.parse(json.output_text)) : null;
    return NextResponse.json(parsed ?? createMockNarration(result));
  } catch {
    return NextResponse.json({ error: "Narration failed" }, { status: 500 });
  }
}
