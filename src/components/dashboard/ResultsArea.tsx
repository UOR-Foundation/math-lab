import { FC } from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface ResultsAreaProps {
  results?: Array<{
    id: string;
    expression: string;
    result: string;
    timestamp: number;
  }>;
}

const ResultsArea: FC<ResultsAreaProps> = ({ results = [] }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Results
      </Typography>
      
      {results.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No calculations yet. Enter an expression in the command bar to get started.
        </Typography>
      ) : (
        results.map((item) => (
          <Box 
            key={item.id} 
            sx={{ 
              mb: 2,
              p: 2, 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1 
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {new Date(item.timestamp).toLocaleTimeString()}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ fontFamily: 'monospace' }}
            >
              {item.expression}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ mt: 1, fontFamily: 'monospace' }}
            >
              = {item.result}
            </Typography>
          </Box>
        ))
      )}
    </Paper>
  );
};

export default ResultsArea;