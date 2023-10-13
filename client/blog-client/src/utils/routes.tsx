import { Route } from "react-router-dom";
import App from "../App";
import Home from "../components/Home";

export const routes = <Route element={<App/>} path='/'>
    <Route index element={<Home />} />
</Route>