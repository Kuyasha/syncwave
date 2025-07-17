
import React, { useContext, useState, useEffect } from 'react';
import './ChatBox.css';
import assets from '../../assets/assets';
import {AppContext} from '../../context/AppContext';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import upload from '../../lib/upload';
import { toast } from 'react-toastify';


const ChatBox = () =>{
    const {userData,messagesId,chatUser,messages,setMessages, chatVisible,setChatVisible} = useContext(AppContext);
    const [input, setInput] = useState("");

    
    //1)SEND MESSAGE FUNCTION
    const sendMessage = async()=>{
        try{
            if(input && messagesId){

                await updateDoc(doc(db, 'messages', messagesId), {
                    messages: arrayUnion({
                        sId: userData.id, //user who loggedIn or sending the msg
                        text: input,
                        createdAt: new Date()
                    })
                });
                
                //Whenever we send any msg,we will update the lastMessage property
                //of 'chats' collection of both the users. 
                const userIDs = [chatUser.rId, userData.id];//both user's userIds are saved
                userIDs.forEach(async(id) =>{
                    const userChatsRef = doc(db, 'chats', id);
                    const userChatsSnapshot = await getDoc(userChatsRef);

                    if(userChatsSnapshot.exists()){
                        const userChatData = userChatsSnapshot.data();
                        const chatIndex = userChatData.chatsData.findIndex((c)=>c.messageId === messagesId);
                        userChatData.chatsData[chatIndex].lastMessage = input.slice(0,30);
                        userChatData.chatsData[chatIndex].updatedAt = Date.now();
                        if(userChatData.chatsData[chatIndex].rId === userData.id){
                            userChatData.chatsData[chatIndex].messageSeen = false;
                        }
                        await updateDoc(userChatsRef,{
                            chatsData : userChatData.chatsData
                        })
                    }
                })
            }
        }
        catch(error){
            toast.error(error.message);
        }
        setInput("");
    }
    

    //2)SEND IMAGE FUNCTION
    const sendImage = async(e) =>{
        try{
            const fileUrl = await upload(e.target.files[0]);
            if(fileUrl && messagesId){
                
                await updateDoc(doc(db, 'messages', messagesId), {
                    messages: arrayUnion({
                        sId: userData.id,
                        image: fileUrl,
                        createdAt: new Date()
                    })
                })
                
                //Whenever we send any image,we will update the lastMessage property
                //of 'chats' collection of both the users.
                const userIDs = [chatUser.rId, userData.id];
                userIDs.forEach(async(id) =>{
                    const userChatsRef = doc(db, 'chats', id);
                    const userChatsSnapshot = await getDoc(userChatsRef);

                    if(userChatsSnapshot.exists()){
                        const userChatData = userChatsSnapshot.data();
                        const chatIndex = userChatData.chatsData.findIndex((c)=>c.messageId === messagesId);
                        userChatData.chatsData[chatIndex].lastMessage = "Image";
                        userChatData.chatsData[chatIndex].updatedAt = Date.now();
                        if(userChatData.chatsData[chatIndex].rId === userData.id){
                            userChatData.chatsData[chatIndex].messageSeen = false;
                        }
                        await updateDoc(userChatsRef,{
                            chatsData : userChatData.chatsData
                        })
                    }
                })
            }
        }
        catch(error){
            toast.error(error.message);
        }
    }


    //3)CONVERTING TIMESTAMP FUNCTION
    const convertTimestamp = (timestamp) => {
        let date = timestamp.toDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        if(hour>12){
            return hour-12 + ":" + minute + "PM";
        }else{
            return hour + ":" + minute + "AM";
        }
    }


    //4)For messages to load on the chatbox
    //Here we are taking realtime update of messages from 'messages' collection
    //using Firebase listeners onSnapshot fn 
    useEffect(()=>{
        if(messagesId){
            const unSub = onSnapshot(doc(db, "messages", messagesId), (res)=>{
                setMessages(res.data().messages.reverse());
                //messages.map((msg,index)=>{
                //    console.log(msg.text);
                //}) 
            })
            return () => {
                unSub();
            }
        }
    },[messagesId]); 
    
    

    //If chatUser is available(means if we click on any chat) then only chatBox
    //section will be visible, else chat-welcome is shown 
    return chatUser ? 
    (
        <div className = {`chat-box ${chatVisible?"":"hidden"}`}>
            {/* NAVBAR of CHAT BOX */} 
            <div className='chat-user'>
                <img src={chatUser.userData.avatar?chatUser.userData.avatar:assets.avatar_icon} alt=""/>
                <p>{chatUser.userData.name}
                    {Date.now()-chatUser.userData.lastSeen <= 70000 ? <img className='dot' src={assets.green_dot} alt=""/> : null}
                </p>
                <img src={assets.help_icon} className='help' alt="" />
                <img onClick={()=>setChatVisible(false)} src={assets.arrow_icon} className='arrow' alt="" />
            </div>

            {/* MIDDLE SECTION => CHAT MSG OF CHAT BOX */}
            <div className='chat-msg'> 
                {messages.length === 0
                ? <p>No messages yet</p>
                : messages.map((msg,index) => (
                    <div key={index} className={msg.sId === userData.id ? "s-msg" : "r-msg"}> 
                        {msg["image"]
                        ? <img src={msg.image} className="msg-img" alt="" />
                        : <p className='msg'>{msg.text}</p>
                        }
                        <div>
                            <img src={msg.sId===userData.id?userData.avatar?userData.avatar:assets.avatar_icon : chatUser.userData.avatar?chatUser.userData.avatar:assets.avatar_icon} alt=""/>
                            <p>{convertTimestamp(msg.createdAt)}</p>
                        </div>
                    </div>
                ))} 
            </div> 

            {/* FOOTER of CHAT BOX */}
            <div className='chat-input'>
                <input onChange={(e)=>setInput(e.target.value)} value={input} type="text" placeholder='Send a message'/>
                <input onChange={sendImage} type="file" id="image" accept='image/png, image/jpeg, image/jpg' hidden/>
                <label htmlFor="image">
                    <img src={assets.gallery_icon} alt="" />
                </label>
                <img onClick={sendMessage} src={assets.send_button} alt=""/>
            </div>
        </div>
    )

    :
    //Chat-Welcome section when chatUser not available
    <div className={`chat-welcome ${chatVisible?"":"hidden"}`}>
        <img src={assets.logo_icon} alt ="" />
        <p>Chat anytime, anywhere</p>
    </div>
}

export default ChatBox;

