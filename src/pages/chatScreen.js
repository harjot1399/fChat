import React, { useState, useEffect, useRef} from 'react';
import { 
  Box, 
  TextField, 
  Divider, 
  List, 
  ListItem,
  ListItemText, 
  InputAdornment,
  IconButton,
  Avatar,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { addDoc, collection, getDocs, Timestamp, setDoc, doc, updateDoc, deleteDoc, onSnapshot, getDoc, query, where, orderBy, runTransaction} from 'firebase/firestore';
import {db, auth} from "../firebase"
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Construction, NoiseAwareOutlined, Transcribe } from '@mui/icons-material';

export function ChatScreen() {
  
  const loggedInID = localStorage.getItem('uid')
  const [randomUser, setRandomUser] = useState("")
  const [randomUserName, setRandomUserName] = useState("")
  const [activeChatId, setActiveChatId] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [noUsersFound, setNoUsersFound] = useState(false);
  const [findingMatch, setFindingMatch] = useState(true); 
  const navigator = useNavigate()
  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    const initiateSearch = async () => {
      await addToQueue();
      startMatching();
    };

    initiateSearch();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };

  }, []);


  useEffect(() => {
    if (activeChatId) {
      const messagesRef = collection(db, 'Chats', activeChatId, 'Messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp'));

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          text: doc.data().content,
          sender: doc.data().sender,
          timestamp: doc.data().timestamp,
        }));
        setMessages(newMessages.sort((a, b) => a.timestamp - b.timestamp));
      });

      return () => unsubscribe();
    } else {
      const unsubscribe = onSnapshot(collection(db, 'Chats'), (snapshot) => {
        snapshot.docChanges().forEach( async (change) => {
          if (change.type === 'added') {
            const newChat = change.doc.data();
            if (newChat.participants.includes(loggedInID)) {
              setActiveChatId(change.doc.id);
              const matchedUserId = newChat.participants.find(id => id !== loggedInID);
              setRandomUser(matchedUserId);
            
              
              const randomDoc = doc(db, 'Users', matchedUserId); 
            
              const docSnap = await getDoc(randomDoc);
              if (docSnap.exists()) {
                setRandomUserName(docSnap.data().username);
              } else {
                console.log("No user found");
              }
            
              setFindingMatch(false);
              if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
              }
            }
          }
        });
      });
      return () => unsubscribe();

    }
  }, [activeChatId, loggedInID]); 


  const addToQueue = async () => {
    try {
      const queueRef = collection(db, 'JoinQueue');
      const existingUserQuery = query(queueRef, where('userId', '==', loggedInID));
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (existingUserSnapshot.empty) {
        await addDoc(queueRef, { userId: loggedInID, timestamp: Timestamp.now()});
      }
      setFindingMatch(true)
    } catch (error) {
      console.log(error);
    }
  };

  const startMatching = () => {
    retryTimeoutRef.current = setTimeout(() => {
      if (!activeChatId) {
        removeFromQueue(); 
        setFindingMatch(false);
        setNoUsersFound(true);
        console.log("The problem is happening here for the first time")
      }
    }, 15000);
  };

  const deleteChatSession = async (chatId) => {
    try {
      const messagesRef = collection(db, 'Chats', chatId, 'Messages');
      const messagesSnapshot = await getDocs(messagesRef);
      messagesSnapshot.forEach(async (messageDoc) => {
        await deleteDoc(messageDoc.ref);
      });
      const chatRef = doc(db, 'Chats', chatId);
      await deleteDoc(chatRef);
      setActiveChatId("");
    } catch (error) {
        console.error('Error deleting chat:', error);
    }
  };

  const removeFromQueue = async () => {
    try {
      const queueRef = collection(db, 'JoinQueue');
      const existingUserQuery = query(queueRef, where('userId', '==', loggedInID));
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        const userDocRef = existingUserSnapshot.docs[0].ref;
        await deleteDoc(userDocRef);
      }
    } catch (error) {
      console.log(error);
    }
  };




  const addMessageToChatSession = async () => {
    try {
      if (message.length !== 0 && activeChatId){
        const messageRef = await addDoc(collection(db, 'Chats', activeChatId, 'Messages'), {
          sender: loggedInID,
          content: message,
          timestamp: Timestamp.now()
        });
        console.log('Message added with ID:', messageRef.id);
        await setDoc(doc(db, 'Chats', activeChatId), {
            lastMessageAt: Timestamp.now()
        }, { merge: true });
        setMessage("")
      }
     
    } catch (error) {
        console.error('Error adding message:', error);
        throw error;
    }

  }

  const handleNextButtonClick = async () => {
    if (activeChatId){
      await deleteChatSession(activeChatId)

    }
    setFindingMatch(true);
    setNoUsersFound(false);
    await addToQueue();
    startMatching();
  };

  const handleLogOut = async () =>{
    try{
      if (activeChatId){
        deleteChatSession(activeChatId)
      }
      await signOut(auth)
      localStorage.removeItem('token')
      localStorage.removeItem('uid')
      const docRef = doc(db, 'Users', loggedInID);
      await updateDoc(docRef, { online: false });
      setTimeout(() => {
        navigator('/')
      },1000)         
    }catch(error){
      console.log(error)
    }
  }


  

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {findingMatch ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.8)', 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw'
        }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {noUsersFound ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              flexDirection: 'column',
              height: '100vh' 
            }}>
              <Typography variant="h6" align="center">No users available to chat with.</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }} 
                onClick={handleNextButtonClick}
              >
                Retry
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }} 
                onClick={handleLogOut}
              >
                Logout
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar alt="User Name" src="/path-to-avatar.jpg" /> 
                  <Typography variant="h6" sx={{ ml: 2 }}>{randomUserName}</Typography>
                </Box>
                <Button variant="contained" color="primary" onClick={handleNextButtonClick}>
                  Next
                </Button>
              </Box>
              <Divider />
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}> 
                <List>
                  {messages.map((message, index) => (
                    <ListItem key={index} sx={{ display: 'block' }}> 
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: message.sender === loggedInID ? 'flex-end' : 'flex-start',
                          width: '100%',
                        }}
                      >
                        <ListItemText
                          primary={message.text}
                          sx={{
                            textAlign: message.sender === loggedInID ? 'right' : 'left',
                            maxWidth: '30%', 
                            backgroundColor: message.sender === loggedInID ? '#DCF8C6' : '#EEE',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            marginBottom: 1,
                            wordBreak: 'break-word', 
                            overflowWrap: 'break-word',
                          }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
              <Divider />
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}> 
                <TextField
                  label="Type your message..."
                  variant="outlined"
                  fullWidth
                  onChange={(event) => setMessage(event.target.value)}
                  value={message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton color="primary" onClick={addMessageToChatSession}>
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton color="inherit" onClick={handleLogOut} >
                  <LogoutIcon />
                </IconButton>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}

// Codingislidh1!