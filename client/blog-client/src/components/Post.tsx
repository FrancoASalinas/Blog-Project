/// <reference types="vite-plugin-svgr/client" />
import Share from '../assets/share.svg?react';
import Like from '../assets/heart.svg?react';
import Comment from '../assets/comment.svg?react';
import { MouseEvent } from 'react';

interface Props {
  onClickUsername: (e: MouseEvent<any>) => void;
  onLike: (e: MouseEvent<any>) => void;
  onPost: () => void;
  isLiked: boolean;
  likes: number;
  comments: number;
  shares: number;
  onComment: (e: MouseEvent<any>) => void;
  onShare: (e: MouseEvent<any>) => void;
  onImage: (e: MouseEvent<any>) => void;
  userName: string;
  userImage: string;
  postContent?: string;
  postImage?: string;
}

function Post({
  postContent,
  likes,
  onComment,
  onImage,
  onLike,
  onShare,
  onPost,
  comments,
  shares,
  isLiked,
  userImage,
  userName,
  postImage,
  onClickUsername,
}: Props) {
  return (
    <div onClick={onPost} className='grid grid-rows-[40px_max-content_minmax(0px,max-content)_40px] grid-cols-[40px_1fr] w-full pb-0 hover:bg-opacity-5 p-2 hover:bg-black hover:cursor-pointer gap-x-2'>
      <div className='w-[40px] h-[40px] border-jet rounded-full border row-start-1 col-start-1 self-center justify-self-center overflow-hidden flex items-center'>
        <img
          src={userImage}
          alt='profile picture'
          className='object-center object-contain'
          onClick={onClickUsername}
        />
      </div>
      <span
        onClick={onClickUsername}
        className='self-center hover:cursor-pointer justify-self-start'
      >
        {userName}
      </span>
      <div className='col-start-2 col-end-3 row-start-2 justify-self-center flex justify-center items-center self-center row-end-3 w-full py-2'>
        <p className='w-full break-words'>{postContent}</p>
      </div>
      {postImage && (
        <div className='w-[80%] mx-auto border-jet overflow-hidden rounded-xl border h-full col-start-2 col-end-3 row-start-3 row-end-4'>
          <img
            onClick={onImage}
            src={postImage}
            className='hover:cursor-pointer object-cover w-full object-center'
          />
        </div>
      )}
      <div className='col-start-2 col-end-3 items-center row-start-4 flex justify-around w-full'>
        <div className='flex justify-center items-center gap-1'>
          <button onClick={onLike} className='rounded-xl cursor-pointer'>
            <Like className={`${isLiked ? 'fill-red-500' : 'fill-jet'} hover:scale-110 transition-all`} />
          </button>
          <div>{likes > 0 && likes}</div>
        </div>
        <div className='flex justify-center items-center gap-1'>
          <button onClick={onComment} className='rounded-xl cursor-pointer'>
            <Comment className='fill-jet hover:scale-110 transition-all' />
          </button>
          <div>{comments > 0 && comments}</div>
        </div>
        <div className='flex justify-center items-center gap-1'>
          <button onClick={onShare} className='rounded-xl cursor-pointer'>
            <Share className='fill-jet hover:scale-110 transition-all' />
          </button>
          <div>{shares > 0 && shares}</div>
        </div>
      </div>
    </div>
  );
}

export default Post;
