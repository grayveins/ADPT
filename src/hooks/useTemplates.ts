/**
 * useTemplates
 * Hook for managing workout templates with loading state.
 */

import { useState, useEffect, useCallback } from "react";
import {
  fetchTemplates,
  createTemplate,
  deleteTemplate as deleteTemplateApi,
  type WorkoutTemplate,
  type TemplateExercise,
} from "@/lib/workout/templates";

export function useTemplates(userId: string | null) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await fetchTemplates(userId);
    setTemplates(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (name: string, exercises: TemplateExercise[], sourceSessionId?: string) => {
      if (!userId) return null;
      const template = await createTemplate(userId, name, exercises, sourceSessionId);
      if (template) {
        setTemplates((prev) => [template, ...prev]);
      }
      return template;
    },
    [userId]
  );

  const remove = useCallback(async (templateId: string) => {
    const success = await deleteTemplateApi(templateId);
    if (success) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
    return success;
  }, []);

  return { templates, loading, create, remove, refresh };
}

export type { WorkoutTemplate, TemplateExercise };
