import { useEffect, useState } from 'react';
import sayIt from '../assets/SayIt-logo.svg';
import CreatePostWidget from '../components/CreatePostWidget';
import Post from '../components/Post';
import { useNavigate } from 'react-router-dom';
import Cross from '../assets/Cross.svg?react';

export interface Posts {
  posts: {
    post_id: number;
    post_author: number;
    post_body: string;
    post_image?: string;
    post_likes: number;
    user_name: string;
    is_liked: boolean;
  }[];
}

function Feed() {
  const [posts, setPosts] = useState<Posts['posts']>([]);
  const [biggerImage, setBiggerImage] = useState<null | string>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/posts?order=likes', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then((data: Posts) => setPosts(data.posts));
  }, []);

  async function refreshPost(postId: Posts['posts'][0]['post_id']) {
    await fetch(`http://localhost:5000/posts/${postId}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) {
          console.log('error');
          return;
        }
        return res.json();
      })
      .then((data: Posts['posts'][0]) =>
        setPosts(prev =>
          prev.map(post =>
            post.post_id === data.post_id ? (post = data) : post
          )
        )
      );
  }

  return (
    <>
      <div className='mx-auto max-w-[500px]'>
        <CreatePostWidget
          successfullPost={(post: any) => {
            setPosts(prev => [post, ...prev]);
          }}
        />
        {posts.length > 0 &&
          posts.map(post => (
            <Post
              isLiked={post.is_liked}
              userName={post.user_name}
              likes={post.post_likes}
              userImage={sayIt}
              postContent={post.post_body}
              postImage={post.post_image && post.post_image}
              onPost={() => {
                navigate(`/posts/${post.post_id}`);
              }}
              onClickUsername={e => {
                e.stopPropagation();
                navigate(`/profile/${post.post_author}`);
              }}
              onComment={e => {
                e.stopPropagation();
                navigate(`/posts/${post.post_id}#add-comment`);
              }}
              onImage={e => {
                e.stopPropagation();
                setBiggerImage(post.post_image || null);
              }}
              onLike={async e => {
                e.stopPropagation();
                post.is_liked = !post.is_liked;
                await fetch(
                  `http://localhost:5000/posts/${post.post_id}/likes`,
                  {
                    method: 'POST',
                    credentials: 'include',
                  }
                )
                  .then(res => {
                    if (res.ok) {
                      return;
                    } else {
                      post.is_liked = !post.is_liked;
                    }
                  })
                  .catch(err => {
                    console.log(err);
                    post.is_liked = !post.is_liked;
                  });

                refreshPost(post.post_id);
              }}
              onShare={e => {
                e.stopPropagation();
                console.log('share');
              }}
              comments={5}
              shares={89}
              key={post.post_id}
            />
          ))}
        {biggerImage && (
          <>
            <div className='fixed w-full h-full top-0 left-0 bg-black opacity-70'></div>
            <div className='mx-auto  overflow-hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full flex justify-center items-center'>
              <button
                className='w-8 h-8 absolute top-1 left-1'
                onClick={() => setBiggerImage(null)}
              >
                <Cross className='fill-white opacity-50 hover:opacity-100 transition-all w-full h-full' />
              </button>
              <div className='max-w-full w-full h-full overflow-hidden max-h-full'>
                <img
                  src={biggerImage}
                  className='object-contain w-full h-full'
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Feed;
