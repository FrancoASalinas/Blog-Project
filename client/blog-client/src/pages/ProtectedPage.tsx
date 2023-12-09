import { Navigate } from "react-router-dom";
import Cookies from 'js-cookie'

function ProtectedPage({children}: {children: React.ReactElement}) {
    const sid = Cookies.get('connect.sid');

    return ( sid ? children : <Navigate to='/' /> );
}

export default ProtectedPage;