import { useState } from 'react';
import ArgentinianButton from '../components/ArgentinianButton';
import { useNavigate } from 'react-router-dom';

interface DataResponse {
  errors: {
    username: string[] | undefined;
    password: string[] | undefined;
    confirm_password: string[] | undefined;
  };
}

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inputErrors, setInputErrors] = useState<DataResponse['errors']>();
  const [serverError, setServerError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const redirect = useNavigate();

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (success === true) return;

    const data = {
      username: username,
      password: password,
      confirm_password: confirmPassword,
    };

    await fetch('http://localhost:5000/register', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new Headers({
        'content-type': 'application/json',
      }),
    })
      .then(res => {
        const contentType = res.headers.get('content-type');

        if (contentType === 'application/json; charset=utf-8') {
          return { data: res.json(), status: res.status };
        } else {
          return { data: undefined, status: res.status };
        }
      })
      .then(async res => {
        const data = (await res.data) as DataResponse | undefined;

        if (data === undefined) {
          switch (res.status) {
            case 400:
              setServerError('Every input is required');
              break;
            case 409:
              setServerError('Username already taken');
              break;
            case 500:
              setServerError('Server error, try again later');
              break;
            case 200:
              setServerError('');
              setSuccess(true);
              redirect('success');
          }
        } else if (Object.keys(data.errors).length > 0 && res.status === 400) {
          setInputErrors(data.errors);
        }
      });
  }

  function expandList(arr: any[] | undefined) {
    if (typeof arr === 'object' && arr.length > 1) {
      return true;
    } else return false;
  }

  const errors = {
    isShorter: (input: string, n: number) => {
      return input.length < n && `Input must be longer than ${n} characters`;
    },
    isLarger: (input: string, n: number) => {
      return input.length > n && `Input must be shorter than ${n} characters`;
    },
    isInvalid: (input: string) => {
      return !input.match(/\w/) && 'Input has invalid characters';
    },
  };

  return (
    <>
      <h2 className='text-left text-3xl mx-auto max-w-xs'>Sign up</h2>
      <div className='bg-jet w-full h-[1px] my-1'></div>
      <form
        onSubmit={e => handleSubmit(e)}
        className='flex flex-col max-w-xs mx-auto justify-between'
      >
        <div className='flex flex-col gap-1'>
          <label htmlFor='username'>Username</label>
          <input
            type='text'
            onChange={e => setUsername(e.target.value.trim())}
            name='username'
            id='username'
            className='outline-none p-[5px] text-xl border-jet border rounded-sm'
            autoFocus
          />
          <ul
            className={`${
              expandList(inputErrors?.username) ? 'h-[38px]' : 'h-[14px]'
            }  mb-1 transition-all flex flex-col`}
          >
            {typeof inputErrors?.username === 'object'
              ? inputErrors.username.map(err => {
                  return <span className='text-xs text-red-500'>{err}</span>;
                })
              : username.length > 0 && (
                  <span className='text-xs text-red-500'>
                    {errors.isShorter(username, 4) ||
                      errors.isLarger(username, 16) ||
                      errors.isInvalid(username)}
                  </span>
                )}
          </ul>
        </div>
        <div className='flex flex-col gap-1'>
          <label htmlFor='password'>Password</label>
          <input
            type='password'
            onChange={e => setPassword(e.target.value.trim())}
            name='password'
            id='password'
            className='outline-none p-[5px] border-jet text-xl border rounded-sm'
          />
          <ul
            className={`${
              expandList(inputErrors?.password) ? 'h-[38px]' : 'h-[14px]'
            }  mb-1 transition-all flex flex-col`}
          >
            {typeof inputErrors?.password === 'object'
              ? inputErrors.password.map(err => {
                  return <span className='text-xs text-red-500'>{err}</span>;
                })
              : password.length > 0 && (
                  <span className='text-xs text-red-500'>
                    {errors.isShorter(password, 6) ||
                      errors.isLarger(password, 20) ||
                      errors.isInvalid(password)}
                  </span>
                )}
          </ul>
        </div>
        <div className='flex flex-col gap-1'>
          <label htmlFor='password'>Confirm Password</label>
          <input
            type='password'
            onChange={e => setConfirmPassword(e.target.value)}
            name='confirm_password'
            id='confirm_password'
            className='outline-none p-[5px] border-jet text-xl border rounded-sm'
          />
        </div>
        <ul className='h-[16px] mb-1'>
          {typeof inputErrors?.confirm_password === 'object' &&
            inputErrors.confirm_password.map(err => (
              <span className='text-xs text-red-500'>{err}</span>
            ))}
        </ul>
        <ul className='h-[24px] flex justify-center w-full'>
          {serverError.length > 0 && (
            <span className='text-red-500 text-center block text-xs'>
              {serverError}
            </span>
          )}
        </ul>
        <div className='flex justify-center flex-col items-center'>
          <ArgentinianButton text='Register' />
        </div>
      </form>
    </>
  );
}

export default RegisterForm;
