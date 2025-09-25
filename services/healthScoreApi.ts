// Use fixed base for health score as per provided endpoint
const API_BASE_URL = 'https://api.evra.opengig.work';

type HealthScoreResponse = {
  success?: boolean;
  message?: string;
  data?: { score?: number } | number;
  score?: number;
};

class HealthScoreApiService {
  async getHealthScore(userEmail: string): Promise<number | null> {
    if (!userEmail) return null;
    try {
      const url = `${API_BASE_URL}/api/health-score/${encodeURIComponent(userEmail)}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return null;
      }

      const json: HealthScoreResponse = await response.json();

      if (typeof json === 'number') return json;
      if (typeof json.score === 'number') return json.score;
      // Common shape: { data: { health_score: { score: number } } }
      if (json.data && (json.data as any).health_score && typeof (json.data as any).health_score.score === 'number') {
        return (json.data as any).health_score.score as number;
      }
      // Alternate: { data: { score: number } }
      if (json.data && typeof (json.data as any).score === 'number') return (json.data as any).score;

      // Some backends may just return { value: number }
      if ((json as any).value && typeof (json as any).value === 'number') return (json as any).value;

      return null;
    } catch (error) {
      console.error('Failed to fetch health score:', error);
      return null;
    }
  }
}

export const healthScoreApi = new HealthScoreApiService();
