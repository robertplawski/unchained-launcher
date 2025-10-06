import { RovingFocusGroup } from 'react-roving-focus';
import Header from '../components/Header';
import { Outlet } from 'react-router';
import { useGamepad } from '../components/useGamepad';
import { Suspense } from 'react';
import Loader from '../components/Loader';

export default function MainLayout() {
  useGamepad();
  return (
    <>
      <div className=" overflow-x-hidden text-white min-h-[100vh] overflow-y-scroll max-w-[100vw]  ">
        <RovingFocusGroup>
          <Header />
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </RovingFocusGroup>
      </div>

    </>
  );
}
