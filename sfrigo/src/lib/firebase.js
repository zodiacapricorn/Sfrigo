import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "LA_TUA_API_KEY",
  authDomain: "TUO_PROGETTO.firebaseapp.com",
  projectId: "TUO_PROGETTO",
  storageBucket: "TUO_PROGETTO.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);