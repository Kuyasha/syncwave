import React, {useState, useEffect, useContext} from 'react';
import './ProfileUpdate.css';
import assets from '../../assets/assets';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import { AppContext } from '../../context/AppContext';


const ProfileUpdate = () =>{
    const [image, setImage] = useState(false);
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    
    const [uid, setUid] = useState("");
    const [prevImage, setPrevImage] = useState("");
    const navigate = useNavigate();

    //Getting from Context
    const {setUserData} = useContext(AppContext);



    //1)onSubmitHandler fn for the Profile Update form)
    const profileUpdate = async(event) => {
        event.preventDefault();
        try{
            if(!prevImage && !image){
                toast.error("Upload profile picture");
            }
            const docRef = doc(db, "users", uid);

            if(image){ //if user selected any img, upload that img using upload method and update document with avatar,bio,name
                const imgUrl = await upload(image);
                setPrevImage(imgUrl);
                await updateDoc(docRef,{
                    avatar: imgUrl,
                    bio: bio,
                    name: name
                })
            }
            else{ //if user not selected any image,update users collection with only bio and name
                await updateDoc(docRef,{
                    bio: bio,
                    name: name
                })
            }

            //sending setUserData to Context
            const snap = await getDoc(docRef);
            setUserData(snap.data());
            navigate('/chat');
            toast.success("Profile details updated");
        }
        catch(error){
            console.log(error);
            toast.error(error.message);
        }
    }

    
    //2)If these properties are available on the Profile page,then we will
    //get that on the chat page
    useEffect(()=>{
        onAuthStateChanged(auth, async(user)=>{
            if(user) //when user available(logged in)
            {
                setUid(user.uid);
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef); //retrieve all documents from users collection
                
                if(docSnap.data().name){
                    setName(docSnap.data().name);
                }
                if(docSnap.data().bio){
                    setBio(docSnap.data().bio);
                }
                if(docSnap.data().avatar){
                    setPrevImage(docSnap.data().avatar);
                }
            }
            else //when user not available(logged out)
            {
                navigate('/');
            }
        })
    },[]); 



    return(
        <div className='profile'>
            <div className='profile-container'>
                <form onSubmit={profileUpdate}>
                    <h3>Profile Details</h3>

                    <label htmlFor="avatar">
                        <input onChange={(e)=>setImage(e.target.files[0])} type="file" id="avatar" accept='.png, .jpg, .jpeg' hidden />
                        {/*if image is available then convert it to image from object,else view avatar icon */}
                        <img src={image ? URL.createObjectURL(image) : assets.avatar_icon} alt="" />
                        upload profile image
                    </label>

                    <input onChange={(e)=>setName(e.target.value)} value={name} type="text" placeholder='Your name' required />
                    <textarea onChange={(e)=>setBio(e.target.value)} value={bio} placeholder='Write profile bio' required/>
                    
                    <button type='submit'>Save</button>
                </form>

                <img className='profile-pic' src={image ? URL.createObjectURL(image) : prevImage ? prevImage : assets.logo_icon} alt="" />
            </div>
        </div>
    )
}

export default ProfileUpdate;



 


