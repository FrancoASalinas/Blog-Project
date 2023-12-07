import { useState } from 'react';
import ArgentinianButton from '../components/ArgentinianButton';
import CustomInput from '../components/CustomInput';
import Divisor from '../components/Divisor';
import { useNavigate } from 'react-router-dom';

interface DataResponse {
  errors: string[];
}

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    fetch('http://localhost:5000/login', {
      body: JSON.stringify({
        username: username,
        password: password,
      }),
      headers: new Headers({ 'content-type': 'application/json'}),
      method: 'POST',
      credentials: 'include'
    })
      .then(res => {
        if (
          res.headers.get('content-type') === 'application/json; charset=utf-8'
        ) {
          return { data: res.json(), status: res.status };
        } else return { data: undefined, status: res.status };
      })
      .then(async res => {
        const data = (await res.data) as undefined | DataResponse;
        if (typeof data === 'undefined') {
          switch (res.status) {
            case 500:
              setErrors(prev => [...prev, 'Server error, try again later']);
              break;
            case 200:
              setErrors([]);
              navigate('/feed', {replace: true});
              break;
          }
          setLoading(false);
        } else if (typeof data === 'object' && res.status === 400) {
          if (data.errors.length > 0) {
            setErrors([...data.errors]);
            setLoading(false);
          } else {
            console.log('uh oh');
            setLoading(false);
          }
        }
      });
  }

  return (
    <>
      <h2 className='text-left text-3xl mx-auto max-w-xs'>Sign In</h2>
      <Divisor />
      <form
        onSubmit={e => handleSubmit(e)}
        className='flex flex-col pt-4 max-w-xs mx-auto justify-between gap-4'
      >
        <label htmlFor='username'>
          Username <span className='text-red-500'>*</span>
        </label>
        <CustomInput
          id='username'
          onChange={e => setUsername(e.target.value.trim())}
          autoFocus
          autoComplete='username'
        />
        <label htmlFor='password'>
          Password <span className='text-red-500'>*</span>
        </label>
        <CustomInput
          autoComplete='current-password'
          id='password'
          onChange={e => setPassword(e.target.value.trim())}
          password
        />
        <ul className='flex justify-center min-h-[20px]'>
          {errors.length > 0 &&
            errors.map(err => (
              <span key={err} className='text-sm text-red-500'>
                {err}
              </span>
            ))}
        </ul>
        <div className='items-center w-fit h-fit relative mx-auto'>
          <ArgentinianButton
            text='Sign in'
            disabled={username.length === 0 || password.length === 0}
          />
          <div className='absolute top-1/2 left-[120%] flex justify-center items-center -translate-y-1/2'>
            {loading && (
              <span className='loader'>
                <span className='text-transparent'>loading</span>
              </span>
            )}
          </div>
        </div>
      </form>
    </>
  );
}

export default LoginForm;
