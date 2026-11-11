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
      SELECT p.id, p.title, p.price, p.type, p.category, p.status, p.location, p.created_at, u.nickname AS seller_nickname, p.image_url
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
       JOIN users u ON p.seller_id = u.id
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

// PUT /api/products/:id (상품 정보 수정)
router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, type, category, price, location, description } = req.body;

  try {
    // 1. 기존 이미지 유지 또는 새 파일 주소 반영
    let imageUrlSql = '';
    const queryParams = [title, type, category, price, location, description];

    if (req.file) {
      const imageUrl = `/uploads/${req.file.filename}`;
      imageUrlSql = `, image_url = ?`;
      queryParams.push(imageUrl);
    }

    queryParams.push(id);

    // 2. DB 업데이트
    const [result] = await db.query(
      `UPDATE products 
       SET title = ?, type = ?, category = ?, price = ?, location = ?, description = ? ${imageUrlSql}
       WHERE id = ?`,
      queryParams
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    res.json({ message: '상품이 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('❌ 상품 수정 DB 오류:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// DELETE /api/products/:id (상품 삭제)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // 1. 유효하지 않은 id 파라미터 방어
  if (!id || id === 'undefined' || isNaN(Number(id))) {
    return res.status(400).json({ message: '유효하지 않은 상품 ID입니다.' });
  }

  try {
    // 2. DB에서 해당 상품 삭제
    const [result] = await db.query(
      `DELETE FROM products WHERE id = ?`,
      [Number(id)]
    );

    // 3. 삭제 대상 레코드가 없는 경우 (이미 삭제되었거나 존재하지 않는 ID)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '존재하지 않거나 이미 삭제된 상품입니다.' });
    }

    // 4. 삭제 성공 응답
    res.status(200).json({ message: '상품이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('❌ 상품 삭제 DB 오류:', error.sqlMessage || error);
    res.status(500).json({ 
      message: '서버 오류로 인해 상품 삭제에 실패했습니다.', 
      error: error.sqlMessage || error.message 
    });
  }
});


// GET /api/products/user/:userId (특정 사용자가 등록한 상품 목록 조회)
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  // 1. userId 파라미터 유효성 검사 (NaN 또는 null/undefined 체크)
  if (!userId || userId === 'undefined' || isNaN(Number(userId))) {
    return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
  }

  try {
    // 2. 해당 사용자가 등록한 상품을 최신순(ORDER BY id DESC)으로 조회
    const [rows] = await db.query(
      `SELECT p.*, u.student_id FROM products p JOIN users u ON p.seller_id = u.id WHERE p.seller_id = ? ORDER BY p.id DESC`,
      [Number(userId)]
    );

    // 3. 등록한 상품이 없으면 빈 배열([]) 반환
    res.json(rows);
  } catch (error) {
    // 📌 백엔드 터미널에 에러 상세 출력
    console.error('❌ 내 판매 상품 목록 조회 DB 오류:', error.sqlMessage || error);
    res.status(500).json({ 
      message: '내가 등록한 상품 목록을 불러오는 중 서버 오류가 발생했습니다.', 
      error: error.sqlMessage || error.message 
    });
  }
});

export default router;