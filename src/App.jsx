import React, {useContext, useEffect} from 'react';
import {Routes, Route, useNavigate} from 'react-router-dom';
import Login from './pages/Login/Login';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { AppContext } from './context/AppContext';


const App = () =>{
  const navigate = useNavigate();
  const {loadUserData} = useContext(AppContext);

  
  //using this when the authentication state is changing,then we can 
  //navigate from one page to another 
  useEffect(()=>{
    onAuthStateChanged(auth, async(user)=>{
      if(user){
        navigate('/chat') //when user logged in navigate to chat page
        await loadUserData(user.uid);
      }
      else{
        navigate('/') //login page
      }
    })
  },[]);  


  
  return(
    <>
    <ToastContainer />
    <Routes>
      <Route path ='/' element={<Login />} />
      <Route path ='/chat' element={<Chat />} />
      <Route path ='/profile' element={<ProfileUpdate />} />
    </Routes>
    </>
  )
}

export default App;
