import imageIcon from '../assets/ImageIcon.svg';
import cross from '../assets/Cross.svg';
import ArgentinianButton from './ArgentinianButton';
import { useRef, useState } from 'react';

interface Props {
  onPost: () => void;
  onDeleteImage: () => void;
  imageSrc?: string;
}

function CreatePostWidget({ onPost, imageSrc, onDeleteImage }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');

  function handleClick(e: any) {
    e.preventDefault();
    fileInputRef.current && fileInputRef.current.click();
  }

  return (
    <div className='border border-gray-600 rounded-t-md flex flex-col items-center max-w-sm'>
      <div className=' p-1 divide-x justify-center flex divide-gray-500  border-jeth-24 w-full'>
        <textarea
          className='w-[85%] resize-none h-full p-1 outline-none focus:outline-none'
          placeholder='What are you thinking about?'
          onChange={(e: any) => {
            setInput(e.target.value.trim());
          }}
        />
        <div className='p-1 flex-col items-center w-[15%] justify-between flex'>
          <button onClick={handleClick}>
            <input type='file' ref={fileInputRef} className='hidden' />
            <img src={imageIcon} alt='images' />
          </button>
          <ArgentinianButton
            text='Post'
            disabled={input.length === 0 || imageSrc !== undefined}
            width={80}
            textSize='sm'
            p={1}
            onClick={onPost}
          />
        </div>
      </div>
      {imageSrc && (
        <>
          <div className='h-[1px] w-full border-t border-gray-500'></div>
          <div className='p-3 relative w-full flex items-center justify-center'>
            <button className='w-4 h-4 absolute top-1 right-1' onClick={onDeleteImage}>
              <img src={cross} alt='' className='fit w-full h-full'/>
            </button>
            <div className='border border-gray-600 w-[60%] h-32 rounded-xl relative'>
              <img src={imageSrc} alt='image' className='object-cover object-center w-full h-full' />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CreatePostWidget;
