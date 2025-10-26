import { Injectable } from '@nestjs/common';
import { tool, generateText, Tool } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { AstrologyApiService } from 'src/astrology-apis/astrology-api.service';
import { ChatConfigService } from './chat-config.service';
@Injectable()
export class ToolsService {
  constructor(
    private readonly astrologyApiService: AstrologyApiService,
    private readonly chatConfigService: ChatConfigService
  ) {}
  websiteSearchTool(): Tool {
    return tool({
      description:
        'Use this tool to search the web, you must use this tool when you needed live information, or needed any information from internet',
      inputSchema: z.object({
        query: z.string().describe('Be specific about what you want to search'),
      }),
      execute: async ({ query }) => {
        try {
          const { text } = await generateText({
            model: google('gemini-2.0-flash'),
            prompt: query,
            system: this.chatConfigService.getChatConfig().webSearchPrompt,
          });
          return {
            success: true,
            data: text,
          };
        } catch (error) {
          console.log('error', error);
          return {
            success: false,
            error: error.message,
          };
        }
      },
    });
  }

  horoscopeTool(): Tool {
    return tool({
      description:
        'Use this tool to get horoscope information based on the date of birth and location. For latitude and longitude use the tool web_search to get the information',
      inputSchema: z.object({
        dateOfBirth: z.string().describe('The date of birth in the format YYYY-MM-DDTHH:MM:SS.SSSZ'),
        latitude: z.number().describe('The latitude of the place of birth'),
        longitude: z.number().describe('The longitude of the place of birth'),
        timezoneOffset: z.number().describe('The timezone offset of the place of birth'),
      }),
      execute: async ({ dateOfBirth, latitude, longitude, timezoneOffset }) => {
        try {
          const horoscope = await this.astrologyApiService.getHoroscope({
            dateOfBirth,
            latitude,
            longitude,
            timezoneOffset,
          });
          return {
            success: true,
            data: horoscope,
          };
        } catch (error) {
          console.log('error', error);
          return {
            success: false,
            error: error.message,
          };
        }
      },
    });
  }
  getTools() {
    return {
      web_search: this.websiteSearchTool(),
      horoscope: this.horoscopeTool(),
    };
  }
}
