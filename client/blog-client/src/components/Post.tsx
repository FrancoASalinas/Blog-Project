/// <reference types="vite-plugin-svgr/client" />
import Share from '../assets/share.svg?react';
import Like from '../assets/heart.svg?react';
import Comment from '../assets/comment.svg?react';

interface Props {
  onClickUsername: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onImage: () => void;
  userName: string;
  userImage: string;
  postContent?: string;
  postImage?: string;
}

function Post({ postContent, userImage, userName, postImage, onClickUsername }: Props) {
  return (
    <div className='grid grid-rows-[40px_max-content_minmax(0px,max-content)_40px] grid-cols-[40px_200px] pb-0 gap-x-2'>
      <div className='w-[40px] h-[40px] border-jet rounded-full border row-start-1 col-start-1 self-center justify-self-center overflow-hidden flex items-center'>
        <img src={userImage} alt='profile picture' className='object-center object-contain' />
      </div>
      <span onClick={onClickUsername} className='self-center hover:cursor-pointer justify-self-start'>{userName}</span>
      <div className='col-start-2 col-end-3 row-start-2 justify-self-center flex justify-center items-center self-center row-end-3 w-full py-2'>
        <p className='w-full break-words'>{postContent}</p>
      </div>
      {postImage && (
        <div className='w-[80%] mx-auto border-jet overflow-hidden rounded-xl border h-full col-start-2 col-end-3 row-start-3 row-end-4'>
          <img src={postImage} className='hover:cursor-pointer object-cover w-full object-center' />
        </div>
      )}
      <div className='col-start-2 col-end-3 items-center row-start-4 flex justify-around w-full'>
        <button className='rounded-xl cursor-pointer'>
          <Like />
        </button>
        <button className='rounded-xl cursor-pointer'>
          <Comment />
        </button>
        <button className='rounded-xl cursor-pointer'>
          <Share />
        </button>
      </div>
    </div>
  );
}

export default Post;
