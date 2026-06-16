import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD3GvHO4kVPbs5pNYfhL8DdXhhXuuQXuZo",
    authDomain: "lawbot-49b18.firebaseapp.com",
    projectId: "lawbot-49b18",
    storageBucket: "lawbot-49b18.firebasestorage.app",
    messagingSenderId: "494531810474",
    appId: "1:494531810474:web:e447c0573231f5a251ecd3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);