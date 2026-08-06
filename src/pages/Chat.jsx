import { useEffect, useMemo, useRef, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp as firestoreServerTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp as realtimeServerTimestamp,
  set,
} from "firebase/database";

import {
  db,
  realtimeDb,
} from "../firebase/firebase";

import "./Chat.css";

const CHAT_ROOM_ID = "our-little-space";

function Chat({ user, onBack }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [partnerStatus, setPartnerStatus] = useState(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerReadAt, setPartnerReadAt] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /*
   * โหลดข้อความจาก Firestore
   */
  useEffect(() => {
    const chatQuery = query(
      collection(db, "chatMessages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      chatQuery,
      (snapshot) => {
        const messages = snapshot.docs
          .map((messageDocument) => ({
            id: messageDocument.id,
            ...messageDocument.data(),
          }))
          // ซ่อน document ทดสอบ temp ที่เคยสร้างไว้
          .filter((message) => typeof message.text === "string");

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

  /*
   * สถานะ Online / Offline
   * เวอร์ชันนี้หมายถึงกำลังเปิดหน้าแชตอยู่
   */
  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const connectedReference = ref(
      realtimeDb,
      ".info/connected"
    );

    const myStatusReference = ref(
      realtimeDb,
      `status/${user.uid}`
    );

    const allStatusesReference = ref(
      realtimeDb,
      "status"
    );

    const unsubscribeConnected = onValue(
      connectedReference,
      async (snapshot) => {
        if (snapshot.val() !== true) {
          return;
        }

        try {
          await onDisconnect(myStatusReference).set({
            state: "offline",
            nickname: user.nickname,
            lastChanged: realtimeServerTimestamp(),
          });

          await set(myStatusReference, {
            state: "online",
            nickname: user.nickname,
            lastChanged: realtimeServerTimestamp(),
          });
        } catch (firebaseError) {
          console.error(
            "ตั้งสถานะออนไลน์ไม่สำเร็จ:",
            firebaseError
          );
        }
      }
    );

    const unsubscribeStatuses = onValue(
      allStatusesReference,
      (snapshot) => {
        const statuses = snapshot.val() || {};

        const partnerEntry = Object.entries(statuses).find(
          ([uid]) => uid !== user.uid
        );

        if (!partnerEntry) {
          setPartnerStatus(null);
          return;
        }

        const [partnerUid, statusData] = partnerEntry;

        setPartnerStatus({
          uid: partnerUid,
          ...statusData,
        });
      },
      (firebaseError) => {
        console.error(
          "อ่านสถานะออนไลน์ไม่สำเร็จ:",
          firebaseError
        );
      }
    );

    return () => {
      unsubscribeConnected();
      unsubscribeStatuses();

      set(myStatusReference, {
        state: "offline",
        nickname: user.nickname,
        lastChanged: realtimeServerTimestamp(),
      }).catch(() => {});
    };
  }, [user?.uid, user?.nickname]);

  /*
   * ฟังสถานะกำลังพิมพ์ของอีกฝ่าย
   */
  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const typingRoomReference = ref(
      realtimeDb,
      `typing/${CHAT_ROOM_ID}`
    );

    const unsubscribe = onValue(
      typingRoomReference,
      (snapshot) => {
        const typingUsers = snapshot.val() || {};

        const isPartnerTyping = Object.entries(
          typingUsers
        ).some(
          ([uid, typingValue]) =>
            uid !== user.uid && typingValue === true
        );

        setPartnerTyping(isPartnerTyping);
      },
      (firebaseError) => {
        console.error(
          "อ่านสถานะกำลังพิมพ์ไม่สำเร็จ:",
          firebaseError
        );
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  /*
   * ฟังว่าอีกฝ่ายอ่านถึงเวลาไหนแล้ว
   */
  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const unsubscribe = onSnapshot(
      collection(db, "chatReadReceipts"),
      (snapshot) => {
        const partnerReceipt = snapshot.docs.find(
          (receiptDocument) =>
            receiptDocument.id !== user.uid
        );

        setPartnerReadAt(
          partnerReceipt?.data()?.lastReadAt || null
        );
      },
      (firebaseError) => {
        console.error(
          "โหลดสถานะอ่านแล้วไม่สำเร็จ:",
          firebaseError
        );
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  /*
   * บันทึกว่าเราอ่านข้อความถึงข้อความล่าสุดแล้ว
   */
  useEffect(() => {
    if (!user?.uid || chatMessages.length === 0) {
      return undefined;
    }

    const markAsRead = async () => {
      if (
        document.visibilityState !== "visible" ||
        !document.hasFocus()
      ) {
        return;
      }

      try {
        await setDoc(
          doc(db, "chatReadReceipts", user.uid),
          {
            userUid: user.uid,
            nickname: user.nickname,
            lastReadAt: firestoreServerTimestamp(),
          },
          {
            merge: true,
          }
        );
      } catch (firebaseError) {
        console.error(
          "อัปเดตสถานะอ่านแล้วไม่สำเร็จ:",
          firebaseError
        );
      }
    };

    markAsRead();

    const handleVisibilityChange = () => {
      markAsRead();
    };

    window.addEventListener("focus", markAsRead);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener("focus", markAsRead);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [
    chatMessages,
    user?.uid,
    user?.nickname,
  ]);

  /*
   * เลื่อนลงข้อความล่าสุด
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [chatMessages, partnerTyping]);

  /*
   * หาตำแหน่งข้อความล่าสุดที่เราส่ง
   */
  const latestMineIndex = useMemo(() => {
    for (
      let index = chatMessages.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (chatMessages[index].senderUid === user.uid) {
        return index;
      }
    }

    return -1;
  }, [chatMessages, user.uid]);

  const setMyTypingStatus = async (isTyping) => {
    if (!user?.uid) {
      return;
    }

    const myTypingReference = ref(
      realtimeDb,
      `typing/${CHAT_ROOM_ID}/${user.uid}`
    );

    try {
      if (isTyping) {
        await onDisconnect(myTypingReference).set(false);
      }

      await set(myTypingReference, isTyping);
    } catch (firebaseError) {
      console.error(
        "อัปเดตสถานะกำลังพิมพ์ไม่สำเร็จ:",
        firebaseError
      );
    }
  };

  const handleMessageChange = (event) => {
    const newValue = event.target.value;

    setMessageText(newValue);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!newValue.trim()) {
      setMyTypingStatus(false);
      return;
    }

    setMyTypingStatus(true);

    typingTimeoutRef.current = setTimeout(() => {
      setMyTypingStatus(false);
    }, 1300);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const cleanMessage = messageText.trim();

    if (!cleanMessage || sending) {
      return;
    }

    try {
      setSending(true);
      setError("");

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await setMyTypingStatus(false);

      await addDoc(collection(db, "chatMessages"), {
        text: cleanMessage,
        senderUid: user.uid,
        senderName: user.nickname,
        senderEmail: user.email,
        createdAt: firestoreServerTimestamp(),
      });

      setMessageText("");
      textareaRef.current?.focus();
    } catch (firebaseError) {
      console.error(
        "ส่งข้อความไม่สำเร็จ:",
        firebaseError
      );

      setError(
        "ส่งข้อความไม่สำเร็จ ลองอีกครั้งนะ"
      );
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

      await deleteDoc(
        doc(db, "chatMessages", message.id)
      );
    } catch (firebaseError) {
      console.error(
        "ลบข้อความไม่สำเร็จ:",
        firebaseError
      );

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

  const formatLastSeen = (lastChanged) => {
    if (!lastChanged) {
      return "ออฟไลน์";
    }

    return `ใช้งานล่าสุด ${new Intl.DateTimeFormat(
      "th-TH",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(lastChanged))}`;
  };

  const shouldShowDate = (
    currentMessage,
    previousMessage
  ) => {
    if (!currentMessage?.createdAt?.toDate) {
      return false;
    }

    if (!previousMessage?.createdAt?.toDate) {
      return true;
    }

    const currentDate =
      currentMessage.createdAt
        .toDate()
        .toDateString();

    const previousDate =
      previousMessage.createdAt
        .toDate()
        .toDateString();

    return currentDate !== previousDate;
  };

  const hasPartnerReadMessage = (message) => {
    if (
      !message?.createdAt?.toMillis ||
      !partnerReadAt?.toMillis
    ) {
      return false;
    }

    return (
      partnerReadAt.toMillis() >=
      message.createdAt.toMillis()
    );
  };

  const handleBack = async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await setMyTypingStatus(false);
    onBack();
  };

  const partnerIsOnline =
    partnerStatus?.state === "online";

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <button
            className="chat-back-button"
            type="button"
            onClick={handleBack}
            aria-label="กลับหน้าหลัก"
          >
            ←
          </button>

          <div className="chat-header-avatar">
            💗
          </div>

          <div className="chat-header-text">
            <h1>แชตของเรา</h1>

            <p>
              {partnerTyping
                ? "กำลังพิมพ์..."
                : partnerIsOnline
                  ? "ออนไลน์"
                  : formatLastSeen(
                      partnerStatus?.lastChanged
                    )}
            </p>
          </div>

          <div
            className={`chat-online-status ${
              partnerIsOnline
                ? "is-online"
                : "is-offline"
            }`}
          >
            <span />

            {partnerIsOnline
              ? "ออนไลน์"
              : "ออฟไลน์"}
          </div>
        </header>

        <section className="chat-content">
          {chatMessages.length === 0 ? (
            <div className="empty-chat">
              <span>💌</span>
              <h2>ยังไม่มีข้อความ</h2>
              <p>
                เริ่มส่งข้อความแรกถึงกันได้เลย
              </p>
            </div>
          ) : (
            chatMessages.map((message, index) => {
              const isMine =
                message.senderUid === user.uid;

              const previousMessage =
                chatMessages[index - 1];

              const showDate = shouldShowDate(
                message,
                previousMessage
              );

              const isLatestMine =
                isMine && index === latestMineIndex;

              const isSeen =
                isLatestMine &&
                hasPartnerReadMessage(message);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="chat-date-divider">
                      <span>
                        {formatMessageDate(
                          message.createdAt
                        )}
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
                        {message.senderName?.charAt(
                          0
                        ) || "♡"}
                      </div>
                    )}

                    <div className="chat-message-area">
                      {!isMine && (
                        <span className="chat-sender-name">
                          {message.senderName ||
                            "คนสำคัญ"}
                        </span>
                      )}

                      <div className="chat-bubble">
                        <p>{message.text}</p>

                        <div className="chat-message-bottom">
                          <span>
                            {formatMessageTime(
                              message.createdAt
                            )}
                          </span>

                          {isMine && (
                            <button
                              className="delete-chat-button"
                              type="button"
                              title="ลบข้อความ"
                              disabled={
                                deletingId === message.id
                              }
                              onClick={() =>
                                handleDeleteMessage(
                                  message
                                )
                              }
                            >
                              {deletingId === message.id
                                ? "…"
                                : "×"}
                            </button>
                          )}
                        </div>
                      </div>

                      {isLatestMine && (
                        <div
                          className={`message-read-status ${
                            isSeen
                              ? "seen"
                              : "delivered"
                          }`}
                        >
                          {isSeen
                            ? "✓✓ อ่านแล้ว"
                            : "✓ ส่งแล้ว"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {partnerTyping && (
            <div className="typing-row">
              <div className="chat-avatar">♡</div>

              <div className="typing-bubble">
                <span />
                <span />
                <span />
              </div>
            </div>
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
            onChange={handleMessageChange}
            onBlur={() =>
              setMyTypingStatus(false)
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
            disabled={
              !messageText.trim() || sending
            }
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
