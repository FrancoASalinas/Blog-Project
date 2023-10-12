import ReactDOM from 'react-dom/client';
import Home from './Home.tsx';
import './index.css';
import {
  createBrowserRouter,
  Route,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';

const router = createBrowserRouter(
  createRoutesFromElements(<Route path='/' element={<Home />}></Route>)
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
);
