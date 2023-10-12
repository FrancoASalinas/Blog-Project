import { Outlet } from 'react-router-dom';

function Home() {
  return (
    <>
      <header></header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default Home;
