import { Outlet } from 'react-router-dom';
import Header from './components/Header';

function App() {
  return (
    <div className='relative'>
      <Header/>
      <main className='font-urbanist px-5'>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
