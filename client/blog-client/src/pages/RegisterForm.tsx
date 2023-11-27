import { useState } from 'react';
import ArgentinianButton from '../components/ArgentinianButton';
import { useNavigate } from 'react-router-dom';
import Divisor from '../components/Divisor';
import CustomInput from '../components/CustomInput';

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: any) {
    e.preventDefault();

    setLoading(true);

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
              navigate('success', {replace: true, state: {success: true}});
              setLoading(false);
          }
          setLoading(false);
        } else if (Object.keys(data.errors).length > 0 && res.status === 400) {
          setInputErrors(data.errors);
          setLoading(false);
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
      const regEx = /^[^.]([a-z]{1,}|[0-9])+[^.]$/i;

      return !regEx.test(input) && 'Input has invalid characters';
    },
  };

  return (
    <>
      <h2 className='text-left text-3xl mx-auto max-w-xs'>Sign up</h2>
      <Divisor />
      <form
        onSubmit={e => handleSubmit(e)}
        className='flex flex-col max-w-xs mx-auto justify-between'
      >
        <div className='flex flex-col gap-1'>
          <label htmlFor='username'>Username</label>
          <CustomInput
            autoComplete='username'
            autoFocus
            id='username'
            onChange={e => setUsername(e.target.value.trim())}
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
          <CustomInput
            id='password'
            password
            onChange={e => setPassword(e.target.value.trim())}
            autoComplete='new-password'
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
          <label htmlFor='confirm_password'>Confirm Password</label>
          <CustomInput
            autoComplete='new-password'
            password
            onChange={e => setConfirmPassword(e.target.value)}
            id='confirm_password'
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
        <div className='items-center w-fit h-fit relative mx-auto'>
          <ArgentinianButton
            text='Register'
            disabled={
              username.length === 0 ||
              password.length === 0 ||
              confirmPassword.length === 0
            }
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

export default RegisterForm;
