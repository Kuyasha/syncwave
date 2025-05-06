import React, { useContext, useEffect, useState } from 'react';
import './RightSidebar.css';
import assets from '../../assets/assets';
import { logout } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';


const RightSidebar = () =>{
    
    const {chatUser, messages} = useContext(AppContext);
    const [msgImages, setMsgImages] = useState([]); //created for Media section

    useEffect(()=>{
        let tempVar = [];
        messages.map((msg)=>{
            if(msg.image){
                tempVar.push(msg.image);
            }
        })
        //console.log(tempVar);
        setMsgImages(tempVar);
    },[messages]);


    //chatUser.userData => chatting User
    return chatUser ? (
        <div className="rs"> 
            <div className="rs-profile">
                <img  src={chatUser.userData.avatar?chatUser.userData.avatar:assets.avatar_icon} alt=""/>                   
                <h3>{chatUser.userData.name}
                    {/*//if user is online within last 70secs then display green dot,else not.
                    //As we have set lastSeen property in "users" collection to get updated at every 60secs inside loadUserData() fn of AppContext */}
                    {Date.now()-chatUser.userData.lastSeen <= 70000 ? <img className='dot' src={assets.green_dot} alt=""/> : null}
                </h3>
                <p>{chatUser.userData.bio}</p>
            </div>

            <hr/>

            <div className='rs-media'>
                <p>Media</p>
                <div>
                    {msgImages.map((url,index)=>(
                        <img onClick={()=>window.open(url)} key={index} src={url} alt=""/>
                    ))}
                </div>
            </div>

            <button onClick={()=>logout()}>Logout</button>
        </div>
    )
    : (
        <div className='rs'>
            <button onClick={()=>logout()}>Logout</button>
        </div>
    )
}

export default RightSidebar;