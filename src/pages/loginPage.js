import { Grid, Alert } from "@mui/material";
import React from "react";
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'
import { useState } from "react";
import {db} from "../firebase"
import {  doc, updateDoc } from 'firebase/firestore';

export function LoginPage() {

    const [credentialsError, setCrendentialsError] = useState(false)

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const navigator = useNavigate()
    const handleLogin = async (event) => {
        event.preventDefault()
        try{
            const loggedInCredential = await signInWithEmailAndPassword(auth, formData.email,formData.password)
            const user = loggedInCredential.user
            console.log(user.uid)
            localStorage.setItem('uid', user.uid)
            localStorage.setItem('token', user.refreshToken)
            console.log('User logged In:', loggedInCredential.user);
            const docRef = doc(db, 'Users', user.uid);
            await updateDoc(docRef, { online: true });
            setTimeout(() => {
                navigator('/chat')
            },1000)              
        }catch(error){
            setCrendentialsError(true)
            
        }
    }



    return (
        <Grid container sx = {{height: '100vh', overflow: 'hidden'}}>
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                <Typography variant="h3" sx={{mt: 3}} align="center"> 
                    fChat
                </Typography>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', p: 4, mb: 5 }}>
                   
                    <Typography variant="h4" sx={{mt: 10, color: '#1876d2'}}>
                        Login 
                    </Typography>
                    
                    <form onSubmit={handleLogin} >
                        
                        <TextField label="Email" name = "email" type="email" required variant="outlined" fullWidth margin="normal" autoFocus value={formData.email} onChange = {handleChange}/>
                        <TextField label="Password" name = "password" required type="password" variant="outlined" fullWidth margin="normal" autoFocus value={formData.password} onChange={handleChange}/>
                      

                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                            <Link to="/forgotpassword">Forgot Password?</Link>
                        </Box>

                        {credentialsError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Invalid Credentials. Please try again
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Button variant="contained" color="primary" sx={{ mt: 2 }} type="submit">
                                Let's Chat 
                            </Button>
                        </Box>
                    </form>
                    <Typography variant="h6" sx={{mt: 3}}>
                        Don't have an Account? <Link to ="/signup"> Sign Up </Link>
                    </Typography>
                 </Box>
                 
            </Grid>

            <Grid item sm = {4} md={7} 
                sx = {{
                    backgroundColor: '#1876d2',
                    height: '100vh' 
                }}
            />

        </Grid>

    )
}