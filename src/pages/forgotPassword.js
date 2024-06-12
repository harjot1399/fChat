import React, { useState } from "react";
import { Box, Grid} from "@mui/material";
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Email } from "@mui/icons-material";

export function ForgotPassword () {

    const [recoveryEmail, setRecoveryEmail] = useState("")

    const handleResetPassword = async () => {
        try{
            await sendPasswordResetEmail(auth, recoveryEmail) 

        }catch(error) {
            console.log(error)
        }
    }

    return (
        <Grid container sx = {{height: '100vh', overflow: 'hidden'}}>
            <Grid item sm = {4} md={7} 
                sx = {{
                    backgroundColor: '#1876d2',
                    height: '100vh' 
                }}
            />
            
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                <Typography variant="h3" sx={{mt: 3}} align="center"> 
                    fChat
                </Typography>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', p: 4 , mb:4}}>
                   
                    <Typography variant="h4" sx={{mt: 10, color: '#1876d2'}}>
                        Reset Password
                    </Typography>

                    <Typography variant="h6" sx={{mt:3}}> Enter the email associated with the account</Typography>
                    
                    <form onSubmit={handleResetPassword} >
                        
                        <TextField 
                            label="Email" 
                            name = "email" 
                            type="email" 
                            required variant="outlined" 
                            fullWidth margin="normal" 
                            autoFocus 
                            onChange={(event) => setRecoveryEmail(event.target.value)} 
                            inputProps={{
                                style: { width: 350 } 
                        }}/>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Button variant="contained" color="primary" sx={{ mt: 2 }} type="submit">
                                Continue
                            </Button>
                        </Box>
                    </form>
                 </Box>
                 
            </Grid>

        </Grid>

    )
}