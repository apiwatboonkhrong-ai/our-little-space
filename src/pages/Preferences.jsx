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
import "./Preferences.css";

const PEOPLE = ["โต๋เต๋", "หมูเด้ง"];

const CATEGORIES = [
  "อาหาร",
  "เครื่องดื่ม",
  "สี",
  "สัตว์",
  "เกม",
  "เพลง",
  "สถานที่",
  "นิสัย",
  "อื่น ๆ",
];

function Preferences({ user, onBack }) {
  const [items, setItems] = useState([]);
  const [owner, setOwner] = useState(user.nickname);
  const [type, setType] = useState("like");
  const [category, setCategory] = useState("อาหาร");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState("โต๋เต๋");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const preferencesQuery = query(
      collection(db, "preferences"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      preferencesQuery,
      (snapshot) => {
        const preferenceList = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setItems(preferenceList);
      },
      (firebaseError) => {
        console.error(firebaseError);
        setError("โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชอีกครั้งนะ");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!text.trim()) {
      setError("ใส่สิ่งที่ชอบหรือไม่ชอบก่อนนะ 🌷");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "preferences"), {
        owner,
        type,
        category,
        text: text.trim(),
        note: note.trim(),
        createdBy: user.nickname,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
      });

      setText("");
      setNote("");
      setShowForm(false);
      setSelectedPerson(owner);
    } catch (firebaseError) {
      console.error(firebaseError);
      setError("บันทึกข้อมูลไม่สำเร็จ ลองใหม่อีกครั้งนะ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    const confirmed = window.confirm(
      "ต้องการลบข้อมูลนี้จริง ๆ ใช่ไหม?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "preferences", itemId));
    } catch (firebaseError) {
      console.error(firebaseError);
      setError("ลบข้อมูลไม่สำเร็จ");
    }
  };

  const selectedItems = items.filter(
    (item) => item.owner === selectedPerson
  );

  const likedItems = selectedItems.filter(
    (item) => item.type === "like"
  );

  const dislikedItems = selectedItems.filter(
    (item) => item.type === "dislike"
  );

  const renderItem = (item) => (
    <article className="preference-card" key={item.id}>
      <div className="preference-card-top">
        <span className="preference-category">
          {item.category || "อื่น ๆ"}
        </span>

        <button
          className="preference-delete"
          type="button"
          onClick={() => handleDelete(item.id)}
          aria-label="ลบข้อมูล"
        >
          ×
        </button>
      </div>

      <h3>{item.text}</h3>

      {item.note && <p>{item.note}</p>}

      <small>
        เพิ่มโดย {item.createdBy || "คนสำคัญ"} ♡
      </small>
    </article>
  );

  return (
    <main className="preferences-page">
      <header className="preferences-header">
        <button
          className="preferences-back-button"
          type="button"
          onClick={onBack}
        >
          ← กลับหน้าหลัก
        </button>

        <div className="preferences-heading">
          <p>ABOUT OUR LITTLE THINGS</p>
          <h1>สิ่งที่ชอบและไม่ชอบ 🌷</h1>
          <span>
            เก็บรายละเอียดเล็ก ๆ เพื่อให้เรารู้ใจกันมากขึ้น
          </span>
        </div>

        <button
          className="add-preference-button"
          type="button"
          onClick={() => setShowForm((current) => !current)}
        >
          {showForm ? "ปิดแบบฟอร์ม" : "+ เพิ่มข้อมูล"}
        </button>
      </header>

      {showForm && (
        <section className="preference-form-card">
          <div className="preference-form-heading">
            <span>💗</span>

            <div>
              <h2>เพิ่มรายละเอียดใหม่</h2>
              <p>บันทึกว่าใครชอบหรือไม่ชอบอะไร</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="preference-form-grid">
              <div className="preference-input-group">
                <label htmlFor="owner">ข้อมูลของใคร</label>

                <select
                  id="owner"
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                >
                  {PEOPLE.map((person) => (
                    <option value={person} key={person}>
                      {person}
                    </option>
                  ))}
                </select>
              </div>

              <div className="preference-input-group">
                <label htmlFor="type">ประเภท</label>

                <select
                  id="type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option value="like">ชอบ 💗</option>
                  <option value="dislike">ไม่ชอบ ✖</option>
                </select>
              </div>

              <div className="preference-input-group">
                <label htmlFor="category">หมวดหมู่</label>

                <select
                  id="category"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  {CATEGORIES.map((categoryName) => (
                    <option value={categoryName} key={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="preference-input-group">
              <label htmlFor="preferenceText">
                สิ่งที่ชอบหรือไม่ชอบ
              </label>

              <input
                id="preferenceText"
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="เช่น มัจฉะ แมว สีฟ้า..."
              />
            </div>

            <div className="preference-input-group">
              <label htmlFor="preferenceNote">
                รายละเอียดเพิ่มเติม
              </label>

              <textarea
                id="preferenceNote"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="เช่น ชอบหวานน้อย หรือชอบกินตอนเช้า..."
                rows="4"
              />
            </div>

            <div className="preference-form-footer">
              <div className="preference-error">{error}</div>

              <button
                className="save-preference-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล 💗"}
              </button>
            </div>
          </form>
        </section>
      )}

      {!showForm && error && (
        <div className="preference-page-error">{error}</div>
      )}

      <section className="person-selector">
        {PEOPLE.map((person) => (
          <button
            type="button"
            key={person}
            className={
              selectedPerson === person
                ? "person-button active"
                : "person-button"
            }
            onClick={() => setSelectedPerson(person)}
          >
            <span>{person === "โต๋เต๋" ? "🐻" : "🐷"}</span>
            {person}
          </button>
        ))}
      </section>

      <section className="preferences-content">
        <div className="preference-column likes-column">
          <div className="column-heading">
            <span>💗</span>

            <div>
              <h2>สิ่งที่ {selectedPerson} ชอบ</h2>
              <p>{likedItems.length} รายการ</p>
            </div>
          </div>

          {likedItems.length === 0 ? (
            <div className="empty-preference">
              ยังไม่มีข้อมูลสิ่งที่ชอบ
            </div>
          ) : (
            <div className="preference-list">
              {likedItems.map(renderItem)}
            </div>
          )}
        </div>

        <div className="preference-column dislikes-column">
          <div className="column-heading">
            <span>🌧️</span>

            <div>
              <h2>สิ่งที่ {selectedPerson} ไม่ชอบ</h2>
              <p>{dislikedItems.length} รายการ</p>
            </div>
          </div>

          {dislikedItems.length === 0 ? (
            <div className="empty-preference">
              ยังไม่มีข้อมูลสิ่งที่ไม่ชอบ
            </div>
          ) : (
            <div className="preference-list">
              {dislikedItems.map(renderItem)}
            </div>
          )}
        </div>
      </section>

      <div className="preferences-decoration preference-flower-one">
        🌸
      </div>

      <div className="preferences-decoration preference-flower-two">
        🌷
      </div>

      <div className="preferences-decoration preference-heart">
        ♡
      </div>
    </main>
  );
}

export default Preferences;
