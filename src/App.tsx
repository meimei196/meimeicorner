/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home } from './components/Home';
import { BotProfile } from './components/BotProfile';
import { ForumPage } from './components/ForumPage';
import { UserAuthModal } from './components/UserAuthModal';
import { GuidelinesAuth } from './components/GuidelinesAuth';
import { RandomHusbandWidget } from './components/RandomHusbandWidget';
import { MusicPlayer } from './components/MusicPlayer';
import { Particles } from './components/Particles';
import { HeartTrail } from './components/HeartTrail';

export default function App() {
  const getInitialStateFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const queryBot = params.get('bot');
    const hash = window.location.hash.replace(/^#\/?/, '');

    if (viewParam === 'forum' || hash === 'forum') {
      return { botId: null, isForum: true };
    }

    if (queryBot) return { botId: queryBot, isForum: false };

    if (hash) {
      if (hash.startsWith('bot=')) return { botId: hash.replace('bot=', ''), isForum: false };
      if (hash !== 'forum') return { botId: hash, isForum: false };
    }
    return { botId: null, isForum: false };
  };

  const [routeState, setRouteState] = useState(getInitialStateFromUrl);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('hasAcceptedDisclaimer') === 'true';
    } catch {
      return false;
    }
  });

  const handleAuthenticated = () => {
    try {
      sessionStorage.setItem('hasAcceptedDisclaimer', 'true');
    } catch {
      // ignore
    }
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const handleUrlChange = () => {
      setRouteState(getInitialStateFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleSelectBot = (id: string | null) => {
    if (id) {
      setRouteState({ botId: id, isForum: false });
      const newUrl = `${window.location.pathname}?bot=${encodeURIComponent(id)}`;
      window.history.pushState({ botId: id }, '', newUrl);
    } else {
      setRouteState({ botId: null, isForum: false });
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const handleOpenForum = () => {
    setRouteState({ botId: null, isForum: true });
    const newUrl = `${window.location.pathname}?view=forum`;
    window.history.pushState({ view: 'forum' }, '', newUrl);
  };

  const handleBackToHome = () => {
    setRouteState({ botId: null, isForum: false });
    window.history.pushState({}, '', window.location.pathname);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full font-sans overflow-hidden flex flex-col relative selection:bg-zinc-500/30 selection:text-white bg-[#0a0a0a]">
        <Particles />
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-500/10 blur-3xl pointer-events-none"></div>
        <GuidelinesAuth onSuccess={handleAuthenticated} />
        <HeartTrail />
      </div>
    );
  }

  return (
    <div className="h-screen w-full font-sans overflow-hidden flex flex-col relative selection:bg-zinc-500/30 selection:text-white">
      <Particles />
      {/* Background Decorators */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-500/10 blur-3xl pointer-events-none"></div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {routeState.isForum ? (
            <motion.div
              key="forum"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full w-full"
            >
              <ForumPage onBack={handleBackToHome} onSelectBot={handleSelectBot} />
            </motion.div>
          ) : routeState.botId ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full w-full"
            >
              <BotProfile botId={routeState.botId} onBack={handleBackToHome} />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto w-full"
            >
              <Home onSelectBot={handleSelectBot} onOpenForum={handleOpenForum} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!routeState.botId && !routeState.isForum && (
        <RandomHusbandWidget onSelectBot={handleSelectBot} />
      )}
      <MusicPlayer />
      <HeartTrail />
      <UserAuthModal />
    </div>
  );
}