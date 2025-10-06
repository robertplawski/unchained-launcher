import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MainLayout from './layouts/MainLayout.tsx';
import SearchPage from './components/SearchPage.tsx';
import AnimatedOutlet from './components/AnimatedOutlet.tsx';
import GamePage from './components/GamePage.tsx';
import { fetchGames, getIgdbGameMetadata, searchGames } from './api.ts';
import PageNotFound from './components/PageNotFound.tsx';
import Index from './components/Index.tsx';


const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "*",
        element: <AnimatedOutlet><PageNotFound /></AnimatedOutlet>
      },
      {
        index: true,
        element: <Index />,
        loader: async () => await fetchGames()
      },
      {
        path: "/search",
        element: <AnimatedOutlet><SearchPage /></AnimatedOutlet>,
        loader: async ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('q') ?? '';
          return await searchGames(q)
        }
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
