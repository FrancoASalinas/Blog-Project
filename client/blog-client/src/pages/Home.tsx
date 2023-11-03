import { Link } from 'react-router-dom';
import ArgentinianButton from '../components/ArgentinianButton';

function Home() {
  return (
    <>
      <h1 className='text-4xl text-center mt-2 font-semibold py-2'>
        <span className='font-dancing text-5xl relative border-b-[4px] border-dotted border-argentinian pb-[2px] inline-block'>
          SayIt
        </span>
        , whenever you like, however you like
      </h1>
      <p className='text-2xl py-2 text-center'>
        The world is yours, share it with everyone
      </p>
      <div className='flex justify-center gap-5 mt-5'>
        <Link to='/register'>
          <ArgentinianButton text='Register' />
        </Link>
        <Link to='/'>
          <ArgentinianButton text='Sign In' />
        </Link>
      </div>
    </>
  );
}

export default Home;
