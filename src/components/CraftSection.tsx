import {ArrowRight} from 'lucide-react';
import {motion} from 'motion/react';
import {ResilientImage} from './ResilientImage';

interface CraftSectionProps {
  onOpenStudio: () => void;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function CraftSection({onOpenStudio}: CraftSectionProps) {
  return (
    <section className="border-t border-zinc-200 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.2}}
            transition={{duration: 0.6, ease: EASE_OUT_EXPO}}
            className="lg:col-span-6"
          >
            <div className="group h-full min-h-[280px] rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
              <ResilientImage
                src="/src/assets/images/atelier_dtg_craft_1795015675385.jpg"
                alt="Precision screen printing ink and heavyweight cotton fabric inside Kroma Press workshop"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                fallbackTitle="Kroma Press Print Atelier"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.2}}
            transition={{duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO}}
            className="lg:col-span-6 flex flex-col justify-between py-2"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
                Craftsmanship &amp; Print Engineering
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 mb-4"
                style={{textWrap: 'balance'}}
              >
                Built for creators, independent labels, and custom studio drops.
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed mb-6">
                Every blank is pre-treated and cured through dual infrared tunnels so water-based DTG pigments, high-build puff inks, and metallic foils bond directly into combed cotton fibers—surviving 50+ cold washes without cracking.
              </p>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-200 text-xs">
                <div>
                  <dt className="font-semibold text-zinc-950 mb-1">01. Automated Stock Sync</dt>
                  <dd className="text-zinc-600 leading-relaxed">
                    Every checkout atomically deducts blank sizes and triggers low-stock replenishment alerts before bottlenecks happen.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-zinc-950 mb-1">02. Live Print Telemetry</dt>
                  <dd className="text-zinc-600 leading-relaxed">
                    Follow each tee from pre-press color profiling and DTG press bay curing to courier handoff.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pt-8">
              <motion.button
                type="button"
                onClick={onOpenStudio}
                whileHover={{y: -1.5}}
                whileTap={{scale: 0.98}}
                transition={{duration: 0.15}}
                className="inline-flex items-center gap-2 px-5 py-3 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <span>Launch Custom Design Studio</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
