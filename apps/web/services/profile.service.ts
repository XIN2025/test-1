import { ApiClient } from '@/lib/api-client';
import { ProfileInput } from '@repo/shared-types/types';

export class ProfileService {
  static async createProfile(profileData: ProfileInput) {
    return await ApiClient.post('/api/profile', profileData);
  }

  static async getKarmiPoints() {
    return await ApiClient.get<{ karmiPoints: number }>('/api/profile/karmi-points');
  }
}
