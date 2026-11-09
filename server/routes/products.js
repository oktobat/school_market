import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // 👈 Node.js 파일 시스템 모듈 추가

const router = express.Router();

// 0. uploads 폴더가 없으면 자동 생성하는 로직
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 uploads 폴더가 생성되었습니다.');
}

// 1. Multer 저장소 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// 2. Multer 미들웨어 객체 생성
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 용량 제한
});

// 1. 전체 상품 목록 조회 (비로그인 사용자도 가능)
// GET /api/products
router.get('/', async (req, res) => {
  const { category } = req.query; // 카테고리 필터링 쿼리 파라미터

  try {
    let query = `
      SELECT p.id, p.title, p.price, p.type, p.category, p.status, p.location, p.created_at, u.nickname AS seller_nickname
      FROM products p
      JOIN users u ON p.seller_id = u.id
    `;
    const params = [];

    if (category && category !== '전체') {
      query += ' WHERE p.category = ?';
      params.push(category);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await db.query(query, params);
    return res.status(200).json(products);
  } catch (error) {
    console.error('상품 목록 조회 에러:', error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 2. 단일 상품 상세 조회 (비로그인 사용자도 가능)
// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT p.*, u.nickname AS seller_nickname, u.student_id AS seller_student_id
       FROM products p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '존재하지 않는 상품입니다.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('상품 상세 조회 에러:', error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 3. 새 상품 등록 (로그인 회원 전용 - 작성 시 user_id 외래키 연결)
// POST /api/products
router.post('/', upload.single('image'), async (req, res) => {
  const { title, type, category, price, location, description, sellerId } = req.body;

  // req.file 존재 여부에 따른 이미지 경로 설정 (템플릿 리터럴 활용)
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  console.log(title, type, category, price, location, description, sellerId, imageUrl)

  if (!sellerId || !title || !category || !location) {
    return res.status(400).json({ message: '필수 상품 정보를 입력해 주세요.', missingFields: { sellerId: !sellerId, title: !title, category: !category, location: !location } });
  }

  // 무료나눔(FREE) 선택 시 price는 0으로 강제 세팅
  const finalPrice = type === 'FREE' ? 0 : (price || 0);

  try {
    const [result] = await db.query(
      `INSERT INTO products (title, type, category, price, location, description, seller_id, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, type || 'SELL', category, finalPrice, location, description, sellerId, imageUrl]
    );

    return res.status(201).json({
      message: '상품이 성공적으로 등록되었습니다.',
      productId: result.insertId
    });
  } catch (error) {
    console.error('상품 등록 에러:', error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

export default router;