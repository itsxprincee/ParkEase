import { Link, useNavigate } from "react-router-dom";


function Navbar(){

    const navigate = useNavigate();


    const logout = ()=>{

        localStorage.removeItem("token");

        navigate("/");

    };


    return(

        <nav className="bg-blue-600 text-white p-4 flex justify-between">

            <h1 className="text-2xl font-bold">
                ParkEase
            </h1>


            <div className="flex gap-5">

                <Link to="/">
                    Home
                </Link>


                <Link to="/my-bookings">
                    My Bookings
                </Link>


                <Link to="/qr">
                    QR
                </Link>


                <Link to="/owner">
                    Owner
                </Link>


                <Link to="/add-parking">
                    Add Parking
                </Link>


                <button
                onClick={logout}
                >
                    Logout
                </button>


            </div>


        </nav>

    );

}


export default Navbar;