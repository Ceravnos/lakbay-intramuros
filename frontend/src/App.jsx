import { Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import TravelDetailPage from './pages/TravelDetailPage'
import CreatePage from './pages/CreatePage'


const App = () => {
  return (
    <div className="relative h-full w-full bg-yellow-50/10">
      {/* <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 
              [background:radial-gradient(123%_125%at_50%10%,#000_60%,#f5cf12_100%)]"/> */}
      <div class="absolute top-0 z-[-2] h-screen w-screen bg-white 
            bg-[radial-gradient(100%_50%_at_50%_0%,rgba(245,207,18,0.13)_0,rgba(245,207,18,0)_50%,rgba(245,207,18,0)_100%)]"></div>
      <Routes>
        <Route path="/" element={<HomePage /> } />
        <Route path="/create" element={<CreatePage /> } />
        <Route path="/travel/:id" element={<TravelDetailPage /> } />
      </Routes>
    </div>
  );
}

export default App;