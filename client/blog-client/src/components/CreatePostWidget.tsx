import imageIcon from '../assets/ImageIcon.svg';
import cross from '../assets/Cross.svg';
import ArgentinianButton from './ArgentinianButton';
import { useEffect, useRef, useState } from 'react';
import Loader from './Loader';

function CreatePostWidget() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState<boolean>(false);

  useEffect(() => {
    function handleChange() {
      if (
        fileInputRef?.current?.files &&
        fileInputRef.current.files.length > 0
      ) {
        const file =
          fileInputRef.current &&
          fileInputRef.current.files &&
          fileInputRef.current.files[0];

        if (file) {
          const fr = new FileReader();
          fr.onloadend = () =>
            setImageSrc(typeof fr.result === 'string' ? fr.result : null);
          fr.readAsDataURL(file);
        }
      }
    }

    fileInputRef.current &&
      fileInputRef.current.addEventListener('change', () => handleChange());

    return fileInputRef.current?.removeEventListener('change', () =>
      handleChange()
    );
  }, []);

  async function handlePost() {
    setIsPosting(true);
    await fetch('http://localhost:5000/posts', {
      method: 'POST',
      body: JSON.stringify({ content: input, image: imageSrc?.split(',')[1] }),
      credentials: 'include',
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    setIsPosting(false);
    setImageSrc(null);
    setInput('');
  }

  function handleDeleteImage() {
    setImageSrc(null);
  }

  return (
    <div className='border border-gray-600 rounded-t-md flex flex-col items-center w-full'>
      <div className=' p-1 divide-x justify-center flex divide-gray-500  border-jeth-24 w-full'>
        <textarea
          className='w-[85%] resize-none h-full p-1 outline-none focus:outline-none'
          placeholder='What are you thinking about?'
          onChange={(e: any) => {
            setInput(e.target.value.trim());
          }}
          value={input === '' ? '' : undefined}
        />
        <div className='p-1 flex-col items-center w-[15%] justify-between flex'>
          <label htmlFor='file' className='cursor-pointer'>
            <input
              type='file'
              id='file'
              ref={fileInputRef}
              className='hidden'
              accept='image/png, image/jpeg'
            />
            <img src={imageIcon} alt='images' />
          </label>
          {isPosting ? (
            <Loader />
          ) : (
            <ArgentinianButton
              text='Post'
              disabled={input.length === 0 || imageSrc === null && input.length === 0}
              width={80}
              textSize='sm'
              p={1}
              onClick={handlePost}
            />
          )}
        </div>
      </div>
      {imageSrc && (
        <>
          <div className='h-[1px] w-full border-t border-gray-500'></div>
          <div className='p-3 relative w-full flex items-center justify-center'>
            <button
              className='w-4 h-4 absolute top-1 right-1'
              onClick={handleDeleteImage}
            >
              <img
                src={cross}
                alt=''
                className='fit w-full h-auto object-none'
              />
            </button>
            <div className='border border-gray-600 w-[60%] h-32 rounded-xl relative overflow-hidden'>
              <img
                src={imageSrc}
                alt='image'
                className='object-cover object-center w-full h-full'
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CreatePostWidget;
