import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const ProfileEditPage = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    email: '',
    currentPassword: '', // 본인 확인용 입력 비밀번호
    nickname: '',
    phone_number: '',
    entry_year: '',
    student_id: '',
  });

  const [loading, setLoading] = useState(true);
  
  // 💡 모달 open 여부 및 입력받을 비밀번호 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');


  // 1. 기존 프로필 정보 불러오기 (GET /api/users/me)
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('로그인이 필요한 서비스입니다.');
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          alert(errorData?.message || `요청 실패 (상태 코드: ${response.status})`);
          return;
        }

        const data = await response.json();
        setProfile((prev) => ({
          ...prev,
          email: data.email || '',
          nickname: data.nickname || '',
          phone_number: data.phone_number || '',
          entry_year: data.entry_year || '',
          student_id: data.student_id || '',
        }));
      } catch (error) {
        console.error('프로필 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // 비밀번호 입력 여부 확인 (공백 제외 유효성)
  const isPasswordEntered = profile.currentPassword.trim() !== '';

    // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 2. 프로필 수정 저장 제출 (PUT /api/users/me)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordEntered) {
      alert('현재 비밀번호를 입력해 주세요.');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: profile.currentPassword,
          nickname: profile.nickname,
          phone_number: profile.phone_number,
          student_id: profile.student_id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('프로필 정보가 성공적으로 수정되었습니다!');
        navigate('/');
      } else {
        alert(data.message || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 수정 오류:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    }
  };

  // 탈퇴 진행 처리 (모달 안에서 최종 제출 버튼 클릭 시)
  const handleConfirmWithdrawal = async (e) => {
    e.preventDefault();

    if (!withdrawPassword.trim()) {
      alert('비밀번호를 입력해 주세요.');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: withdrawPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('회원 탈퇴가 성공적으로 완료되었습니다.');
        localStorage.clear();
        setIsLoggedIn(false);
        navigate('/', { replace: true });
      } else {
        alert(data.message || '탈퇴 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원 탈퇴 오류:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <LoadingText>프로필 정보를 불러오는 중...</LoadingText>;
  }

  return (
    <Container>
      <Title>프로필 수정</Title>
      
      <Form onSubmit={handleSubmit}>
        {/* 학교 이메일 (수정 불가 - 읽기 전용) */}
        <FormGroup>
          <Label>학교 이메일 (수정 불가)</Label>
          <DisabledInput value={profile.email} disabled />
        </FormGroup>

        {/* 입학년도 (수정 불가 - 읽기 전용) & 학번 (수정 가능) */}
        <RowGroup>
          <FormGroup>
            <Label>입학년도 (수정 불가)</Label>
            <DisabledInput value={profile.entry_year ? `${profile.entry_year}년 입학` : ''} disabled />
          </FormGroup>

          <FormGroup>
            <Label>학번</Label>
            <Input
              name="student_id"
              value={profile.student_id}
              onChange={handleChange}
              placeholder="학번 (예: 10315)"
              required
            />
          </FormGroup>
        </RowGroup>

        {/* 닉네임 (수정 가능) */}
        <FormGroup>
          <Label>닉네임</Label>
          <Input
            name="nickname"
            value={profile.nickname}
            onChange={handleChange}
            placeholder="닉네임을 입력하세요"
            required
          />
        </FormGroup>

        {/* 전화번호 (수정 가능) */}
        <FormGroup>
          <Label>전화번호</Label>
          <Input
            name="phone_number"
            value={profile.phone_number}
            onChange={handleChange}
            placeholder="전화번호를 입력하세요"
            required
          />
        </FormGroup>

        {/* 본인 확인용 비밀번호 */}
        <FormGroup>
          <Label>현재 비밀번호 (본인 확인)</Label>
          <Input
            type="password"
            name="currentPassword"
            value={profile.currentPassword}
            onChange={handleChange}
            placeholder="현재 비밀번호를 입력하세요"
            required
          />
        </FormGroup>

        {/* 비밀번호가 입력되면 저장 버튼 활성화 */}
        <SubmitButton type="submit" disabled={!isPasswordEntered}>
          수정사항 저장
        </SubmitButton>
      </Form>

      {/* 회원 탈퇴 트리거 버튼 */}
    <WithdrawalSection>
      <WithdrawalButton type="button" onClick={() => setIsModalOpen(true)}>
        회원 탈퇴
      </WithdrawalButton>
    </WithdrawalSection>

    {/* 💡 회원 탈퇴 비밀번호 확인 모달 */}
    {isModalOpen && (
      <ModalOverlay onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>회원 탈퇴 확인</ModalTitle>
          <ModalDescription>
            정말로 탈퇴하시겠습니까?<br />
            본인 확인을 위해 현재 비밀번호를 입력해 주세요.
          </ModalDescription>

          <ModalForm onSubmit={handleConfirmWithdrawal}>
            <Input
              type="password"
              placeholder="비밀번호 입력"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
              required
            />
            <ModalButtonGroup>
              <CancelButton type="button" onClick={() => setIsModalOpen(false)}>
                취소
              </CancelButton>
              <ConfirmWithdrawButton type="submit">
                탈퇴하기
              </ConfirmWithdrawButton>
            </ModalButtonGroup>
          </ModalForm>
        </ModalContent>
      </ModalOverlay>
    )}
    </Container>
  );
};

export default ProfileEditPage;

// 🎨 styled-components
const Container = styled.div`
  padding: 40px 20px;
  max-width: 440px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 28px;
  color: #212529;
  text-align: center;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 60px 0;
  color: #868e96;
  font-size: 15px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
`;

const RowGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #495057;
`;

const Input = styled.input`
  padding: 12px 14px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: #FF6F0F;
  }
`;

const DisabledInput = styled.input`
  padding: 12px 14px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  background-color: #f8f9fa;
  color: #495057;
  cursor: not-allowed;
`;

const SubmitButton = styled.button`
  padding: 14px;
  background-color: ${(props) => (props.disabled ? '#ced4da' : '#FF6F0F')};
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 15px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  margin-top: 10px;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => (props.disabled ? '#ced4da' : '#e55e00')};
  }
`;

const WithdrawalSection = styled.div`
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid #f1f3f5;
  text-align: center;
`;

const WithdrawalButton = styled.button`
  background: none;
  border: none;
  color: #adb5bd;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: #e03131;
  }
`;

/* 모달 오버레이 (배경 어둡게) */
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #ffffff;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #212529;
  margin-bottom: 10px;
`;

const ModalDescription = styled.p`
  font-size: 13px;
  color: #495057;
  line-height: 1.5;
  margin-bottom: 16px;
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ModalButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const CancelButton = styled.button`
  padding: 8px 14px;
  background: #e9ecef;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
`;

const ConfirmWithdrawButton = styled.button`
  padding: 8px 14px;
  background: #e03131;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #c92a2a;
  }
`;