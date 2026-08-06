import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import "./Login.css";

const USERS = {
  "โต๋เต๋": "torte@example.com",
  "หมูเด้ง": "mudeng@example.com",
};

function Login({ onLogin }) {
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = nickname.trim();
    const email = USERS[cleanName];

    if (!email) {
      setError("ชื่อนี้ไม่ใช่คนในพื้นที่ของเรานะ 🌷");
      return;
    }

    if (!password) {
      setError("ใส่รหัสลับก่อนนะ 💗");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      onLogin({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        nickname: cleanName,
      });
    } catch (error) {
      console.error(error);
      setError("ชื่อหรือรหัสลับยังไม่ถูก ลองใหม่อีกครั้งนะ ♡");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="floating-decoration flower-one">🌸</div>
      <div className="floating-decoration flower-two">🌷</div>
      <div className="floating-decoration heart-one">♡</div>
      <div className="floating-decoration heart-two">💗</div>

      <section className="login-card">
        <div className="login-picture">
          <div className="picture-overlay">
            <p>พื้นที่เล็ก ๆ ของคนสองคน</p>
            <h2>Our Memories</h2>
            <span>เก็บทุกช่วงเวลาของเราไว้ด้วยกัน ♡</span>
          </div>
        </div>

        <div className="login-form-side">
          <div className="heart-logo">♡</div>
          <p className="eyebrow">WELCOME HOME</p>
          <h1>Our Little Space</h1>
          <p className="description">
            ใส่ชื่อและรหัสลับ เพื่อเข้าสู่พื้นที่ของเรานะ
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="nickname">ชื่อของเธอ</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="โต๋เต๋ หรือ หมูเด้ง"
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">รหัสลับ</label>

              <div className="password-box">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="ใส่รหัสลับตรงนี้..."
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="error-message">{error}</div>

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "กำลังเปิดประตูหัวใจ..."
                : "เข้าสู่พื้นที่ของเรา 💗"}
            </button>
          </form>

          <p className="private-message">
            🔒 พื้นที่นี้เปิดให้คนสำคัญเพียงสองคนเท่านั้น
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
