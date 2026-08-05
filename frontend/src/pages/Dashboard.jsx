import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";


function Dashboard(){

    const [parking,setParking] = useState([]);


    useEffect(()=>{

        loadParking();

    },[]);



    const loadParking = async()=>{

        try{

            const response = await API.get(
                "/search/parking"
            );

            setParking(response.data);

        }
        catch(error){

            console.log(error);

        }

    };



    return(

        <div className="min-h-screen bg-gray-100 p-8">


            <h1 className="text-4xl font-bold text-center mb-8">
                Find Parking Near You 🚗
            </h1>



            <div className="grid md:grid-cols-3 gap-6">


            {
                parking.map((item)=>(


                    <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-lg p-6"
                    >


                        <h2 className="text-2xl font-bold">
                            {item.name}
                        </h2>


                        <p className="text-gray-600 mt-2">
                            📍 {item.address}
                        </p>


                        <div className="mt-4">

                            <p>
                                Total Slots:
                                {" "}
                                {item.total_slots}
                            </p>


                            <p className="text-green-600 font-bold">
                                Available:
                                {" "}
                                {item.available_slots}
                            </p>


                        </div>



                        <Link
                        to={`/parking/${item.id}`}
                        >


                        <button
                        className="mt-5 w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                        >

                            View Slots

                        </button>


                        </Link>


                    </div>


                ))

            }


            </div>


        </div>

    );

}


export default Dashboard;