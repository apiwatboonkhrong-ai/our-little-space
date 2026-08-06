import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import "./Chat.css";

function Chat({ user, onBack }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const chatQuery = query(
      collection(db, "chatMessages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      chatQuery,
      (snapshot) => {
        const messages = snapshot.docs.map((messageDocument) => ({
          id: messageDocument.id,
          ...messageDocument.data(),
        }));

        setChatMessages(messages);
        setError("");
      },
      (firebaseError) => {
        console.error("โหลดแชตไม่สำเร็จ:", firebaseError);
        setError("โหลดข้อความไม่สำเร็จ ลองรีเฟรชอีกครั้งนะ");
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatMessages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const cleanMessage = messageText.trim();

    if (!cleanMessage || sending) {
      return;
    }

    try {
      setSending(true);
      setError("");

      await addDoc(collection(db, "chatMessages"), {
        text: cleanMessage,
        senderUid: user.uid,
        senderName: user.nickname,
        senderEmail: user.email,
        createdAt: serverTimestamp(),
      });

      setMessageText("");
      textareaRef.current?.focus();
    } catch (firebaseError) {
      console.error("ส่งข้อความไม่สำเร็จ:", firebaseError);
      setError("ส่งข้อความไม่สำเร็จ ลองอีกครั้งนะ");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (message) => {
    if (message.senderUid !== user.uid) {
      return;
    }

    const confirmed = window.confirm(
      "ต้องการลบข้อความนี้จริง ๆ ใช่ไหม?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(message.id);
      setError("");

      await deleteDoc(doc(db, "chatMessages", message.id));
    } catch (firebaseError) {
      console.error("ลบข้อความไม่สำเร็จ:", firebaseError);
      setError("ลบข้อความไม่สำเร็จ");
    } finally {
      setDeletingId("");
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp?.toDate) {
      return "กำลังส่ง...";
    }

    return new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp.toDate());
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp?.toDate) {
      return "";
    }

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(timestamp.toDate());
  };

  const shouldShowDate = (currentMessage, previousMessage) => {
    if (!currentMessage?.createdAt?.toDate) {
      return false;
    }

    if (!previousMessage?.createdAt?.toDate) {
      return true;
    }

    const currentDate =
      currentMessage.createdAt.toDate().toDateString();

    const previousDate =
      previousMessage.createdAt.toDate().toDateString();

    return currentDate !== previousDate;
  };

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <button
            className="chat-back-button"
            type="button"
            onClick={onBack}
            aria-label="กลับหน้าหลัก"
          >
            ←
          </button>

          <div className="chat-header-avatar">💗</div>

          <div className="chat-header-text">
            <h1>แชตของเรา</h1>
            <p>คุยกันได้แบบเรียลไทม์</p>
          </div>

          <div className="chat-online-status">
            <span />
            ออนไลน์
          </div>
        </header>

        <section className="chat-content">
          {chatMessages.length === 0 ? (
            <div className="empty-chat">
              <span>💌</span>
              <h2>ยังไม่มีข้อความ</h2>
              <p>เริ่มส่งข้อความแรกถึงกันได้เลย</p>
            </div>
          ) : (
            chatMessages.map((message, index) => {
              const isMine = message.senderUid === user.uid;
              const previousMessage = chatMessages[index - 1];
              const showDate = shouldShowDate(
                message,
                previousMessage
              );

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="chat-date-divider">
                      <span>
                        {formatMessageDate(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`chat-message-row ${
                      isMine ? "mine" : "theirs"
                    }`}
                  >
                    {!isMine && (
                      <div className="chat-avatar">
                        {message.senderName?.charAt(0) || "♡"}
                      </div>
                    )}

                    <div className="chat-message-area">
                      {!isMine && (
                        <span className="chat-sender-name">
                          {message.senderName || "คนสำคัญ"}
                        </span>
                      )}

                      <div className="chat-bubble">
                        <p>{message.text}</p>

                        <div className="chat-message-bottom">
                          <span>
                            {formatMessageTime(message.createdAt)}
                          </span>

                          {isMine && (
                            <button
                              className="delete-chat-button"
                              type="button"
                              title="ลบข้อความ"
                              disabled={deletingId === message.id}
                              onClick={() =>
                                handleDeleteMessage(message)
                              }
                            >
                              {deletingId === message.id
                                ? "…"
                                : "×"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </section>

        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}

        <form
          className="chat-input-area"
          onSubmit={handleSendMessage}
        >
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(event) =>
              setMessageText(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                handleSendMessage(event);
              }
            }}
            placeholder="พิมพ์ข้อความ..."
            rows="1"
            maxLength={1000}
            disabled={sending}
          />

          <button
            className="send-chat-button"
            type="submit"
            disabled={!messageText.trim() || sending}
            aria-label="ส่งข้อความ"
          >
            {sending ? "…" : "➤"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Chat;
