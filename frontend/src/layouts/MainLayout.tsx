import { RovingFocusGroup } from 'react-roving-focus';
import Header from '../components/Header';
import { Outlet } from 'react-router';
import { useGamepad } from '../components/useGamepad';

export default function MainLayout() {
  useGamepad();
  return (
    <>
      <div className="flex flex-col overflow-hidden text-white h-full max-h-[100vh]  max-w-[100vw]  ">
        <RovingFocusGroup>
          <Header />
          <Outlet />
        </RovingFocusGroup>
      </div>

    </>
  );
}
