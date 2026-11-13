import { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import axios from 'axios'

const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsLoggedIn } = useOutletContext();
  const initialEmail = location.state?.email || '';
  const redirectPath = location.state?.redirectTo || '/';

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    email: initialEmail,
    password: '',
    nickname: '',
    phone_number: '',
    entry_year: currentYear,
    student_id: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      // 💡 [수정] formData 객체 전체를 백엔드로 전달
      const response = await axios.post('/api/users/signup', formData);

      // 💡 백엔드 응답(response.data)에서 token과 user 정보 추출
      const { token, user, message } = response.data;
      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userNickname', user.nickname);
        setIsLoggedIn(true)
        alert(message || '회원가입이 완료되어 자동으로 로그인되었습니다!');
        navigate(redirectPath);
      } else {
        // 토큰이 응답에 없다면 바로 로그인 페이지로 이동
        alert(message || '회원가입이 완료되었습니다.');
        navigate('/login');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert(error.response?.data?.message || '회원가입 실패');
    }
  };

  return (
    <Container>
      <Title>회원가입</Title>
      <Form onSubmit={handleSignup}>
        <Input name="email" value={formData.email} onChange={handleChange} placeholder="학교 이메일" required />
        <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="비밀번호" required />
        <Input name="nickname" value={formData.nickname} onChange={handleChange} placeholder="닉네임" required />
        <Input name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="전화번호" required />
        
        {/* 입학년도 선택 드롭다운 */}
        <Select name="entry_year" value={formData.entry_year} onChange={handleChange}>
          <option value={currentYear}>{currentYear}년 입학</option>
          <option value={currentYear - 1}>{currentYear - 1}년 입학</option>
          <option value={currentYear - 2}>{currentYear - 2}년 입학</option>
        </Select>

        <Input name="student_id" value={formData.student_id} onChange={handleChange} placeholder="학번 (예: 10315)" required />
        <SubmitButton type="submit">가입 및 시작하기</SubmitButton>
      </Form>
    </Container>
  );
};

export default SignupPage;

// 🎨 styled-components 정의
const Container = styled.div`
  padding: 40px 20px;
  max-width: 400px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #212529;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fff;
`;

const SubmitButton = styled.button`
  padding: 14px;
  background-color: #FF6F0F;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
`;