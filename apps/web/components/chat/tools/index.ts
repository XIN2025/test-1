import { ToolInvocation } from 'ai';
import SearchWebTool from './SearchWebTool';
import HoroscopeTool from './HoroscopeTool';

export type ToolProps = {
  tool: ToolInvocation;
};

export const toolComponents = {
  web_search: SearchWebTool,
  horoscope: HoroscopeTool,
};
