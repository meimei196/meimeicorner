/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home } from './components/Home';
import { BotProfile } from './components/BotProfile';
import { GuidelinesAuth } from './components/GuidelinesAuth';
import { RandomHusbandWidget } from './components/RandomHusbandWidget';
import { MusicPlayer } from './components/MusicPlayer';
import { Particles } from './components/Particles';
import { HeartTrail } from './components/HeartTrail';

export default function App() {
  const getBotFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const queryBot = params.get('bot');
    if (queryBot) return queryBot;

    const hash = window.location.hash.replace(/^#\/?/, '');
    if (hash) {
      if (hash.startsWith('bot=')) return hash.replace('bot=', '');
      return hash;
    }
    return null;
  };

  const [selectedBotId, setSelectedBotId] = useState<string | null>(getBotFromUrl);
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
      setSelectedBotId(getBotFromUrl());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleSelectBot = (id: string | null) => {
    setSelectedBotId(id);
    if (id) {
      const newUrl = `${window.location.pathname}?bot=${encodeURIComponent(id)}`;
      window.history.pushState({ botId: id }, '', newUrl);
    } else {
      window.history.pushState({ botId: null }, '', window.location.pathname);
    }
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
          {selectedBotId ? (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
              <BotProfile botId={selectedBotId} onBack={() => handleSelectBot(null)} />
            </motion.div>
          ) : (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full overflow-y-auto w-full">
              <Home onSelectBot={handleSelectBot} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!selectedBotId && <RandomHusbandWidget onSelectBot={handleSelectBot} />}
      <MusicPlayer />
      <HeartTrail />
    </div>
  );
}