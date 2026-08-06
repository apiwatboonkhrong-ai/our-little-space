import { useEffect, useState } from "react";
import "./Together.css";

// แก้เป็นวันและเวลาที่เริ่มคบหรือเริ่มรู้จักกัน
const START_DATE = new Date("2026-07-12T00:00:00+07:00");

function calculateTogetherTime() {
  const difference = Math.max(0, Date.now() - START_DATE.getTime());

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor(
      (difference / (1000 * 60 * 60)) % 24
    ),
    minutes: Math.floor(
      (difference / (1000 * 60)) % 60
    ),
    seconds: Math.floor(
      (difference / 1000) % 60
    ),
  };
}

function Together({ onBack }) {
  const [time, setTime] = useState(calculateTogetherTime());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setTime(calculateTogetherTime());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  return (
    <main className="together-page">
      <header className="together-header">
        <button className="together-back-button" onClick={onBack}>
          ← กลับหน้าหลัก
        </button>

        <div className="together-heading">
          <p>OUR TIME TOGETHER</p>
          <h1>เวลาของเรา 💗</h1>
          <span>ทุกวินาทีที่ผ่านไป ก็คือความทรงจำของเรา</span>
        </div>

        <div className="header-placeholder" />
      </header>

      <section className="together-main-card">
        <div className="together-heart">♡</div>

        <p className="together-label">
          เราอยู่ด้วยกันมาแล้ว
        </p>

        <div className="day-highlight">
          <strong>{time.days.toLocaleString("th-TH")}</strong>
          <span>วัน</span>
        </div>

        <div className="time-grid">
          <div className="time-card">
            <strong>{String(time.hours).padStart(2, "0")}</strong>
            <span>ชั่วโมง</span>
          </div>

          <div className="time-card">
            <strong>{String(time.minutes).padStart(2, "0")}</strong>
            <span>นาที</span>
          </div>

          <div className="time-card">
            <strong>{String(time.seconds).padStart(2, "0")}</strong>
            <span>วินาที</span>
          </div>
        </div>

        <div className="start-date-box">
          <span>เรื่องราวของเราเริ่มต้นเมื่อ</span>

          <strong>
            {new Intl.DateTimeFormat("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(START_DATE)}
          </strong>
        </div>

        <p className="together-message">
          ขอบคุณที่อยู่สร้างช่วงเวลาดี ๆ ด้วยกันนะ
          ต่อจากนี้ก็ขอให้เรามีความทรงจำเพิ่มขึ้นอีกเยอะ ๆ เลย 🌷
        </p>
      </section>

      <section className="little-moments">
        <article>
          <span>🌸</span>
          <h2>ทุกวันมีความหมาย</h2>
          <p>ไม่ว่าจะเป็นวันธรรมดาหรือวันพิเศษ</p>
        </article>

        <article>
          <span>📸</span>
          <h2>ทุกภาพมีเรื่องราว</h2>
          <p>ภาพแต่ละภาพช่วยเก็บช่วงเวลาของเราไว้</p>
        </article>

        <article>
          <span>💌</span>
          <h2>ทุกข้อความมีความรู้สึก</h2>
          <p>เรื่องเล็ก ๆ ก็สามารถเป็นความทรงจำที่ดีได้นะอ้วนน</p>
        </article>
      </section>

      <div className="together-decoration flower-left">🌸</div>
      <div className="together-decoration flower-right">🌷</div>
      <div className="together-decoration heart-right">♡</div>
    </main>
  );
}

export default Together;
