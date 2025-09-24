import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

export default function MainLayout() {
  return (
    <>
      <div className=" text-white relative h-full  max-h-[40rem] max-w-[100vw]  overflow-clip">
        <Header />
        <Outlet />
      </div>
      <div className="text-white bg-black absolute bottom-0 items-center p-4 font-bold px-12  text-xl flex justify-between flex-row  w-full">
        <p>Menu</p>
        <p>Back</p>
      </div>
    </>
  );
}
