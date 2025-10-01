import React, { useEffect, useRef } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { GameInfo } from '../types';
import { ChevronDown, LucideDownload, LucidePlay } from 'lucide-react';
import { API_URL } from '../api';
import FocusableItem, { type FocusableItemHandle } from './FocusableItem';

const InstallButton = ({ installed }: { installed?: boolean }) => {

  const focusableItemRef = useRef<FocusableItemHandle>(null);


  useEffect(() => {

    if (!focusableItemRef.current) {
      return
    }
    focusableItemRef.current.focus();
  }, [focusableItemRef])

  return <div className='flex flex-col gap-2 max-w-[16rem]'>
    <div className='flex flex-row'>
      {!installed ?
        <FocusableItem className='inset px-5 rounded-r-none cursor-pointer py-4 rounded-sm w-56 font-bold flex flex-row items-center gap-4 bg-blue-500' ref={focusableItemRef}>

          <LucideDownload strokeWidth={3} />
          Install


        </FocusableItem>
        :

        <FocusableItem ref={focusableItemRef} className='inset px-5 rounded-r-none cursor-pointer py-4 rounded-sm w-56 font-bold flex flex-row items-center gap-4 bg-green-500'>


          <LucidePlay fill="white" strokeWidth={3} />
          Play

        </FocusableItem>

      }
      <FocusableItem className='inset cursor-pointer px-2 py-3 rounded-l-none rounded-sm font-bold flex flex-row items-center gap-4 bg-neutral-600'>
        <ChevronDown fill="white" />
      </FocusableItem>
    </div>
    <div className="hidden w-full bg-neutral-800 ">
      <div className='h-[0.25rem] bg-blue-500 w-[80%]'></div>
    </div>
  </div>

}

const GamePage: React.FC = () => {
  const game = useLoaderData<GameInfo>();
  if (!game) {
    return;
  }
  const { name } = game;
  const installed = game.category == "library"

  const artworks = installed ? game.metadata?.artworks : game.artworks
  const artwork = (installed ? API_URL : "") + artworks?.[artworks?.length - 1]

  return (
    <>
      <img className='-z-100 w-[100vw] h-[30rem] object-[0%_25%] object-cover absolute top-0 left-0' src={artwork} />
      <div className='w-[100vw] h-[30rem] top-0 left-0 absolute -z-100 bg-black/50'></div>
      <p className='text-3xl font-bold p-10 mt-[19rem] absolute'>{name}</p>
      <div className='bg-neutral-900 p-6 px-10 mt-[26.25rem] flex-1  w-full min-h-[100vh] text-lg'>
        <InstallButton installed={installed} />
      </div>
    </>
  );
};

export default GamePage;
