import { ApiClient } from '@/lib/api-client';
import { ProfileInput, ProfileType } from '@repo/shared-types/types';

export class ProfileService {
  static async createProfile(profileData: ProfileInput) {
    return await ApiClient.post('/api/profile', profileData);
  }

  static async getKarmiPoints() {
    return await ApiClient.get<{ karmiPoints: number }>('/api/profile/karmi-points');
  }
  static async getUserProfile() {
    return await ApiClient.get<ProfileType>('/api/profile');
  }

  static async deleteUserProfile() {
    return await ApiClient.delete('/api/profile');
  }
}
