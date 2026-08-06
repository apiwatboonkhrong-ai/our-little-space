const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const ImageKitModule = require("@imagekit/nodejs");
const ImageKit = ImageKitModule.default || ImageKitModule;

// โหลดค่าจาก server/.env
dotenv.config({
  path: path.join(__dirname, ".env"),
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: true,
  })
);

app.use(express.json());

if (
  !process.env.IMAGEKIT_PUBLIC_KEY ||
  !process.env.IMAGEKIT_PRIVATE_KEY
) {
  console.error("ไม่พบคีย์ ImageKit ในไฟล์ server/.env");
  process.exit(1);
}

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

// เช็กว่า Backend เปิดอยู่
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Our Little Space server is running 💗",
  });
});

// สร้าง token สำหรับอัปโหลดรูป
app.get("/auth", (req, res) => {
  try {
    const authenticationParameters =
      imagekit.helper.getAuthenticationParameters();

    return res.json({
      ...authenticationParameters,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });
  } catch (error) {
    console.error("สร้างข้อมูลยืนยันไม่สำเร็จ:", error);

    return res.status(500).json({
      success: false,
      message: "สร้างข้อมูลยืนยันไม่สำเร็จ",
    });
  }
});

// ลบรูปออกจาก ImageKit
app.delete("/delete-image/:fileId", async (req, res) => {
  try {
    const fileId = decodeURIComponent(req.params.fileId || "").trim();

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบรหัสไฟล์รูป",
      });
    }

    console.log("กำลังลบรูปจาก ImageKit:", fileId);

    await imagekit.files.delete(fileId);

    console.log("ลบรูปจาก ImageKit สำเร็จ:", fileId);

    return res.status(200).json({
      success: true,
      message: "ลบรูปจาก ImageKit สำเร็จ",
    });
  } catch (error) {
    console.error("ลบรูปจาก ImageKit ไม่สำเร็จ:", error);

    return res.status(error?.status || 500).json({
      success: false,
      message:
        error?.message ||
        "เกิดข้อผิดพลาดขณะลบรูปจาก ImageKit",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});