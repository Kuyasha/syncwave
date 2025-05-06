
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, setDoc, doc, query, where, getDocs, collection } from "firebase/firestore";
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyAzIxHnaz7o1v-5RLpJ-jIrc5Ms_xUVhI8",
  authDomain: "syncwave-b296a.firebaseapp.com",
  projectId: "syncwave-b296a",
  storageBucket: "syncwave-b296a.firebasestorage.app",
  messagingSenderId: "530758349624",
  appId: "1:530758349624:web:52748ff28649e68412c7cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);






// START WRITING CODE FROM HERE 
const auth = getAuth(app);
const db = getFirestore(app);


//1)Sign-Up fn
const signup = async(username, email, password) => {
    try{
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;

        //creating users collection
        await setDoc(doc(db, "users", user.uid), {
            //this object is stored inside users collection
            id: user.uid,
            username: username.toLowerCase(),
            email:email,
            name: "",
            avatar: "",
            bio: "Hey, There I am using syncwave chat",
            lastSeen: Date.now()
        });

        //creating chats collection
        await setDoc(doc(db, "chats", user.uid), {
            chatsData: []  //this object stored at chats collection
        });
        toast.success('Signup successful!');
    }
    catch(error){
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));
    }
}

//2)Login Fn
const login = async(email, password) =>{
    try{
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Login successful!');
    }
    catch(error){
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));
    }
}

//3)Logout Fn
const logout = async() =>{
    try{
        await signOut(auth);
    }
    catch(error){
        console.error(error);
        toast.error(error.code.split('/')[1].split('-').join(" "));
    }  
}

//4)Reset Password
const resetPass = async(email) => {
    if(!email){
        toast.error("Enter your email");
        return null;
    }
    try{
        const userRef = collection(db, 'users');
        const q = query(userRef, where("email", "==", email));
        const querySnap = await getDocs(q);
        if(!querySnap.empty){
            await sendPasswordResetEmail(auth, email);
            toast.success("Reset Email Sent");
        }
        else{ //when there's no user with this email
            toast.error("Email doesn't exists");
        }
    }
    catch(error){
        console.error(error);
        toast.error(error.message);
    }
}


export {signup, login, logout, auth, db, resetPass};
