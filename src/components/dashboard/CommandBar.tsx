import { FC } from 'react';
import { Paper, TextField } from '@mui/material';

interface CommandBarProps {
  onExecute?: (command: string) => void;
}

const CommandBar: FC<CommandBarProps> = ({ onExecute }) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      const inputElement = event.target as HTMLInputElement;
      const command = inputElement.value.trim();
      
      if (command && onExecute) {
        onExecute(command);
        inputElement.value = '';
      }
      
      event.preventDefault();
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        borderRadius: 2
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Enter mathematical expression..."
        onKeyDown={handleKeyDown}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
    </Paper>
  );
};

export default CommandBar;