import {useState } from 'react'
import {Route, Routes} from 'react-router-dom'
import Layout from './Layout'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProductCreatePage from './pages/ProductCreatePage'
import ProfileEditPage from './pages/ProfileEditPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductEditPage from './pages/ProductEditPage'
import MyProductPage from './pages/MyProductPage'

const App = () => {
  // 로컬 스토리지의 토큰 존재 여부로 초기 로그인 상태 설정
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));

  return (
    <Routes>
      <Route element={<Layout isLoggedIn={isLoggedIn} 
        setIsLoggedIn={setIsLoggedIn} 
        currentUserId={currentUserId}
        setCurrentUserId={setCurrentUserId} />}>
        <Route path="/" element={<Home />} />
        {/* 인증 관련 라우트 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/mypage/edit" element={<ProfileEditPage />} />
        <Route path="/mypage/products" element={<MyProductPage />} />
        <Route path="/write" element={<ProductCreatePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/product/edit/:id" element={<ProductEditPage />} />
      </Route>
    </Routes>
  )
}

export default App