import logo from '../assets/SayIt-logo.svg'

function Header() {
    return ( 
        <header className='flex justify-center pb-2 w-full'>
            <img src={logo} alt="logo" className='ml-[12%]' />
        </header>
     );
}

export default Header;