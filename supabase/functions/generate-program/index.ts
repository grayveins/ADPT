/**
 * AI Workout Program Generator
 * 
 * Takes user profile data and generates a personalized weekly workout program
 * using OpenAI.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

// Types for the generated program
type GeneratedExercise = {
  name: string;
  sets: number;
  reps: string;
  rir: number;
  notes?: string;
};

type GeneratedWorkout = {
  day: number;
  name: string;
  type: string;
  focus: string;
  exercises: GeneratedExercise[];
  estimatedDuration: number;
};

type GeneratedProgram = {
  name: string;
  description: string;
  workoutsPerWeek: number;
  workouts: GeneratedWorkout[];
  tips: string[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    let body: {
      goal?: string;
      experience?: string;
      workoutsPerWeek?: number;
      equipment?: string[];
      limitations?: string[];
      trainingStyle?: string;
      splitPreference?: string;
    };

    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const {
      goal = "build muscle",
      experience = "intermediate",
      workoutsPerWeek = 3,
      equipment = ["full gym"],
      limitations = [],
      trainingStyle = "hypertrophy",
      splitPreference,
    } = body;

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No OPENAI_API_KEY set." }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Build the prompt
    const prompt = buildPrompt({
      goal,
      experience,
      workoutsPerWeek,
      equipment,
      limitations,
      trainingStyle,
      splitPreference,
    });

    const messages = [
      {
        role: "system",
        content: `You are an expert strength and conditioning coach with 15+ years of experience designing training programs. You create science-backed, practical workout programs tailored to individual goals and constraints.

Your programs follow these principles:
- Progressive overload is king
- Compound movements form the foundation
- Volume is adjusted based on experience level
- Recovery is built into the program
- RIR (Reps In Reserve) is used for autoregulation

Always output valid JSON matching the requested schema. Be specific with exercise names (e.g., "Barbell Bench Press" not just "Bench Press").`,
      },
      { role: "user", content: prompt },
    ];

    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error(`OpenAI API error (${r.status}):`, errorText);

      let errorMessage = "AI service temporarily unavailable.";
      try {
        const errorData = JSON.parse(errorText);
        if (errorData?.error?.code === "insufficient_quota") {
          errorMessage = "Service is at capacity. Please try again later.";
        }
      } catch {
        // ignore
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 503, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error("Unexpected OpenAI response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to generate program. Please try again." }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let program: GeneratedProgram;
    try {
      program = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse program JSON:", content);
      return new Response(
        JSON.stringify({ error: "Generated program was invalid. Please try again." }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Validate the program structure
    if (!program.workouts || !Array.isArray(program.workouts)) {
      return new Response(
        JSON.stringify({ error: "Invalid program structure. Please try again." }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ program }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Unexpected error in generate-program function:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

function buildPrompt(params: {
  goal: string;
  experience: string;
  workoutsPerWeek: number;
  equipment: string[];
  limitations: string[];
  trainingStyle: string;
  splitPreference?: string;
}): string {
  const {
    goal,
    experience,
    workoutsPerWeek,
    equipment,
    limitations,
    trainingStyle,
    splitPreference,
  } = params;

  const limitationsText =
    limitations.length > 0
      ? `The user has the following limitations/injuries to work around: ${limitations.join(", ")}.`
      : "The user has no injuries or limitations.";

  const splitText = splitPreference
    ? `Their preferred training split is: ${splitPreference}.`
    : `Choose the best split for ${workoutsPerWeek} days per week.`;

  return `Create a personalized ${workoutsPerWeek}-day per week workout program for the following user:

USER PROFILE:
- Goal: ${goal}
- Experience Level: ${experience}
- Training Style: ${trainingStyle}
- Available Equipment: ${equipment.join(", ")}
- ${limitationsText}
- ${splitText}

REQUIREMENTS:
1. Design exactly ${workoutsPerWeek} workout days
2. Each workout should be 45-60 minutes
3. Include 4-6 exercises per workout
4. Use RIR (Reps In Reserve) for intensity guidance
5. Include appropriate warm-up cues in notes
6. Adjust volume based on experience level (${experience})

OUTPUT FORMAT (JSON):
{
  "name": "Program name",
  "description": "1-2 sentence description of the program approach",
  "workoutsPerWeek": ${workoutsPerWeek},
  "workouts": [
    {
      "day": 1,
      "name": "Day name (e.g., 'Push Day')",
      "type": "Push/Pull/Legs/Upper/Lower/Full Body",
      "focus": "Primary focus (e.g., 'Chest & Triceps')",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "8-10",
          "rir": 2,
          "notes": "Optional form cue or note"
        }
      ],
      "estimatedDuration": 50
    }
  ],
  "tips": ["2-3 program-specific tips for the user"]
}

Generate the complete program now.`;
}
