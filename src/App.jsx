import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Memories from "./pages/Memories";
import Together from "./pages/Together";
import Messages from "./pages/Messages";
import Preferences from "./pages/Preferences";
import Chat from "./pages/Chat";

const NICKNAMES = {
  "torte@example.com": "โต๋เต๋",
  "mudeng@example.com": "หมูเด้ง",
};

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nickname:
              NICKNAMES[firebaseUser.email] || "คนสำคัญ",
          });
        } else {
          setUser(null);
          setCurrentPage("home");
        }

        setCheckingAuth(false);
      }
    );

    return unsubscribe;
  }, []);

  if (checkingAuth) {
    return <h2>กำลังโหลด...</h2>;
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  switch (currentPage) {
    case "memories":
      return (
        <Memories
          user={user}
          onBack={() => setCurrentPage("home")}
        />
      );

    case "together":
      return (
        <Together
          onBack={() => setCurrentPage("home")}
        />
      );

    case "messages":
      return (
        <Messages
          user={user}
          onBack={() => setCurrentPage("home")}
        />
      );

    case "preferences":
      return (
        <Preferences
          user={user}
          onBack={() => setCurrentPage("home")}
        />
      );

    case "chat":
      return (
        <Chat
          user={user}
          onBack={() => setCurrentPage("home")}
        />
      );

    default:
      return (
        <Home
          user={user}
          onOpenMemories={() =>
            setCurrentPage("memories")
          }
          onOpenTogether={() =>
            setCurrentPage("together")
          }
          onOpenMessages={() =>
            setCurrentPage("messages")
          }
          onOpenPreferences={() =>
            setCurrentPage("preferences")
          }
          onOpenChat={() =>
            setCurrentPage("chat")
          }
        />
      );
  }
}

export default App;
