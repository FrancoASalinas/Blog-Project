import { Outlet } from 'react-router-dom';

function Login() {
  return (
    <div className='mx-auto max-w-sm'>
      <Outlet />
    </div>
  );
}

export default Login;
