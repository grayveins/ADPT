export function useUserXP(_userId: string | null) {
  return {
    data: { total_xp: 0, level: 1, rank: "Bronze" },
    loading: false,
    refresh: async () => {},
  };
}
