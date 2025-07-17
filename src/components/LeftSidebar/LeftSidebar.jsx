import React, { useContext, useState, useEffect } from 'react';
import './LeftSidebar.css';
import assets from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';


const LeftSidebar = () => {
    const navigate = useNavigate();
    const { userData, chatData, chatUser, setChatUser, setMessagesId, messagesId, chatVisible, setChatVisible } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false);


    //1)INPUT HANDLER FN
    const inputHandler = async (e) => {
        try {
            const input = e.target.value;
            if (input) {
                setShowSearch(true);
                const userRef = collection(db, 'users');
                const q = query(userRef, where("username", "==", input.toLowerCase())); //where username from users collection matches input field
                const querySnap = await getDocs(q); //fetch the document related to this query
                
                if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) //if querySnap is not empty & id is not of the same user who is logged in
                {
                    //console.log(querySnap.docs[0].data());
                    let userExist = false;
                    chatData.map((user) => {//if user = searching user,then userExist=true
                        if (user.rId === querySnap.docs[0].data().id) {
                            userExist = true;
                        }
                    });
                    if (!userExist) { //if we find any user by searching,and that user not already exists
                        setUser(querySnap.docs[0].data());//then save that user inside setUser                 
                    }
                }
                else { //when we dont get any user
                    setUser(null);
                }
            }
            else { //when we not entered any input field
                setShowSearch(false);
            }
        }
        catch (error) {
            console.log(error);
        }
    }



    //2)ADD CHAT FN
    //(If we find any user by searching on SearchBar and click on that user,
    //that user will be added in the chatsData. chatsData(firebase) of both the
    //user will be updated with new entries. And inside "messages" collection
    //empty messages array with createAt() property is created)
    const addChat = async () => {
        //PART-1
        //messages collection is created
        const messagesRef = collection(db, "messages");
        const chatsRef = collection(db, "chats");
        try {
            const newMessageRef = doc(messagesRef);
            await setDoc(newMessageRef, {
                createAt: serverTimestamp(),
                messages: []
            });

            //console.log(user.name);  //searched user
            //console.log(userData.name); //loggedIn user

            //Updating chatsData of another user(searched user)
            await updateDoc(doc(chatsRef, user.id), {  
                //creating new entry at chatsData
                chatsData: arrayUnion({
                    messageId: newMessageRef.id,
                    lastMessage: "",  //whenever two users is chatting then the received msg is stored in the last msg
                    rId: userData.id,
                    updatedAt: Date.now(),
                    messageSeen: true //bydefault true
                })
            });
            //Updating chatsData of loggedIn user 
            await updateDoc(doc(chatsRef, userData.id), {
                //creating new entry at chatsData
                chatsData: arrayUnion({
                    messageId: newMessageRef.id,
                    lastMessage: "",  //whenever two users is chatting then the received msg is stored in the last msg
                    rId: user.id,
                    updatedAt: Date.now(),
                    messageSeen: true //bydefault true
                })
            });
            
            
            // PART-2
            //When we searched for any user and click on that user,
            //that user will be added in the chat-list,and it will also open the chatBox
            const uSnap = await getDoc(doc(db,"users", user.id));
            const uData = uSnap.data();
            //setChat() fn is called here
            setChat({
                messagesId: newMessageRef.id,
                lastMessage: "",
                rId: user.id,
                updatedAt: Date.now(),
                messageSeen: true,
                userData: uData//here user(searched user) is saved inside userData
            });
            setShowSearch(false);
            setChatVisible(true);
        }
        catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    }



    //3)TO SET CHAT INFORMATION AT CHATBOX
    const setChat = async (item) => {
        try {
            //console.log(item); //when we click on any item at chat-list of leftSidebar
            setMessagesId(item.messageId);
            setChatUser(item);

            //When we open the msg,messageSeen property should be true
            // After reloading, seen msg property should be gone
            const userChatsRef = doc(db, 'chats', userData.id); //loggedIn user
            const userChatsSnapshot = await getDoc(userChatsRef);
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === item.messageId);
            userChatsData.chatsData[chatIndex].messageSeen = true;
            await updateDoc(userChatsRef, {
                chatsData: userChatsData.chatsData
            });
            setChatVisible(true);     
        }
        catch (error) {
            toast.error(error.message);
        }
    }

    
    //4)Update the chatUserData whenever the chatData will be updated
    useEffect(()=>{
        const updateChatUserData = async()=>{
            if(chatUser){
                const userRef = doc(db, "users", chatUser.userData.id);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                setChatUser(prev=>({...prev, userData:userData}));
            }
        } 
        updateChatUserData();
    },[chatData]);


    return (
        <div className={`ls ${chatVisible ? "hidden" : ""}`}>
            {/* NAV AND SEARCH BAR OF LEFT-SIDEBAR */}
            <div className='ls-top'>
                <div className='ls-nav'>
                    <div className='logo-title'>
                        <img src={assets.logo_icon} className="logo" alt="" />
                        <h3>syncwave</h3>
                    </div>
                    <div className="menu">
                        <img src={assets.menu_icon} alt="" />
                        <div className='sub-menu'>
                            <p onClick={() => navigate('/profile')}>Edit Profile</p>
                            <hr />
                            <p>Logout</p>
                        </div>
                    </div>
                </div>
                <div className="ls-search">
                    <img src={assets.search_icon} alt="" />
                    <input onChange={inputHandler} type="text" placeholder="Search here.." />
                </div>
            </div>

            {/* LIST OF LEFT SIDEBAR */}
            <div className='ls-list'>
                {showSearch && user //when showSearch is true and user is available
                    ? <div onClick={addChat} className='friends add-user'>
                        <img src={user.avatar ? user.avatar : assets.avatar_icon} alt="" />
                        <p>{user.name}</p>
                    </div>
                    :
                    chatData.map((item, index) => (                                        //to boldering the unseen messages
                        <div onClick={() => setChat(item)} key={index} className={`friends ${item.messageSeen || item.messageId === messagesId ? "" : "border"}`}>
                            <img src={item.userData.avatar ? item.userData.avatar : assets.avatar_icon} alt="" />
                            <div>
                                <p>{item.userData.name}</p>
                                <span>{item.lastMessage}</span>
                            </div>
                        </div>
                    ))
                }
            </div>

        </div>
    )
}

export default LeftSidebar;