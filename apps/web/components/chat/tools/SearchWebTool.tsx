import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';
import ShinyText from '@/components/ShinyText';
import { ToolProps } from '.';

const PureSearchWebTool = ({ tool }: ToolProps) => {
  if (!tool.args) {
    return null;
  }
  const isLoading = tool.state === 'partial-call' || tool.state === 'call';
  if (!isLoading) {
    return null;
  }
  return (
    <div className='my-1 flex w-fit items-center gap-1 rounded-md text-sm'>
      <Loader2 size={16} className='text-muted-foreground animate-spin' />
      <ShinyText text={`Searching the web...`} />
    </div>
  );
};

const SearchWebTool = memo(PureSearchWebTool, (prevProps, nextProps) => {
  if (JSON.stringify(prevProps.tool.args) !== JSON.stringify(nextProps.tool.args)) {
    return false;
  }
  if (prevProps.tool.state !== nextProps.tool.state) {
    return false;
  }
  return true;
});
export default SearchWebTool;
