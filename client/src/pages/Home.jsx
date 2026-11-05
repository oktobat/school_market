import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CATEGORIES = ['전체', '서적', '교복', '학용품', '기타'];

const Home = () => {
  const navigate = useNavigate();
  // 1. 초기 상태를 빈 배열([])로 설정
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. 컴포넌트 마운트 시 백엔드 API(DB) 데이터 불러오기
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // GET /api/products 연동
        const response = await axios.get('/api/products');
        setProducts(response.data);
      } catch (err) {
        console.error('상품 목록 불러오기 실패:', err);
        setError('상품 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 3. 카테고리 필터링
  const filteredProducts = selectedCategory === '전체'
    ? products
    : products.filter(item => item.category === selectedCategory);

  // 로딩 및 에러 예외 처리
  if (loading) return <StateMessage>상품 목록을 불러오는 중...</StateMessage>;
  if (error) return <StateMessage style={{ color: '#e74c3c' }}>{error}</StateMessage>;

  return (
    <HomeContainer>
      {/* 1. 카테고리 태그 바 */}
      <CategoryNav>
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            $active={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </CategoryChip>
        ))}
      </CategoryNav>

      {/* 2. 게시글 목록 영역 */}
      <ProductList>
        {filteredProducts.length === 0 ? (
          <StateMessage>등록된 상품이 없습니다.</StateMessage>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <Thumbnail 
                src={product.image_url || 'https://via.placeholder.com/150'} 
                alt={product.title} 
              />

              <InfoArea>
                <Title>{product.title}</Title>
                
                <Meta>
                  <LocationTag>📍 {product.location}</LocationTag>
                  <Dot>•</Dot>
                  {/* DB TIMESTAMP를 날짜 문자열로 변환 */}
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </Meta>

                <PriceRow>
                  {product.status === 'RESERVED' && <Badge $type="reserved">예약중</Badge>}
                  {product.status === 'COMPLETED' && <Badge $type="completed">거래완료</Badge>}
                  
                  <Price>
                    {product.type === 'FREE' || Number(product.price) === 0 ? (
                      <FreeText>무료나눔 🎁</FreeText>
                    ) : (
                      `${Number(product.price).toLocaleString()}원`
                    )}
                  </Price>
                </PriceRow>
              </InfoArea>
            </ProductCard>
          ))
        )}
      </ProductList>
    </HomeContainer>
  );
};

export default Home;

/* ==========================================================================
   🎨 기존 styled-components 스타일 유지
   ========================================================================== */

const HomeContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const CategoryNav = styled.nav`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f3f5;
  overflow-x: auto;
  white-space: nowrap;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryChip = styled.button`
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid ${props => (props.$active ? '#FF6F0F' : '#e9ecef')};
  background-color: ${props => (props.$active ? '#FF6F0F' : '#fff')};
  color: ${props => (props.$active ? '#fff' : '#495057')};
  font-size: 13px;
  font-weight: ${props => (props.$active ? '600' : '400')};
  cursor: pointer;
  transition: all 0.15s ease-in-out;
`;

const ProductList = styled.div`
  padding: 0 16px;
`;

const ProductCard = styled.article`
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:active {
    background-color: #f8f9fa;
  }
`;

const Thumbnail = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 16px;
  background-color: #f1f3f5;
  flex-shrink: 0;
`;

const InfoArea = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
`;

const Title = styled.h2`
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #212529;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.div`
  font-size: 12px;
  color: #868e96;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
`;

const LocationTag = styled.span`
  font-weight: 500;
  color: #495057;
`;

const Dot = styled.span`
  margin: 0 4px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Price = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #212529;
`;

const FreeText = styled.span`
  color: #FF6F0F;
  font-weight: 700;
`;

const Badge = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  color: #fff;
  background-color: ${props => (props.$type === 'reserved' ? '#2b8a3e' : '#868e96')};
`;

/* 추가된 메시지 UI 스타일 */
const StateMessage = styled.div`
  text-align: center;
  padding: 40px 16px;
  color: #868e96;
  font-size: 14px;
`;