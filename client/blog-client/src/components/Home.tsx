import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      <h1 className='text-4xl text-center mt-2 font-semibold py-2'>
        <span className='font-dancing text-5xl relative border-b-[4px] border-dotted border-argentinian pb-[2px] inline-block'>SayIt</span>, whenever you like,
        however you like
      </h1>
      <p className='text-2xl py-2 text-center'>
        The world is yours, share it with everyone
      </p>
      <div className='flex justify-center gap-5 mt-5'>
        <Link to='/' className='text-xl p-2 bg-argentinian w-[90px] rounded-xl text-center border border-jet'>
          Register
        </Link>
        <Link to='/' className='text-xl p-2 bg-argentinian w-[90px] text-center rounded-xl border border-jet'>
          Sign in
        </Link>
      </div>
    </>
  );
}

export default Home;
