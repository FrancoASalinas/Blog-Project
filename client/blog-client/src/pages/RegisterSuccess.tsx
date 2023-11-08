import { Link } from 'react-router-dom';
import ArgentinianButton from '../components/ArgentinianButton';
import Divisor from '../components/Divisor';

function RegisterSuccess() {
  return (
    <>
      <h2 className='text-left text-3xl max-w-xs'>
        Registered <br /> Successfully
      </h2>
      <Divisor />
      <div className='flex flex-col max-w-xs gap-5 mx-auto'>
        <p className='text-4xl text-left'>
          You registered successfully, welcome to the fun part!
        </p>
        <p className='text-xl'>Start your journey signing in</p>
        <Link to='/login'>
          <ArgentinianButton text='Sign In' />
        </Link>
      </div>
    </>
  );
}

export default RegisterSuccess;
