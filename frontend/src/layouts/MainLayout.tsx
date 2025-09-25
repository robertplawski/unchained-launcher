import Header from '../components/Header';
import { Outlet } from 'react-router';

export default function MainLayout() {
  return (
    <>
      <div className="flex flex-col overflow-hidden text-white h-full max-h-[100vh]  max-w-[100vw]  ">
        <Header />
        <Outlet />

      </div>

    </>
  );
}
