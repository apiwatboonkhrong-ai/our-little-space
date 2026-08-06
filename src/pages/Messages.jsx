import { useEffect, useState } from "react";
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
import "./Messages.css";

function Messages({ user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState("");
  const [messageDate, setMessageDate] = useState("");
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageList = snapshot.docs.map((messageDocument) => ({
          id: messageDocument.id,
          ...messageDocument.data(),
        }));

        setMessages(messageList);
      },
      (firebaseError) => {
        console.error(firebaseError);
        setError("โหลดข้อความไม่สำเร็จ ลองรีเฟรชอีกครั้งนะ");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddMessage = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("ใส่หัวข้อก่อนนะ 🌷");
      return;
    }

    if (!messageDate) {
      setError("เลือกวันที่ก่อนนะ 💗");
      return;
    }

    if (!content.trim()) {
      setError("ใส่ข้อความก่อนนะ 💌");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "messages"), {
        title: title.trim(),
        messageDate,
        content: content.trim(),
        createdBy: user.nickname,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setMessageDate("");
      setContent("");
      setShowForm(false);
    } catch (firebaseError) {
      console.error(firebaseError);
      setError("บันทึกข้อความไม่สำเร็จ ลองอีกครั้งนะ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (messageId) => {
    const confirmed = window.confirm(
      "ต้องการลบข้อความนี้จริง ๆ ใช่ไหม?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "messages", messageId));
    } catch (firebaseError) {
      console.error(firebaseError);
      setError("ลบข้อความไม่สำเร็จ");
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "ไม่ได้ระบุวันที่";
    }

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${dateValue}T00:00:00`));
  };

  return (
    <main className="messages-page">
      <header className="messages-header">
        <button className="messages-back-button" onClick={onBack}>
          ← กลับหน้าหลัก
        </button>

        <div className="messages-heading">
          <p>OUR LITTLE NOTES</p>
          <h1>ข้อความของเรา 💌</h1>
          <span>เก็บทุกข้อความสำคัญไว้ในพื้นที่ของเรา</span>
        </div>

        <button
          className="add-message-button"
          onClick={() => setShowForm((current) => !current)}
        >
          {showForm ? "ปิดแบบฟอร์ม" : "+ เพิ่มข้อความ"}
        </button>
      </header>

      {showForm && (
        <section className="message-form-card">
          <div className="message-form-title">
            <span>💗</span>

            <div>
              <h2>เขียนข้อความใหม่</h2>
              <p>ฝากข้อความหรือเรื่องราวไว้ให้อีกคนอ่าน</p>
            </div>
          </div>

          <form onSubmit={handleAddMessage}>
            <div className="message-form-grid">
              <div className="message-input-group">
                <label htmlFor="messageTitle">หัวข้อ</label>

                <input
                  id="messageTitle"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="เช่น วันนี้อยากบอกว่า..."
                />
              </div>

              <div className="message-input-group">
                <label htmlFor="messageDate">วันที่</label>

                <input
                  id="messageDate"
                  type="date"
                  value={messageDate}
                  onChange={(event) => setMessageDate(event.target.value)}
                />
              </div>
            </div>

            <div className="message-input-group">
              <label htmlFor="messageContent">ข้อความ</label>

              <textarea
                id="messageContent"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="เขียนข้อความไว้ตรงนี้..."
                rows="7"
              />
            </div>

            <div className="message-form-footer">
              <div className="message-error">{error}</div>

              <button
                className="save-message-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "กำลังบันทึก..." : "บันทึกข้อความ 💗"}
              </button>
            </div>
          </form>
        </section>
      )}

      {!showForm && error && (
        <div className="messages-page-error">{error}</div>
      )}

      <section className="messages-content">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <div>💌</div>
            <h2>ยังไม่มีข้อความในพื้นที่นี้</h2>
            <p>เขียนข้อความแรกฝากไว้อ่านด้วยกันนะ</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message, index) => (
              <article
                className={`message-card ${
                  index === 0 ? "featured-message" : ""
                }`}
                key={message.id}
              >
                <div className="message-card-top">
                  <span className="message-date">
                    {formatDate(message.messageDate)}
                  </span>

                  <button
                    className="delete-message-button"
                    onClick={() => handleDelete(message.id)}
                    title="ลบข้อความ"
                  >
                    ×
                  </button>
                </div>

                <div className="message-icon">
                  {index === 0 ? "💗" : "💌"}
                </div>

                <h2>{message.title}</h2>

                <p className="message-content">
                  {message.content}
                </p>

                <div className="message-owner">
                  เขียนโดย {message.createdBy || "คนสำคัญ"} ♡
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="messages-decoration messages-flower-one">
        🌸
      </div>

      <div className="messages-decoration messages-flower-two">
        🌷
      </div>

      <div className="messages-decoration messages-heart">
        ♡
      </div>
    </main>
  );
}

export default Messages;
