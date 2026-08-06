import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import "./Home.css";

function Home({
  user,
  onOpenMemories,
  onOpenTogether,
  onOpenMessages,
  onOpenPreferences,
  onOpenChat,
}) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="home-page">
      <header className="home-header">
        <div>
          <p className="home-small-text">
            OUR LITTLE SPACE
          </p>

          <h1>
            ยินดีต้อนรับ {user.nickname} 🌷
          </h1>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          ออกจากระบบ
        </button>
      </header>

      <section className="welcome-card">
        <div className="welcome-content">
          <p>พื้นที่เล็ก ๆ ของเราสองคน</p>

          <h2>
            เก็บทุกช่วงเวลาที่มีความหมายไว้ด้วยกัน ♡
          </h2>
        </div>
      </section>

      <section className="menu-section">
        <h2>วันนี้อยากไปส่วนไหนดี?</h2>

        <div className="menu-grid">

          <button
            className="menu-card memories-card"
            onClick={onOpenMemories}
          >
            <span className="menu-icon">📸</span>

            <div>
              <h3>ความทรงจำของเรา</h3>
              <p>เพิ่มและดูรูปภาพช่วงเวลาที่อยู่ด้วยกัน</p>
            </div>
          </button>

          <button
            className="menu-card together-card"
            onClick={onOpenTogether}
          >
            <span className="menu-icon">💗</span>

            <div>
              <h3>เวลาของเรา</h3>
              <p>ดูว่าเราอยู่ด้วยกันมากี่วันแล้ว</p>
            </div>
          </button>

          <button
            className="menu-card message-card"
            onClick={onOpenMessages}
          >
            <span className="menu-icon">💌</span>

            <div>
              <h3>ข้อความของเรา</h3>
              <p>จดหมายและข้อความสำคัญ</p>
            </div>
          </button>

          <button
            className="menu-card chat-card"
            onClick={onOpenChat}
          >
            <span className="menu-icon">💬</span>

            <div>
              <h3>แชตของเรา</h3>
              <p>คุยกันแบบเรียลไทม์</p>
            </div>
          </button>

          <button
            className="menu-card about-card"
            onClick={onOpenPreferences}
          >
            <span className="menu-icon">🌷</span>

            <div>
              <h3>สิ่งที่ชอบและไม่ชอบ</h3>
              <p>เก็บรายละเอียดของกันและกัน</p>
            </div>
          </button>

        </div>
      </section>
    </main>
  );
}

export default Home;
