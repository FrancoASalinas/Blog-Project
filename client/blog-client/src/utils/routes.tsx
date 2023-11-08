import { Route } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import Register from '../pages/Register'
import RegisterForm from "../pages/RegisterForm";
import RegisterSuccess from "../pages/RegisterSuccess";
import Login from "../pages/Login";
import LoginForm from "../pages/LoginForm";

export const routes = <Route element={<App/>} path='/'>
    <Route index element={<Home />} />
    <Route path='register' element={<Register />}>
        <Route index element={<RegisterForm />}/>
        <Route path='success' element={<RegisterSuccess />}/>
    </Route>
    <Route path="login" element={<Login />} >
        <Route index element={<LoginForm />} />
    </Route>
</Route>