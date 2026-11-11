import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

const ProductDetailPage = ({ isLoggedIn, currentUserId })=>{
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error('상품 정보 불러오기 실패:', err);
        setError('상품을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // 삭제 처리
  const handleDelete = async () => {
    if (!window.confirm('정말로 이 상품 글을 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/products/${id}`);
      alert('상품이 삭제되었습니다.');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('삭제 실패:', err);
      alert(err.response?.data?.message || '삭제 작업에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <Container>
        <StatusMessage>상품 정보를 불러오는 중...</StatusMessage>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container>
        <StatusMessage>{error || '존재하지 않는 상품입니다.'}</StatusMessage>
      </Container>
    );
  }

  // 💡 DB에서 전달받은 값
  const imageUrl = product.image_url
  const sellerId = product.seller_id;
  const sellerNickname = product.seller_nickname;
  // 💡 로그인되어 있고, 로그인한 유저 ID와 작성자 ID가 일치하는지 확인
  const isSeller = Boolean(
    isLoggedIn && 
    currentUserId && 
    sellerId && 
    String(currentUserId) === String(sellerId)
  );

  return (
    <Container>
      {/* 상단 네비게이션/액션 헤더 */}
      <HeaderBar>
        <BackButton onClick={() => navigate(-1)}>← 목록으로</BackButton>

        {/* 💡 isSeller가 true일 때만 수정/삭제 버튼 노출 */}
        {isSeller && (
          <SellerActions>
            <EditButton onClick={() => navigate(`/product/edit/${id}`)}>수정</EditButton>
            <DeleteButton onClick={handleDelete}>삭제</DeleteButton>
          </SellerActions>
        )}
      </HeaderBar>

      <ContentWrapper>
        {/* 상품 이미지 영역 */}
        <ImageSection>
          {imageUrl ? (
            <ProductImage src={imageUrl? imageUrl : 'https://via.placeholder.com/150'} alt={product.title} />
          ) : (
            <NoImage>등록된 이미지가 없습니다.</NoImage>
          )}
        </ImageSection>

        {/* 상품 상세 정보 영역 */}
        <InfoSection>
          <BadgeGroup>
            <TypeBadge $isFree={product.type === 'FREE'}>
              {product.type === 'FREE' ? '🎁 무료나눔' : '💵 판매하기'}
            </TypeBadge>
            <CategoryBadge>{product.category}</CategoryBadge>
          </BadgeGroup>

          <Title>{product.title}</Title>

          <PriceContainer>
            {product.type === 'FREE' || Number(product.price) === 0 ? (
              <PriceText $isFree>무료나눔 🎁</PriceText>
            ) : (
              <PriceText>{Number(product.price)?.toLocaleString()}원</PriceText>
            )}
          </PriceContainer>

          <MetaInfoList>
            <MetaItem>
              <MetaLabel>📍 희망 거래 장소</MetaLabel>
              <MetaValue>{product.location}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>👤 판매자</MetaLabel>
              <MetaValue>{sellerNickname || '익명'}</MetaValue>
            </MetaItem>
          </MetaInfoList>

          <DescriptionContainer>
            <DescriptionTitle>상품 상세 설명</DescriptionTitle>
            <DescriptionText>{product.description}</DescriptionText>
          </DescriptionContainer>

          {/* 액션 버튼 */}
          {!isSeller ? (
            <ContactButton>
              💬 판매자와 채팅하기
            </ContactButton>
          ) : (
            <DisabledButton disabled>
              내가 등록한 상품입니다
            </DisabledButton>
          )}
        </InfoSection>
      </ContentWrapper>
    </Container>
  );
}

export default ProductDetailPage;

/* ==========================================
   Styled Components
   ========================================== */

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const StatusMessage = styled.div`
  text-align: center;
  padding: 60px 0;
  font-size: 16px;
  color: #666;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: #333;
    text-decoration: underline;
  }
`;

const SellerActions = styled.div`
  display: flex;
  gap: 8px;
`;

const EditButton = styled.button`
  padding: 6px 14px;
  background-color: #ffffff;
  border: 1px solid #ced4da;
  border-radius: 6px;
  color: #495057;
  font-size: 13px;
  cursor: pointer;
  &:hover {
    background-color: #f8f9fa;
  }
`;

const DeleteButton = styled.button`
  padding: 6px 14px;
  background-color: #ffffff;
  border: 1px solid #ffa8a8;
  border-radius: 6px;
  color: #e03131;
  font-size: 13px;
  cursor: pointer;
  &:hover {
    background-color: #fff5f5;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const ImageSection = styled.div`
  flex: 1;
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #f1f3f5;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const NoImage = styled.div`
  color: #868e96;
  font-size: 14px;
`;

const InfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BadgeGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const TypeBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.$isFree ? '#e7f5ff' : '#f1f3f5')};
  color: ${(props) => (props.$isFree ? '#1c7ed6' : '#495057')};
`;

const CategoryBadge = styled.span`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f8f9fa;
  color: #868e96;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #212529;
  margin: 0;
`;

const PriceContainer = styled.div`
  margin-bottom: 8px;
`;

const PriceText = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: ${(props) => (props.$isFree ? '#1c7ed6' : '#212529')};
`;

const MetaInfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #f1f3f5;
  border-bottom: 1px solid #f1f3f5;
`;

const MetaItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
`;

const MetaLabel = styled.span`
  color: #868e96;
`;

const MetaValue = styled.span`
  color: #212529;
  font-weight: 500;
`;

const DescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DescriptionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin: 0;
`;

const DescriptionText = styled.p`
  font-size: 14px;
  color: #343a40;
  line-height: 1.6;
  white-space: pre-wrap; /* 줄바꿈 유지 */
  margin: 0;
`;

const ContactButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: #228be6;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 8px;

  &:hover {
    background-color: #1c7ed6;
  }
`;

const DisabledButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: #e9ecef;
  color: #adb5bd;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: not-allowed;
  margin-top: 8px;
`;