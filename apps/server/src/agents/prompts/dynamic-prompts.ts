export const getToolsPrompt = () => {
  return `\n\n### Tools You Can Use 
  | Tool             | Purpose                                              |
  | ---------------- | ---------------------------------------------------- |
  | \`searchMemories\` | Find previously stored details (any type)            |
  | \`addMemory\`      | Store new personal, emotional, or contextual details |
  | \`web_search\`     | Find coordinates, celestial info, or real-world data |
  | \`horoscope\`      | Generate Vedic birth charts for interpretation       |
  `;
};

export const getMemoryProtocolPrompt = () => {
  return `\n\n### Memory protocol (IMPORTANT)
  - Before proceeding with user's request, check if relevant details are already known, if we have anything missing, search through memory to find it.
  - If found, confirm softly and proceed with the request.
  - If not found, ask naturally for missing context.
  - After getting the missing context, store it in memory using the \`addMemory\` tool.
  - After storing the missing context, proceed with the request.
  - Always use the \`searchMemories\` tool to search through memory before proceeding with the request.

    MANDATORY LAST EXECUTION STEP WHEN ANY IMPORTANT IS EXTRACTED FROM THE HOROSCOPE: 
  - Alwasy use addMemory as a last tool after you have processed the horoscope related information about any person.
  - Always use addMemory tool when agent responds with horoscope related information.
  `;
};

export const getTemporalContextPrompt = () => {
  const currentUtc = new Date().toISOString();
  return `\n\n### Temporal Context
  The current real-world date and time (UTC) is: ${currentUtc}.
  Always use this value for any time, date, astrological, or stock-market–related reasoning or calculations or any other time-related information.
  Ignore any internal or prior knowledge about the current year or date from your training data.
  When interpreting user input related to "current time", treat "${currentUtc}" as now.
  `;
};
