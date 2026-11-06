import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

export default function ProductCreatePage() {
  const navigate = useNavigate();

  // 텍스트 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    type: 'SELL',
    category: '서적',
    price: 0,
    location: '',
    description: '',
  });

  // 파일 및 미리보기 상태
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // 텍스트 입력 처리
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
    }));
  };

  // 거래 유형 변경
  const handleTypeChange = (typeValue) => {
    setFormData((prev) => ({
      ...prev,
      type: typeValue,
      price: typeValue === 'FREE' ? 0 : prev.price,
    }));
  };

  // 파일 선택 및 미리보기 생성 처리
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // FileReader로 로컬 이미지 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 폼 제출 (FormData 활용)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 💡 localStorage에서 로그인한 유저의 ID 가져오기
    const sellerId = localStorage.getItem('userId');

    if (!sellerId) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      alert('필수 입력 항목을 모두 확인해 주세요.');
      return;
    }

    try {
      // loading 상태일때 제출 버튼을 비활성화하여 이중 클릭 방지
      setLoading(true);

      // 파일 업로드를 위한 FormData 객체 생성
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('type', formData.type);
      uploadData.append('category', formData.category);
      uploadData.append('price', formData.price);
      uploadData.append('location', formData.location);
      uploadData.append('description', formData.description);
      uploadData.append('sellerId', sellerId);

      // 파일이 선택된 경우에만 'image' 파라미터로 추가
      if (imageFile) {
        uploadData.append('image', imageFile);
      }
      
      await axios.post('/api/products', uploadData);

      alert('상품이 성공적으로 등록되었습니다!');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('상품 등록 실패:', error);
      alert(error.response?.data?.message || '상품 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>🛍️ 스쿨마켓 상품 등록</Title>
      <Form onSubmit={handleSubmit}>
        
        {/* 거래 유형 */}
        <FormGroup>
          <Label>거래 유형</Label>
          <RadioGroup>
            <TypeButton
              type="button"
              $active={formData.type === 'SELL'}
              onClick={() => handleTypeChange('SELL')}
            >
              💵 판매하기
            </TypeButton>
            <TypeButton
              type="button"
              $active={formData.type === 'FREE'}
              onClick={() => handleTypeChange('FREE')}
            >
              🎁 무료나눔
            </TypeButton>
          </RadioGroup>
        </FormGroup>

        {/* 상품 제목 */}
        <FormGroup>
          <Label htmlFor="title">상품 제목 *</Label>
          <Input
            id="title"
            type="text"
            name="title"
            placeholder="예: 깨끗하게 쓴 확률과 통계 교재 파급니다"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </FormGroup>

        {/* 카테고리 & 가격 */}
        <Row>
          <FormGroup style={{ flex: 1 }}>
            <Label htmlFor="category">카테고리</Label>
            <Select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="서적">서적</option>
              <option value="교복">교복</option>
              <option value="학용품">학용품</option>
              <option value="기타">기타</option>
            </Select>
          </FormGroup>

          <FormGroup style={{ flex: 1 }}>
            <Label htmlFor="price">가격 (원) *</Label>
            <Input
              id="price"
              type="number"
              name="price"
              min="0"
              step="500"
              disabled={formData.type === 'FREE'}
              value={formData.price}
              onChange={handleChange}
            />
          </FormGroup>
        </Row>

        {/* 📷 이미지 파일 업로드 & 미리보기 */}
        <FormGroup>
          <Label htmlFor="image">상품 이미지 선택</Label>
          <FileInput
            id="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {imagePreview && (
            <ImagePreviewContainer>
              <PreviewImage src={imagePreview} alt="선택한 상품 미리보기" />
            </ImagePreviewContainer>
          )}
        </FormGroup>

        {/* 교내 거래 장소 */}
        <FormGroup>
          <Label htmlFor="location">교내 거래 희망 장소 *</Label>
          <Input
            id="location"
            type="text"
            name="location"
            placeholder="예: 1층 중앙현관, 체육관 앞, 도서관 매점 앞"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </FormGroup>

        {/* 상세 설명 */}
        <FormGroup>
          <Label htmlFor="description">상품 상세 설명 *</Label>
          <TextArea
            id="description"
            name="description"
            rows="5"
            placeholder="물품의 상태, 사용 기간, 거래 가능 시간 등을 자세히 작성해 주세요."
            value={formData.description}
            onChange={handleChange}
            required
          />
        </FormGroup>

        {/* 버튼 영역 */}
        <ButtonGroup>
          <CancelButton
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            취소
          </CancelButton>
          <SubmitButton type="submit" disabled={loading}>
            {loading ? '등록 중...' : '상품 등록하기'}
          </SubmitButton>
        </ButtonGroup>

      </Form>
    </Container>
  );
}

/* ==========================================================================
   styled-components 스타일 정의
   ========================================================================== */

const Container = styled.div`
  max-width: 600px;
  margin: 30px auto;
  padding: 25px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  color: #333333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
`;

const Label = styled.label`
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 14px;
  color: #444444;
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #cccccc;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #4a90e2;
  }

  &:disabled {
    background-color: #f2f2f2;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  font-size: 14px;
  color: #555555;

  &::file-selector-button {
    padding: 8px 16px;
    margin-right: 12px;
    border-radius: 6px;
    border: 1px solid #cccccc;
    background-color: #f8f9fa;
    cursor: pointer;

    &:hover {
      background-color: #e2e6ea;
    }
  }
`;

const ImagePreviewContainer = styled.div`
  margin-top: 10px;
  width: 100%;
  max-height: 250px;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fafafa;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: contain;
`;

const Select = styled.select`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #cccccc;
  font-size: 14px;
  background-color: #ffffff;
  outline: none;

  &:focus {
    border-color: #4a90e2;
  }
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #cccccc;
  font-size: 14px;
  resize: vertical;
  outline: none;

  &:focus {
    border-color: #4a90e2;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const TypeButton = styled.button`
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  ${(props) =>
    props.$active
      ? `
        border: 2px solid #4A90E2;
        background-color: #EBF3FF;
        color: #4A90E2;
        font-weight: bold;
      `
      : `
        border: 1px solid #cccccc;
        background-color: #f8f9fa;
        color: #333333;
      `}
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  background-color: #e0e0e0;
  color: #333333;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: #d0d0d0;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SubmitButton = styled.button`
  flex: 2;
  padding: 12px;
  border: none;
  background-color: #4a90e2;
  color: #ffffff;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: #357abd;
  }

  &:disabled {
    background-color: #a0c4ed;
    cursor: not-allowed;
  }
`;