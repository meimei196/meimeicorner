/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home } from './components/Home';
import { BotProfile } from './components/BotProfile';
import { GuidelinesAuth } from './components/GuidelinesAuth';

export default function App() {
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full font-sans overflow-hidden flex flex-col relative selection:bg-zinc-500/30 selection:text-white bg-[#0a0a0a]">
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-500/10 blur-3xl pointer-events-none"></div>
        <GuidelinesAuth onSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full font-sans overflow-hidden flex flex-col relative selection:bg-zinc-500/30 selection:text-white">
      {/* Background Decorators */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-zinc-500/10 blur-3xl pointer-events-none"></div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedBotId ? (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
              <BotProfile botId={selectedBotId} onBack={() => setSelectedBotId(null)} />
            </motion.div>
          ) : (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full overflow-y-auto w-full">
              <Home onSelectBot={setSelectedBotId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
