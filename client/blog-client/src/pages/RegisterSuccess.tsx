import ArgentinianButton from '../components/ArgentinianButton';

function RegisterSuccess() {
  return (
    <>
      <h2 className='text-left text-3xl px-2'>
        Registered <br /> Successfully
      </h2>
      <div className='bg-jet w-full h-[1px] my-1'></div>
      <div className='flex flex-col gap-5 p-2 mx-auto'>
        <p className='text-4xl text-left'>
        You registered successfully, welcome to the fun part!
        </p>
        <p className='text-xl'>Start your journey signing in</p>
        <ArgentinianButton text='Sign In' />
      </div>
    </>
  );
}

export default RegisterSuccess;
