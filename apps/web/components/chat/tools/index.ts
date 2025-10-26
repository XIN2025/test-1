import { ToolUIPart } from 'ai';
import SearchWebTool from './SearchWebTool';
import HoroscopeTool from './HoroscopeTool';

export type ToolProps = {
  tool: ToolUIPart;
};

export const toolComponents = {
  web_search: SearchWebTool,
  horoscope: HoroscopeTool,
};
