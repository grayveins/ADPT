/**
 * ADPT Coach Chat Edge Function
 * 
 * Handles AI coaching conversations with personalized context.
 * Supports two context modes:
 * - Lite: Minimal context for quick questions (~300 tokens)
 * - Full: Comprehensive context for personalized advice (~800 tokens)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// ============================================================================
// Types (mirrored from src/types/coachContext.ts for Deno)
// ============================================================================

interface LimitationsContext {
  areas: string[];
  details: string | null;
  recentPainReports: {
    location: string;
    date: string;
    exerciseName?: string;
  }[];
}

interface LiteCoachContext {
  mode: "lite";
  name: string;
  goal: string | null;
  experienceLevel: string | null;
  limitations: LimitationsContext;
  currentStreak: number;
  daysSinceLastWorkout: number | null;
  isRestDay: boolean;
}

interface UserProfile {
  name: string;
  age: number | null;
  sex: string | null;
  weightKg: number | null;
  weightLbs: number | null;
  heightCm: number | null;
}

interface TrainingPreferences {
  goal: string | null;
  goalTimeline: string | null;
  experienceLevel: string | null;
  workoutsPerWeek: number | null;
  workoutDuration: number | null;
  splitPreference: string | null;
  preferredDays: string[];
}

interface EquipmentContext {
  gymType: string | null;
  available: string[];
}

interface PRData {
  weight: number;
  reps: number;
  e1RM: number;
  date: string | null;
}

interface StrengthContext {
  benchPR: PRData | null;
  squatPR: PRData | null;
  deadliftPR: PRData | null;
  ohpPR: PRData | null;
}

interface RecentWorkout {
  date: string;
  title: string;
  feeling: string | null;
  painLocation: string | null;
  exercises: string[];
  durationMinutes: number | null;
}

interface ProgressContext {
  currentStreak: number;
  longestStreak: number;
  workoutsThisWeek: number;
  workoutsLastWeek: number;
  totalWorkouts: number;
  recentPRs: {
    exercise: string;
    weight: number;
    date: string;
  }[];
}

interface TodayContext {
  isRestDay: boolean;
  scheduledWorkout: string | null;
  daysSinceLastWorkout: number | null;
  musclesRecovered: string[];
  musclesFatigued: string[];
}

interface FullCoachContext {
  mode: "full";
  profile: UserProfile;
  training: TrainingPreferences;
  limitations: LimitationsContext;
  equipment: EquipmentContext;
  strength: StrengthContext;
  recentWorkouts: RecentWorkout[];
  progress: ProgressContext;
  today: TodayContext;
}

type CoachContext = LiteCoachContext | FullCoachContext;

interface ChatRequest {
  text: string;
  history?: { role: string; content: string }[];
  context?: CoachContext;
}

// ============================================================================
// CORS Headers
// ============================================================================

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

// ============================================================================
// System Prompt Builder
// ============================================================================

/**
 * Build the base system prompt (always included)
 */
function buildBasePrompt(): string {
  return `You are 'ADPT Coach' - a knowledgeable, no-BS personal trainer. You have 10+ years of experience training real clients.

PERSONALITY:
- Friendly but direct - like a coach who genuinely cares
- Confident in your advice, but humble enough to say "it depends"
- Use simple language, avoid jargon unless explaining it
- Encouraging but not cheesy

EXPERTISE:
- Strength training: progressive overload, compound movements, proper form
- Hypertrophy: volume, intensity, time under tension
- Nutrition: protein targets (0.8-1g/lb), caloric surplus/deficit
- Recovery: sleep, deload weeks, injury prevention
- Program design: PPL, Upper/Lower, Full Body splits

RESPONSE STYLE:
- Keep responses concise (under 150 words) unless detail is needed
- Use plain text only - NO markdown, no bold, no headers, no code blocks
- For lists, use simple dashes (- like this)
- Give specific numbers when relevant (sets, reps, weights)
- For form questions, give 2-3 key cues

NEVER:
- Use markdown formatting (no **, no ##, no \`code\`)
- Recommend dangerous practices or extreme diets
- Diagnose injuries or medical conditions
- Be preachy about rest days`;
}

/**
 * Build safety section for limitations (ALWAYS included if present)
 */
function buildSafetySection(limitations: LimitationsContext): string {
  if (limitations.areas.length === 0 && limitations.recentPainReports.length === 0) {
    return "";
  }

  let section = "\n\nCRITICAL - USER SAFETY:";
  
  if (limitations.areas.length > 0) {
    section += `\nKnown limitations: ${limitations.areas.join(", ")}`;
    if (limitations.details) {
      section += `\nDetails: ${limitations.details}`;
    }
  }
  
  if (limitations.recentPainReports.length > 0) {
    section += "\nRecent pain reports:";
    for (const report of limitations.recentPainReports.slice(0, 3)) {
      const date = new Date(report.date).toLocaleDateString();
      section += `\n- ${report.location} pain (${date})`;
    }
  }
  
  section += `

SAFETY RULES:
- NEVER recommend exercises that stress these areas without suggesting modifications
- If user mentions pain, prioritize rest and suggest seeing a professional
- Always offer safe alternatives when recommending exercises`;

  return section;
}

/**
 * Build lite context section
 */
function buildLiteContextSection(ctx: LiteCoachContext): string {
  let section = `\n\nUSER CONTEXT:
Name: ${ctx.name}`;

  if (ctx.goal) {
    section += `\nGoal: ${formatGoal(ctx.goal)}`;
  }
  
  if (ctx.experienceLevel) {
    section += `\nExperience: ${ctx.experienceLevel}`;
  }
  
  section += `\nCurrent streak: ${ctx.currentStreak} days`;
  
  if (ctx.daysSinceLastWorkout !== null) {
    section += `\nDays since last workout: ${ctx.daysSinceLastWorkout}`;
  }
  
  if (ctx.isRestDay) {
    section += `\nToday is a scheduled rest day`;
  }

  return section;
}

/**
 * Build full context section
 */
function buildFullContextSection(ctx: FullCoachContext): string {
  let section = "\n\nUSER PROFILE:";
  
  // Basic profile
  section += `\nName: ${ctx.profile.name}`;
  if (ctx.profile.age) section += `\nAge: ${ctx.profile.age}`;
  if (ctx.profile.sex) section += `\nSex: ${ctx.profile.sex}`;
  if (ctx.profile.weightLbs) section += `\nWeight: ${ctx.profile.weightLbs} lbs`;
  
  // Training context
  section += "\n\nTRAINING:";
  if (ctx.training.goal) section += `\nGoal: ${formatGoal(ctx.training.goal)}`;
  if (ctx.training.goalTimeline) section += ` (${formatTimeline(ctx.training.goalTimeline)})`;
  if (ctx.training.experienceLevel) section += `\nExperience: ${ctx.training.experienceLevel}`;
  if (ctx.training.workoutsPerWeek) section += `\nSchedule: ${ctx.training.workoutsPerWeek}x per week`;
  if (ctx.training.workoutDuration) section += `, ${ctx.training.workoutDuration} min sessions`;
  if (ctx.training.splitPreference) section += `\nSplit: ${formatSplit(ctx.training.splitPreference)}`;
  
  // Equipment
  if (ctx.equipment.gymType) {
    section += `\n\nEQUIPMENT:`;
    section += `\nGym type: ${ctx.equipment.gymType}`;
    if (ctx.equipment.available.length > 0) {
      section += `\nAvailable: ${ctx.equipment.available.slice(0, 8).join(", ")}`;
    }
  }
  
  // Strength levels
  const hasStrength = ctx.strength.benchPR || ctx.strength.squatPR || 
                      ctx.strength.deadliftPR || ctx.strength.ohpPR;
  if (hasStrength) {
    section += "\n\nCURRENT STRENGTH (Est. 1RM):";
    if (ctx.strength.benchPR) section += `\n- Bench: ${ctx.strength.benchPR.e1RM} lbs`;
    if (ctx.strength.squatPR) section += `\n- Squat: ${ctx.strength.squatPR.e1RM} lbs`;
    if (ctx.strength.deadliftPR) section += `\n- Deadlift: ${ctx.strength.deadliftPR.e1RM} lbs`;
    if (ctx.strength.ohpPR) section += `\n- OHP: ${ctx.strength.ohpPR.e1RM} lbs`;
  }
  
  // Recent workouts
  if (ctx.recentWorkouts.length > 0) {
    section += "\n\nRECENT WORKOUTS:";
    for (const workout of ctx.recentWorkouts.slice(0, 3)) {
      const date = new Date(workout.date).toLocaleDateString();
      let line = `\n- ${date}: ${workout.title}`;
      if (workout.feeling) line += ` (felt ${workout.feeling})`;
      if (workout.painLocation) line += ` [reported ${workout.painLocation} pain]`;
      section += line;
    }
  }
  
  // Progress
  section += "\n\nPROGRESS:";
  section += `\nStreak: ${ctx.progress.currentStreak} days (best: ${ctx.progress.longestStreak})`;
  section += `\nThis week: ${ctx.progress.workoutsThisWeek} workouts`;
  section += `\nTotal workouts: ${ctx.progress.totalWorkouts}`;
  
  if (ctx.progress.recentPRs.length > 0) {
    section += "\nRecent PRs:";
    for (const pr of ctx.progress.recentPRs.slice(0, 3)) {
      section += ` ${pr.exercise} ${pr.weight}lbs,`;
    }
    section = section.slice(0, -1); // Remove trailing comma
  }
  
  // Today
  section += "\n\nTODAY:";
  if (ctx.today.isRestDay) {
    section += "\n- Scheduled rest day";
  } else if (ctx.today.scheduledWorkout) {
    section += `\n- Scheduled: ${ctx.today.scheduledWorkout}`;
  }
  if (ctx.today.daysSinceLastWorkout !== null) {
    section += `\n- Days since last workout: ${ctx.today.daysSinceLastWorkout}`;
  }
  if (ctx.today.musclesRecovered.length > 0) {
    section += `\n- Muscles ready: ${ctx.today.musclesRecovered.slice(0, 5).join(", ")}`;
  }
  if (ctx.today.musclesFatigued.length > 0) {
    section += `\n- Muscles fatigued: ${ctx.today.musclesFatigued.join(", ")}`;
  }

  return section;
}

/**
 * Build the complete system prompt based on context
 */
function buildSystemPrompt(context?: CoachContext): string {
  let prompt = buildBasePrompt();
  
  if (!context) {
    return prompt;
  }
  
  // Always add safety section if limitations exist
  prompt += buildSafetySection(context.limitations);
  
  // Add context-specific sections
  if (context.mode === "lite") {
    prompt += buildLiteContextSection(context);
  } else {
    prompt += buildFullContextSection(context);
  }
  
  // Add personalization reminder
  prompt += `\n\nIMPORTANT: Use this context to personalize your responses. Reference the user's actual data when relevant (their PRs, streak, goals, etc.).`;
  
  return prompt;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatGoal(goal: string): string {
  const goals: Record<string, string> = {
    build_muscle: "Build Muscle",
    lose_fat: "Lose Fat",
    get_stronger: "Get Stronger",
    general_fitness: "General Fitness",
  };
  return goals[goal] || goal;
}

function formatTimeline(timeline: string): string {
  const timelines: Record<string, string> = {
    "3_months": "3 month timeline",
    "6_months": "6 month timeline",
    "1_year": "1 year timeline",
    "no_rush": "no specific timeline",
  };
  return timelines[timeline] || timeline;
}

function formatSplit(split: string): string {
  const splits: Record<string, string> = {
    ppl: "Push/Pull/Legs",
    upper_lower: "Upper/Lower",
    full_body: "Full Body",
    auto: "AI Optimized",
  };
  return splits[split] || split;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Parse request body
    let body: ChatRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { text, history, context } = body;
    
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text'." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Get API key
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No OPENAI_API_KEY set." }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Build personalized system prompt
    const systemPrompt = buildSystemPrompt(context);
    
    // Log context mode for debugging (remove in production if desired)
    const contextMode = context?.mode || "none";
    console.log(`Chat request - context mode: ${contextMode}, message length: ${text.length}`);

    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history : []).map((m: { role?: string; content?: string }) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: String(m?.content ?? ""),
      })),
      { role: "user", content: text },
    ];

    // Get model from env or use default
    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

    // Call OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    // Handle OpenAI errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);

      let errorMessage = "AI service temporarily unavailable.";
      let errorCode: string | undefined;
      
      try {
        const errorData = JSON.parse(errorText);
        errorCode = errorData?.error?.code;
        if (errorCode === "insufficient_quota") {
          errorMessage = "Service is at capacity. Please try again later.";
        } else if (errorCode === "invalid_api_key") {
          errorMessage = "Service configuration error. Please contact support.";
        }
      } catch {
        // Ignore JSON parse error
      }

      return new Response(JSON.stringify({
        reply: errorMessage,
        error: true,
        debug: { code: errorCode, contextMode },
      }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Parse successful response
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("Unexpected OpenAI response structure:", JSON.stringify(data));
      return new Response(JSON.stringify({
        reply: "I had trouble processing that. Could you try rephrasing?",
        error: true,
        debug: { contextMode },
      }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Return successful response
    return new Response(JSON.stringify({ 
      reply,
      debug: { contextMode },
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
    
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("Unexpected error in chat function:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
