import { Grid, Alert } from "@mui/material";
import React from "react";
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PasswordValidator from "password-validator";
import { Link , useNavigate} from 'react-router-dom';
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from "react";
import { doc, setDoc } from 'firebase/firestore';

export function SignUpPage() {

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const schema = new PasswordValidator();
    schema
    .is().min(8)
    .has().uppercase()                              
    .has().lowercase()                              
    .has().digits(1) 

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const [passwordError, setPasswordError] = useState(false)
    const [passwordStrengthErrors, setPasswordStrengthErrors] = useState([]);

    const navigator = useNavigate()

    const passwordCheck = () =>{
        return formData.password === formData.confirmPassword;
    }

    const createAccount = async (event) => {
        event.preventDefault();

        setPasswordStrengthErrors([]);
        setPasswordError(false);
        
        
        if (passwordCheck()){
            const validationErrors = schema.validate(formData.password, { list: true }); 

            const customErrorMessages = validationErrors.map(error => {
                switch (error) {
                    case "min":
                    return "Password must be at least 8 characters long.";
                    case "uppercase":
                    return "Password must contain at least one uppercase letter.";
                    case "lowercase":
                    return "Password must contain at least one lowercase letter.";
                    case "digits":
                    return "Password must contain at least one digit.";
                    default:
                    return "Password does not meet the requirements."; 
                }
                });
            if (customErrorMessages.length === 0) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                    const user = userCredential.user

                    await setDoc(doc(db, "Users", user.uid), {
                        username: formData.username,
                        chatActive: false,
                        online: false,
                        findingMatch: false
                    });

                    setTimeout(() => {
                        navigator('/')
                    },1000)                
                }catch(error){
                    console.log(error)
                }
            } else {
                setPasswordStrengthErrors(customErrorMessages); // Set the errors
            }
        } else {
            setPasswordError(true)
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
                        Sign Up
                    </Typography>
                    
                    <form onSubmit={createAccount}>
                        
                        <TextField label="Email" name = "email" type="email" required variant="outlined" fullWidth margin="normal" autoFocus onChange={handleChange} value={formData.email}/>
                        <TextField label="Username" name ="username" required variant="outlined" fullWidth margin="normal" autoFocus onChange={handleChange} value={formData.username}/>
                        <TextField label="Password" name = "password" required type="password" variant="outlined" fullWidth margin="normal" autoFocus onChange={handleChange} value={formData.password}/>
                        <TextField label="Confirm Password" name = "confirmPassword" required type="password" variant="outlined" fullWidth margin="normal" autoFocus onChange={handleChange} value={formData.confirmPassword}/>

                        {passwordStrengthErrors.map((error, index) => (
                            <Alert key={index} severity="error" sx={{ mt: 1 }}>
                                {error} 
                            </Alert>
                        ))}
                        {passwordError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Passwords do not match.
                            </Alert>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Button variant="contained" color="primary" sx={{ mt: 2 }} type="submit">
                                Create Account
                            </Button>
                        </Box>
                    </form>
                    <Typography variant="h6" sx={{mt: 3}}>
                        Already have an account <Link to = "/"> Log In </Link>
                    </Typography>
                 </Box>
                 
            </Grid>

        </Grid>

    )
}