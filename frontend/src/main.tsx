import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainLayout from './layouts/MainLayout.tsx';
import GameList from './components/GameList.tsx';
import SearchPage from './components/SearchPage.tsx';
import AnimatedOutlet from './components/AnimatedOutlet.tsx';
import GamePage from './components/GamePage.tsx';
import { getIgdbGameMetadata } from './api.ts';


const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <AnimatedOutlet><GameList /></AnimatedOutlet>
      },
      {
        path: "/search",
        element: <AnimatedOutlet><SearchPage /></AnimatedOutlet>
      },
      {
        path: "/game/:gameId",
        element: <AnimatedOutlet><GamePage /></AnimatedOutlet>,
        loader: async ({ params }) => await getIgdbGameMetadata(params.gameId as string || "")
      }
    ]
  }
])
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
