import React from 'react';
import { Text } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface CustomMarkdownProps {
  children: string;
  style?: object;
}

// const markdownStyles = {
//   body: {
//     fontSize: 15,
//     lineHeight: 20,
//     color: '#000000',
//     margin: 0,
//   },
//   heading1: {
//     fontSize: 20,
//     fontWeight: 'bold' as const,
//     color: '#0F766E',
//     marginBottom: 8,
//     marginTop: 0,
//   },
//   heading2: {
//     fontSize: 18,
//     fontWeight: 'bold' as const,
//     color: '#000000',
//     marginBottom: 6,
//     marginTop: 0,
//   },
//   heading3: {
//     fontSize: 16,
//     fontWeight: 'bold' as const,
//     color: '#000000',
//     marginBottom: 4,
//     marginTop: 0,
//   },
//   paragraph: {
//     marginBottom: 8,
//     marginTop: 0,
//   },
//   strong: {
//     fontWeight: 'bold' as const,
//     color: '#1F2937',
//   },
//   em: {
//     fontStyle: 'italic' as const,
//   },
//   code_inline: {
//     backgroundColor: '#F0FDFA',
//     color: '#0F766E',
//     paddingHorizontal: 4,
//     paddingVertical: 2,
//     borderRadius: 4,
//     fontSize: 14,
//     fontFamily: 'monospace',
//   },
//   code_block: {
//     backgroundColor: '#F0FDFA',
//     padding: 12,
//     borderRadius: 8,
//     borderLeftWidth: 4,
//     borderLeftColor: '#14B8A6',
//     marginVertical: 8,
//   },
//   fence: {
//     backgroundColor: '#F0FDFA',
//     padding: 12,
//     borderRadius: 8,
//     borderLeftWidth: 4,
//     borderLeftColor: '#14B8A6',
//     marginVertical: 8,
//   },
//   list_item: {
//     marginBottom: 4,
//   },
//   bullet_list: {
//     marginBottom: 8,
//   },
//   ordered_list: {
//     marginBottom: 8,
//   },
//   link: {
//     color: '#14B8A6',
//     textDecorationLine: 'underline' as const,
//   },
//   blockquote: {
//     backgroundColor: '#F9FAFB',
//     borderLeftWidth: 4,
//     borderLeftColor: '#D1D5DB',
//     paddingLeft: 12,
//     paddingVertical: 8,
//     marginVertical: 8,
//     fontStyle: 'italic' as const,
//   },
//   hr: {
//     backgroundColor: '#E5E7EB',
//     height: 1,
//     marginVertical: 16,
//   },
//   table: {
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 8,
//     marginVertical: 8,
//   },
//   thead: {
//     backgroundColor: '#F9FAFB',
//   },
//   tbody: {
//     backgroundColor: '#FFFFFF',
//   },
//   th: {
//     padding: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E5E7EB',
//     fontWeight: 'bold' as const,
//     color: '#000000',
//   },
//   td: {
//     padding: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F3F4F6',
//   },
// };

const CustomMarkdown: React.FC<CustomMarkdownProps> = ({ children, style = {} }) => {
  const combinedStyles = { ...style };

  if (!children || typeof children !== 'string') {
    return <Text className="text-base italic text-gray-500">No content to display</Text>;
  }

  return <Markdown style={combinedStyles}>{children}</Markdown>;
};

export default CustomMarkdown;
