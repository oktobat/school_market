import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const ProductEditPage = ()=>{
  const { id } = useParams();
  const navigate = useNavigate();

  // 폼 입력 상태
  const [title, setTitle] = useState('');
  const [type, setType] = useState('SELL'); // 'SELL' 또는 'FREE'
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // 이미지 처리 상태 (기존 이미지 URL + 새 첨부 파일)
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. 기존 상품 정보 불러오기
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${id}`);
        const data = response.data;

        setTitle(data.title || '');
        setType(data.type || 'SELL');
        setCategory(data.category || '');
        setPrice(data.price ? String(data.price) : '');
        setLocation(data.location || '');
        setDescription(data.description || '');

        const img = data.imageUrl || data.image_url || '';
        setExistingImageUrl(img);
        setImagePreview(img);
      } catch (err) {
        console.error('상품 정보 로드 실패:', err);
        alert('상품 정보를 불러오는데 실패했습니다.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // 이미지 변경 파일 선택
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 2. 수정 제출 (FormData 전송)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !category || !location.trim()) {
      alert('필수 항목(제목, 카테고리, 거래 장소)을 입력해 주세요.');
      return;
    }

    if (type === 'SELL' && (!price || Number(price) <= 0)) {
      alert('판매 가격을 올바르게 입력해 주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('type', type);
      formData.append('category', category);
      formData.append('price', type === 'FREE' ? 0 : price);
      formData.append('location', location);
      formData.append('description', description);

      // 새로운 이미지를 선택했을 때만 파일 첨부
      if (imageFile) {
        formData.append('image', imageFile);
      }

      // 서버로 PUT 요청 전송
      await axios.put(`/api/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('상품 정보가 수정되었습니다.');
      navigate(`/product/${id}`, { replace: true });
    } catch (err) {
      console.error('상품 수정 실패:', err);
      alert(err.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <StatusMessage>기존 상품 정보를 불러오는 중...</StatusMessage>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderBar>
        <Title>상품 정보 수정</Title>
        <CancelButton onClick={() => navigate(-1)}>취소</CancelButton>
      </HeaderBar>

      <Form onSubmit={handleSubmit}>
        {/* 거래 유형 (판매 / 나눔) */}
        <FormGroup>
          <Label>거래 유형</Label>
          <RadioGroup>
            <RadioLabel $active={type === 'SELL'}>
              <input
                type="radio"
                name="type"
                value="SELL"
                checked={type === 'SELL'}
                onChange={(e) => setType(e.target.value)}
              />
              💵 판매하기
            </RadioLabel>
            <RadioLabel $active={type === 'FREE'}>
              <input
                type="radio"
                name="type"
                value="FREE"
                checked={type === 'FREE'}
                onChange={(e) => {
                  setType(e.target.value);
                  setPrice('0');
                }}
              />
              🎁 무료나눔
            </RadioLabel>
          </RadioGroup>
        </FormGroup>

        {/* 상품 대표 이미지 변경 */}
        <FormGroup>
          <Label>상품 이미지</Label>
          <ImageUploadArea>
            {imagePreview ? (
              <PreviewImage src={imagePreview} alt="미리보기" />
            ) : (
              <NoImagePreview>등록된 이미지 없음</NoImagePreview>
            )}
            <FileInputLabel htmlFor="image-input">이미지 변경하기</FileInputLabel>
            <HiddenInput
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </ImageUploadArea>
        </FormGroup>

        {/* 제목 */}
        <FormGroup>
          <Label>제목 *</Label>
          <Input
            type="text"
            placeholder="상품 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormGroup>

        {/* 카테고리 */}
        <FormGroup>
          <Label>카테고리 *</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="서적">서적</option>
            <option value="교복">교복</option>
            <option value="학용품">학용품</option>
            <option value="기타">기타</option>
          </Select>
        </FormGroup>

        {/* 가격 */}
        {type === 'SELL' && (
          <FormGroup>
            <Label>판매 가격 (원) *</Label>
            <Input
              type="number"
              placeholder="가격을 입력하세요"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </FormGroup>
        )}

        {/* 희망 거래 장소 */}
        <FormGroup>
          <Label>희망 거래 장소 *</Label>
          <Input
            type="text"
            placeholder="예: 강남역 3번 출구 앞"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </FormGroup>

        {/* 상세 설명 */}
        <FormGroup>
          <Label>상품 상세 설명</Label>
          <Textarea
            rows="6"
            placeholder="상품의 상태, 구매 시기, 하자 유무 등을 상세히 적어주세요."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={submitting}>
          {submitting ? '수정 중...' : '수정 완료'}
        </SubmitButton>
      </Form>
    </Container>
  );
}


export default ProductEditPage;

/* ==========================================
   Styled Components
   ========================================== */

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const StatusMessage = styled.div`
  text-align: center;
  padding: 60px 0;
  color: #666;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #212529;
  margin: 0;
`;

const CancelButton = styled.button`
  background: none;
  border: none;
  color: #868e96;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    color: #212529;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #495057;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const RadioLabel = styled.label`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px solid ${(props) => (props.$active ? '#228be6' : '#ced4da')};
  background-color: ${(props) => (props.$active ? '#e7f5ff' : '#ffffff')};
  color: ${(props) => (props.$active ? '#1c7ed6' : '#495057')};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;

  input {
    display: none;
  }
`;

const ImageUploadArea = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PreviewImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const NoImagePreview = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  background-color: #f1f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #adb5bd;
`;

const FileInputLabel = styled.label`
  padding: 8px 16px;
  background-color: #f1f3f5;
  color: #495057;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background-color: #e9ecef;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: #228be6;
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  background-color: #ffffff;
  &:focus {
    outline: none;
    border-color: #228be6;
  }
`;

const Textarea = styled.textarea`
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: #228be6;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: #228be6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background-color: #1c7ed6;
  }
  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;