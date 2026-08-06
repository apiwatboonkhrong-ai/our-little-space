import { useEffect, useState } from "react";
import { upload } from "@imagekit/react";

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
import "./Memories.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const AUTH_ENDPOINT = `${API_URL}/auth`;
const DELETE_IMAGE_ENDPOINT = `${API_URL}/delete-image`;
const IMAGEKIT_FOLDER = "/our-little-space/memories";

function Memories({ user, onBack }) {
  const [memories, setMemories] = useState([]);

  const [title, setTitle] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [description, setDescription] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const [selectedMemory, setSelectedMemory] = useState(null);

  useEffect(() => {
    const memoriesQuery = query(
      collection(db, "memories"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      memoriesQuery,
      (snapshot) => {
        const memoryList = snapshot.docs.map((memoryDocument) => ({
          id: memoryDocument.id,
          ...memoryDocument.data(),
        }));

        setMemories(memoryList);
      },
      (firebaseError) => {
        console.error("โหลด Firestore ไม่สำเร็จ:", firebaseError);
        setError("โหลดความทรงจำไม่สำเร็จ ลองรีเฟรชอีกครั้งนะ");
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetForm = () => {
    setTitle("");
    setMemoryDate("");
    setDescription("");
    setSelectedFile(null);
    setUploadProgress(0);
    setError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("เลือกได้เฉพาะไฟล์รูปภาพนะ 📸");
      event.target.value = "";
      return;
    }

    const maximumSize = 10 * 1024 * 1024;

    if (file.size > maximumSize) {
      setError("รูปมีขนาดใหญ่เกิน 10 MB กรุณาเลือกรูปที่เล็กลงนะ");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const getUploadAuthentication = async () => {
    const response = await fetch(AUTH_ENDPOINT);

    if (!response.ok) {
      throw new Error("เชื่อมต่อเซิร์ฟเวอร์อัปโหลดไม่สำเร็จ");
    }

    const authenticationData = await response.json();

    if (
      !authenticationData.token ||
      !authenticationData.expire ||
      !authenticationData.signature ||
      !authenticationData.publicKey
    ) {
      throw new Error("ข้อมูลยืนยันจากเซิร์ฟเวอร์ไม่ครบ");
    }

    return authenticationData;
  };

  const uploadImageToImageKit = async (file) => {
    const { token, expire, signature, publicKey } =
      await getUploadAuthentication();

    const uploadResult = await upload({
      file,
      fileName: `${Date.now()}-${file.name}`,
      folder: IMAGEKIT_FOLDER,
      useUniqueFileName: true,
      token,
      expire,
      signature,
      publicKey,

      onProgress: (progressEvent) => {
        if (!progressEvent.total) {
          return;
        }

        const percentage = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );

        setUploadProgress(percentage);
      },
    });

    return uploadResult;
  };

  const handleAddMemory = async (event) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("ใส่หัวข้อความทรงจำก่อนนะ 🌷");
      return;
    }

    if (!memoryDate) {
      setError("เลือกวันที่ของความทรงจำก่อนนะ 💗");
      return;
    }

    if (!selectedFile) {
      setError("เลือกรูปภาพความทรงจำก่อนนะ 📸");
      return;
    }

    try {
      setSaving(true);
      setUploadProgress(0);

      const uploadedImage =
        await uploadImageToImageKit(selectedFile);

      if (!uploadedImage.url) {
        throw new Error("ImageKit ไม่ได้ส่ง URL รูปกลับมา");
      }

      await addDoc(collection(db, "memories"), {
        title: title.trim(),
        description: description.trim(),
        memoryDate,

        imageUrl: uploadedImage.url,
        imageFileId: uploadedImage.fileId || "",
        imageName: uploadedImage.name || selectedFile.name,
        imageWidth: uploadedImage.width || null,
        imageHeight: uploadedImage.height || null,

        createdBy: user.nickname,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
      });

      resetForm();
      setShowForm(false);
    } catch (uploadError) {
      console.error("บันทึกความทรงจำไม่สำเร็จ:", uploadError);

      setError(
        uploadError?.message ||
          "อัปโหลดหรือบันทึกไม่สำเร็จ ลองอีกครั้งนะ"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memory) => {
    const confirmed = window.confirm(
      "ต้องการลบความทรงจำนี้จริง ๆ ใช่ไหม?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setDeletingId(memory.id);

      if (memory.imageFileId) {
        const response = await fetch(
          `${DELETE_IMAGE_ENDPOINT}/${encodeURIComponent(
            memory.imageFileId
          )}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));

          throw new Error(
            result.message || "ลบรูปออกจาก ImageKit ไม่สำเร็จ"
          );
        }
      }

      await deleteDoc(doc(db, "memories", memory.id));

      if (selectedMemory?.id === memory.id) {
        setSelectedMemory(null);
      }
    } catch (deleteError) {
      console.error("ลบความทรงจำไม่สำเร็จ:", deleteError);

      setError(
        deleteError?.message ||
          "ลบความทรงจำไม่สำเร็จ ลองอีกครั้งนะ"
      );
    } finally {
      setDeletingId("");
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "ยังไม่ได้ระบุวันที่";
    }

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${dateValue}T00:00:00`));
  };

  return (
    <main className="memories-page">
      <header className="memories-header">
        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          ← กลับหน้าหลัก
        </button>

        <div className="memories-heading">
          <p>OUR MEMORIES</p>
          <h1>ความทรงจำของเรา 📸</h1>
          <span>
            เก็บทุกช่วงเวลาที่มีความหมายเอาไว้ด้วยกัน
          </span>
        </div>

        <button
          className="add-memory-button"
          type="button"
          onClick={() => {
            setShowForm((currentValue) => !currentValue);
            setError("");
          }}
        >
          {showForm ? "ปิดแบบฟอร์ม" : "+ เพิ่มความทรงจำ"}
        </button>
      </header>

      {showForm && (
        <section className="memory-form-card">
          <div className="form-title">
            <span>💌</span>

            <div>
              <h2>เพิ่มเรื่องราวใหม่</h2>
              <p>บันทึกช่วงเวลาดี ๆ ของเราลงในพื้นที่นี้</p>
            </div>
          </div>

          <form onSubmit={handleAddMemory}>
            <div className="form-grid">
              <div className="memory-input-group">
                <label htmlFor="memoryTitle">
                  หัวข้อความทรงจำ
                </label>

                <input
                  id="memoryTitle"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="เช่น วันที่เราไปเที่ยวด้วยกัน"
                  disabled={saving}
                />
              </div>

              <div className="memory-input-group">
                <label htmlFor="memoryDate">วันที่</label>

                <input
                  id="memoryDate"
                  type="date"
                  value={memoryDate}
                  onChange={(event) =>
                    setMemoryDate(event.target.value)
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="memory-input-group">
              <label htmlFor="memoryDescription">
                รายละเอียด
              </label>

              <textarea
                id="memoryDescription"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="วันนี้เกิดอะไรขึ้นบ้าง..."
                rows="5"
                disabled={saving}
              />
            </div>

            <div className="memory-input-group">
              <label htmlFor="memoryImage">
                รูปภาพความทรงจำ
              </label>

              <label
                className={
                  saving
                    ? "memory-file-picker disabled"
                    : "memory-file-picker"
                }
                htmlFor="memoryImage"
              >
                <span className="file-picker-icon">📸</span>

                <div>
                  <strong>
                    {selectedFile
                      ? selectedFile.name
                      : "กดเพื่อเลือกรูปภาพ"}
                  </strong>

                  <small>
                    รองรับไฟล์รูปภาพ ขนาดไม่เกิน 10 MB
                  </small>
                </div>
              </label>

              <input
                id="memoryImage"
                className="hidden-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={saving}
              />
            </div>

            {previewUrl && (
              <div className="memory-preview">
                <img
                  src={previewUrl}
                  alt="ตัวอย่างรูปที่เลือก"
                />

                {!saving && (
                  <button
                    type="button"
                    className="remove-preview-button"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl);
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                  >
                    ลบรูปที่เลือก
                  </button>
                )}
              </div>
            )}

            {saving && (
              <div className="upload-progress-area">
                <div className="upload-progress-text">
                  <span>กำลังอัปโหลดรูป...</span>
                  <strong>{uploadProgress}%</strong>
                </div>

                <div className="upload-progress-track">
                  <div
                    className="upload-progress-bar"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="memory-form-footer">
              <div className="memory-error">{error}</div>

              <button
                className="save-memory-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? `กำลังบันทึก ${uploadProgress}%`
                  : "บันทึกความทรงจำ 💗"}
              </button>
            </div>
          </form>
        </section>
      )}

      {!showForm && error && (
        <div className="page-error">{error}</div>
      )}

      <section className="memories-content">
        {memories.length === 0 ? (
          <div className="empty-memories">
            <div>🌷</div>
            <h2>ยังไม่มีความทรงจำในพื้นที่นี้</h2>
            <p>เพิ่มเรื่องราวแรกของเรากันเถอะ</p>
          </div>
        ) : (
          <div className="memories-grid">
            {memories.map((memory, index) => {
              const isPortrait =
                memory.imageHeight &&
                memory.imageWidth &&
                memory.imageHeight > memory.imageWidth;

              return (
                <article
                  className={`memory-card ${
                    isPortrait || index % 3 === 1
                      ? "portrait-card"
                      : "landscape-card"
                  }`}
                  key={memory.id}
                >
                  {memory.imageUrl ? (
                    <button
                      type="button"
                      className="memory-image-wrapper"
                      onClick={() =>
                        setSelectedMemory(memory)
                      }
                    >
                      <img
                        src={memory.imageUrl}
                        alt={
                          memory.title ||
                          "รูปความทรงจำ"
                        }
                        className="memory-image"
                        loading="lazy"
                      />
                    </button>
                  ) : (
                    <div className="memory-placeholder">
                      <span>
                        {index % 3 === 1 ? "🌷" : "💗"}
                      </span>
                      <p>Our Memory</p>
                    </div>
                  )}

                  <div className="memory-card-content">
                    <div className="memory-card-top">
                      <span className="memory-date">
                        {formatDate(memory.memoryDate)}
                      </span>

                      <button
                        className="delete-memory-button"
                        type="button"
                        onClick={() => handleDelete(memory)}
                        disabled={deletingId === memory.id}
                        title="ลบความทรงจำ"
                      >
                        {deletingId === memory.id
                          ? "…"
                          : "×"}
                      </button>
                    </div>

                    <h2>
                      {memory.title ||
                        "ความทรงจำของเรา"}
                    </h2>

                    {memory.description && (
                      <p className="memory-description">
                        {memory.description}
                      </p>
                    )}

                    <div className="memory-owner">
                      บันทึกโดย{" "}
                      {memory.createdBy || "คนสำคัญ"} ♡
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedMemory && (
        <div
          className="memory-lightbox"
          role="presentation"
          onClick={() => setSelectedMemory(null)}
        >
          <button
            type="button"
            className="close-lightbox-button"
            onClick={() => setSelectedMemory(null)}
          >
            ×
          </button>

          <div
            className="lightbox-content"
            role="presentation"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedMemory.imageUrl}
              alt={
                selectedMemory.title ||
                "รูปความทรงจำ"
              }
            />

            <div className="lightbox-information">
              <h2>{selectedMemory.title}</h2>
              <p>
                {formatDate(selectedMemory.memoryDate)}
              </p>

              {selectedMemory.description && (
                <span>
                  {selectedMemory.description}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="memory-decoration memory-flower-one">
        🌸
      </div>

      <div className="memory-decoration memory-flower-two">
        🌷
      </div>

      <div className="memory-decoration memory-heart">
        ♡
      </div>
    </main>
  );
}

export default Memories;
