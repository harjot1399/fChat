import React from "react";
import { Box, Button} from "@mui/material";

export function HomePage() {
    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh'
        }}>
          <Button variant="contained">
            Start Chat
          </Button>
          <Button variant="contained">
            Logout
          </Button>
        </Box>
    )
}