
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";


export const AppContext = createContext();

const AppContextProvider = (props) =>{
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState(null);
    
    //these are created for all the components to get access
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);
    

    //1)Data Of All Users from "users" Collection Saved Here
    const loadUserData = async(uid) => {
        try{
            const userRef = doc(db, 'users', uid); 
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            //console.log(userData);
            setUserData(userData);

            //if avatar and name available,then navigate the user to chat page
            //if not available navigate the user to profileUpdate page
            if(userData.avatar && userData.name){ 
                navigate('/chat');
            }
            else{
                navigate('/profile');
            }
    
            //if the user is authenticated and online,update the last seen at
            //every 60secs
            await updateDoc(userRef, {
                lastSeen: Date.now()
            })
            setInterval(async()=>{
                if(auth.chatUser){
                    await updateDoc(userRef, {
                        lastSeen: Date.now()
                    })
                }
            }, 60000);
        }
        catch(error){
            console.log(error);
        }
    }




    //2)Loading Chat Data
    useEffect(()=>{
        if(userData){
            const chatRef = doc(db, "chats", userData.id); //getting chats collection of the user who is loggedIn
            const unSub = onSnapshot(chatRef, async(res)=>{
                const chatItems = res.data().chatsData;
                const tempData = [];
                for(const item of chatItems){
                    const userRef = doc(db, 'users', item.rId); //rId=>receivers id
                    const userSnap = await getDoc(userRef);
                    const userData = userSnap.data();
                    tempData.push({...item, userData}); //users data with rId is
                }                                 //also saved inside chatData
                setChatData(tempData.sort((a,b)=> b.updatedAt - a.updatedAt));//to keep the recent chat at the top
            })

            return ()=>{
                unSub();
            }
        }
    },[userData]);



    
    const value= {
        userData, setUserData, chatData, setChatData,
        loadUserData,
        messagesId, setMessagesId,
        messages, setMessages,
        chatUser, setChatUser,
        chatVisible, setChatVisible
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider;
