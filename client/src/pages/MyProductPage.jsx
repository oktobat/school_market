import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

export default function MyProductsPage({ currentUserId }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 로그인 유저 ID 가져오기 (Prop 또는 localStorage)
  const userId = currentUserId || localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }

    const fetchMyProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/user/${userId}`);
        setProducts(response.data);
      } catch (err) {
        console.error('내 판매 상품 로드 실패:', err);
        setError('상품 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyProducts();
  }, [userId, navigate]);

  if (loading) return <Container><StatusMessage>내가 등록한 상품을 불러오는 중...</StatusMessage></Container>;
  if (error) return <Container><StatusMessage>{error}</StatusMessage></Container>;

  return (
    <Container>
      <HeaderBar>
        <Title>내가 판매 중인 상품 ({products.length})</Title>
        <BackButton onClick={() => navigate(-1)}>← 뒤로가기</BackButton>
      </HeaderBar>

      {products.length === 0 ? (
        <EmptyState>
          <EmptyText>아직 등록한 판매/나눔 상품이 없습니다.</EmptyText>
          <WriteButton onClick={() => navigate('/write')}>상품 등록하러 가기</WriteButton>
        </EmptyState>
      ) : (
        <ProductGrid>
          {products.map((item) => (
            <Card key={item.id} onClick={() => navigate(`/product/${item.id}`)}>
              <ImageWrapper>
                {item.imageUrl ? (
                  <ProductImage src={item.imageUrl} alt={item.title} />
                ) : (
                  <NoImage>이미지 없음</NoImage>
                )}
                <TypeBadge $isFree={item.type === 'FREE'}>
                  {item.type === 'FREE' ? '🎁 나눔' : '💵 판매'}
                </TypeBadge>
              </ImageWrapper>

              <CardContent>
                <ProductTitle>{item.title}</ProductTitle>
                <PriceText>
                  {item.type === 'FREE' || Number(item.price) === 0
                    ? '무료나눔'
                    : `${Number(item.price)?.toLocaleString()}원`}
                </PriceText>
                <LocationText>📍 {item.location}</LocationText>
              </CardContent>
            </Card>
          ))}
        </ProductGrid>
      )}
    </Container>
  );
}

/* ==========================================
   Styled Components
   ========================================== */

const Container = styled.div`
  max-width: 900px;
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
  border-bottom: 2px solid #f1f3f5;
  padding-bottom: 16px;
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #212529;
  margin: 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    color: #212529;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 0;
  background-color: #f8f9fa;
  border-radius: 12px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  color: #868e96;
  margin-bottom: 16px;
`;

const WriteButton = styled.button`
  padding: 10px 20px;
  background-color: #228be6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background-color: #1c7ed6;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 180px;
  background-color: #f8f9fa;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NoImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 13px;
`;

const TypeBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #ffffff;
  background-color: ${(props) => (props.$isFree ? '#20c997' : '#4c6ef5')};
`;

const CardContent = styled.div`
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ProductTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #212529;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PriceText = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #212529;
`;

const LocationText = styled.div`
  font-size: 12px;
  color: #868e96;
`;