import React, { useState, useEffect } from 'react';
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
  Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { addDoc, collection, getDocs, Timestamp, setDoc, doc, updateDoc, deleteDoc, onSnapshot, getDoc, query, where, orderBy} from 'firebase/firestore';
import {db, auth} from "../firebase"
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export function ChatScreen() {
  
  const [users, setUsers] = useState([]);
  const loggedInID = localStorage.getItem('uid')
  const [randomUser, setRandomUser] = useState("")
  const [randomUserName, setRandomUserName] = useState("")
  const [activeChatId, setActiveChatId] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [lastMatchedUser, setLastMatchedUser] = useState(null);
  const [noUsersFound, setNoUsersFound] = useState(false);
  const navigator = useNavigate()

  useEffect(() => {
    const checkForUsers = async () => {
      try {
        await fetchUsersIdsExcluding();
        if (users.length === 0){
          setNoUsersFound(true)
        } else{
          startConversation()
        } // Update noUsersFound
      } catch (error) {
        console.error('Error checking for users:', error);
      }
    }

    checkForUsers();
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
    }
  }, [activeChatId]); 
  

  const fetchUsersIdsExcluding = async () => {
    try {
      const userCollection = collection(db, 'Users');
      const usersSnapshot = await getDocs(userCollection);
      const userIds = usersSnapshot.docs.filter(doc => {
        const data = doc.data();
        return doc.id !== loggedInID && doc.id !== lastMatchedUser && data.chatActive === false && data.online === true;
      }).map(doc => doc.id); // Extract the IDs after filtering

      setUsers(userIds)
    }catch(error){
      console.log(error)
    }
  }

  const getRandomUserIdExcluding = async () => {
    try {
        const randomIndex = Math.floor(Math.random() * users.length);
        const randomUserId = users[randomIndex];
        setRandomUser(randomUserId)
        return randomUserId; 
    } catch (error) {
        console.error('Error getting random user ID:', error);
        throw error;
    }
  };

  const deleteChatSession = async (chatId) => {
    try {
        const chatRef = doc(db, 'Chats', chatId);
        await deleteDoc(chatRef);
        console.log('Chat deleted with ID:', chatId);
    } catch (error) {
        console.error('Error deleting chat:', error);
    }
  };

  const startConversation = async () => {
    try {
      const newRandomUser = await getRandomUserIdExcluding();
      const randomDoc = doc(db, 'Users', newRandomUser);
      const docSnap = await getDoc(randomDoc);
      if (docSnap.exists()) {
        setRandomUserName(docSnap.data().username);
      }
  
      
      const existingChatQuery = query(collection(db, 'Chats'), where('participants', 'array-contains-any', [loggedInID, newRandomUser]));
      const existingChatSnapshot = await getDocs(existingChatQuery);
  
      let chatCollection;
      if (existingChatSnapshot.empty) {
        if (activeChatId) {
          await deleteChatSession(activeChatId);
        }
  
        const newParticipants = [loggedInID, newRandomUser];
  
        chatCollection = await addDoc(collection(db, 'Chats'), {
          participants: newParticipants,
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now()
        });
  
        setActiveChatId(chatCollection.id);
        setRandomUser(newRandomUser);
        setLastMatchedUser(newRandomUser);
      } else {
        // If an existing chat session is found, use its ID
        chatCollection = existingChatSnapshot.docs[0].ref;
        setActiveChatId(chatCollection.id);
        setRandomUser(newRandomUser);
        setLastMatchedUser(newRandomUser);
      }
    } catch (error) {
      console.log(error);
    }
  };
  

  const addMessageToChatSession = async () => {
    try {
      if (message.length !== 0){
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
    setNoUsersFound(false) // reset No User Found state
    await fetchUsersIdsExcluding()
    if(users.length > 0){
      startConversation()
    }else{
      setNoUsersFound(true)
    }
  };

  const handleLogOut = async () =>{
    try{
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
      {noUsersFound ? (
        <Box sx={{ 
          display: 'flex', // Enable flexbox layout
          justifyContent: 'center', // Center horizontally
          alignItems: 'center', // Center vertically
          flexDirection: 'column',
          height: '100vh' // Optional: Ensure the parent takes full viewport height
        }}>
          <Typography variant="h6" align="center">No users available to chat with.</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }} // Add some margin on top of the button
            onClick={handleNextButtonClick}
          >
            Retry
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }} // Add some margin on top of the button
            onClick={handleLogOut}
          >
            Logout
          </Button>
        </Box>
      ) : (
        <>
           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar alt="User Name" src="/path-to-avatar.jpg" /> {/* Add a path to the avatar image */}
              <Typography variant="h6" sx={{ ml: 2 }}>{randomUserName}</Typography>
            </Box>
            <Button variant="contained" color="primary" onClick={handleNextButtonClick}>
              Next
            </Button>
          </Box>
          <Divider /> {/* Visual separator */}

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}> {/* Message display area */}
            <List>
              {messages.map((message, index) => (
                <ListItem key={index} sx={{ display: 'block' }}> {/* Change to display: block */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: message.sender === loggedInID ? 'flex-end' : 'flex-start',
                      width: '100%', // Take full width of container
                    }}
                  >
                    <ListItemText
                      primary={message.text}
                      sx={{
                        textAlign: message.sender === loggedInID ? 'right' : 'left',
                        maxWidth: '30%', // Limit the width of the message bubbles
                        backgroundColor: message.sender === loggedInID ? '#DCF8C6' : '#EEE',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        marginBottom: 1,
                        wordBreak: 'break-word',  // <-- Add this for word wrapping
                        overflowWrap: 'break-word',
                      }}
                    />
                  </Box>
              </ListItem>
              ))}
          </List>
          </Box>
          <Divider /> {/* Visual separator */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}> {/* Input area */}
            <TextField
              label="Type your message..."
              variant="outlined"
              fullWidth
              onChange={(event) => setMessage(event.target.value)}
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
      </Box>     
  );
}